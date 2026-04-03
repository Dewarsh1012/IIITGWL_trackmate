import { IZone } from '../types';

const EARTH_RADIUS_KM = 6371;

type GeoJsonPolygon = { type: 'Polygon'; coordinates: number[][][] };
type GeoJsonMultiPolygon = { type: 'MultiPolygon'; coordinates: number[][][][] };
type GeoJsonGeometry = GeoJsonPolygon | GeoJsonMultiPolygon;
type GeoJsonFeature = { type: 'Feature'; geometry: GeoJsonGeometry | null };
type GeoJsonFeatureCollection = { type: 'FeatureCollection'; features: GeoJsonFeature[] };

function isPointInRing(point: [number, number], ring: number[][]): boolean {
    if (!Array.isArray(ring) || ring.length < 3) return false;
    const [x, y] = point;
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0];
        const yi = ring[i][1];
        const xj = ring[j][0];
        const yj = ring[j][1];
        if (![xi, yi, xj, yj].every(Number.isFinite)) continue;
        const intersect = (yi > y) !== (yj > y) &&
            x < ((xj - xi) * (y - yi)) / ((yj - yi) || 1e-12) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

function isPointInPolygon(point: [number, number], polygon: number[][][]): boolean {
    if (!Array.isArray(polygon) || polygon.length === 0) return false;
    const [outer, ...holes] = polygon;
    if (!isPointInRing(point, outer)) return false;
    for (const hole of holes) {
        if (isPointInRing(point, hole)) return false;
    }
    return true;
}

function getGeoJsonGeometries(geojson: unknown): GeoJsonGeometry[] {
    if (!geojson || typeof geojson !== 'object') return [];
    const type = (geojson as { type?: string }).type;
    if (type === 'Polygon' || type === 'MultiPolygon') return [geojson as GeoJsonGeometry];
    if (type === 'Feature') {
        const geometry = (geojson as GeoJsonFeature).geometry;
        return geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') ? [geometry] : [];
    }
    if (type === 'FeatureCollection') {
        const features = (geojson as GeoJsonFeatureCollection).features || [];
        return features.flatMap((feature) => {
            const geometry = feature?.geometry;
            if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) return [geometry];
            return [];
        });
    }
    return [];
}

function isPointInGeojson(lat: number, lon: number, geojson: GeoJsonGeometry): boolean {
    const point: [number, number] = [lon, lat];
    if (geojson.type === 'Polygon') {
        return isPointInPolygon(point, geojson.coordinates);
    }
    return geojson.coordinates.some((poly) => isPointInPolygon(point, poly));
}

/**
 * Calculates the Haversine distance between two GPS coordinates, in kilometres.
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

/**
 * Returns distance in metres between two points.
 */
export function distanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return haversineDistance(lat1, lon1, lat2, lon2) * 1000;
}

/**
 * Determines if a point (lat, lon) falls within a circular zone.
 */
export function isPointInZone(lat: number, lon: number, zone: IZone): boolean {
    const geometries = getGeoJsonGeometries(zone.geojson);
    if (geometries.length > 0) {
        return geometries.some((geometry) => isPointInGeojson(lat, lon, geometry));
    }
    const dist = distanceInMeters(lat, lon, zone.center_lat, zone.center_lng);
    return dist <= zone.radius_meters;
}

/**
 * Given a list of active zones, returns the one with the lowest risk level
 * that contains the point. Returns null if no zone matches.
 */
const RISK_ORDER: Record<string, number> = {
    safe: 0,
    moderate: 1,
    high: 2,
    restricted: 3,
};

export function findZoneForPoint(
    lat: number,
    lon: number,
    zones: IZone[]
): IZone | null {
    const matching = zones.filter((z) => z.is_active && isPointInZone(lat, lon, z));
    if (matching.length === 0) return null;
    return matching.sort(
        (a, b) => RISK_ORDER[a.risk_level] - RISK_ORDER[b.risk_level]
    )[0];
}

/**
 * Calculates speed in km/h between two location records.
 */
export function calculateSpeed(
    lat1: number, lon1: number, time1: Date,
    lat2: number, lon2: number, time2: Date
): number {
    const distKm = haversineDistance(lat1, lon1, lat2, lon2);
    const timeDiffHours = Math.abs(time2.getTime() - time1.getTime()) / (1000 * 60 * 60);
    if (timeDiffHours === 0) return 0;
    return distKm / timeDiffHours;
}
