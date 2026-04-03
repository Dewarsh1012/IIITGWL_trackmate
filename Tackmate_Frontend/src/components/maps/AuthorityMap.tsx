import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap, Marker, Tooltip, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { ZoneData } from './TouristMap';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons
const incidentIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const RISK_COLORS: Record<string, string> = {
    safe: '#34D399',
    moderate: '#FBBF24',
    high: '#F87171',
    restricted: '#A78BFA',
};

function RecenterMap({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true });
    }, [lat, lng, zoom, map]);
    return null;
}

// Fixes grey tiles by forcing Leaflet to recalculate its container size
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 250);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}

interface AuthorityMapProps {
    zones: ZoneData[];
    incidents: any[];
    userLocations: Record<string, { lat: number; lng: number; role?: string; name?: string; timestamp?: number }>;
    focusLocation?: { lat: number; lng: number } | null;
    onZoneCreated?: (layer: any, color?: string) => void;
    drawColor?: string;
}

export default function AuthorityMap({ zones, incidents, userLocations, focusLocation, onZoneCreated, drawColor = '#FF0033' }: AuthorityMapProps) {
    const safeZones = zones || [];
    const safeIncidents = incidents || [];
    const safeUserLocations = userLocations || {};

    const defaultCenter: [number, number] = [27.5866, 91.8698]; // Tawang

    // Determine center based on focus or default
    const centerLat = focusLocation?.lat || defaultCenter[0];
    const centerLng = focusLocation?.lng || defaultCenter[1];

    return (
        <div style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)', boxShadow: 'var(--clay-shadow-sm)' }}>
            <MapContainer
                center={[centerLat, centerLng] as [number, number]}
                zoom={focusLocation ? 16 : 12}
                style={{ height: '100%', width: '100%', background: 'var(--color-bg-deep)' }}
            >
                <MapResizer />
                <TileLayer
                    attribution='&copy; OpenStreetMap'
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />

                <RecenterMap lat={centerLat} lng={centerLng} zoom={focusLocation ? 16 : undefined} />

                {/* Zone overlays */}
                {safeZones.filter(z => typeof z.center_lat === 'number' && typeof z.center_lng === 'number').map((zone) => {
                    const color = RISK_COLORS[zone.risk_level] || '#6b7280';
                    if (zone.geojson) {
                        return (
                            <GeoJSON
                                key={zone._id}
                                data={zone.geojson as any}
                                style={{
                                    color: color,
                                    fillColor: color,
                                    fillOpacity: 0.15,
                                    weight: 1.5,
                                    dashArray: '4 4',
                                }}
                                onEachFeature={(_, layer) => {
                                    const labelColor = (zone.risk_level === 'safe' || zone.risk_level === 'moderate') ? '#000' : '#fff';
                                    layer.bindPopup(
                                        `<div style="min-width:140px;">
                      <div style="font-weight:700;font-size:13px;margin-bottom:4px;">${zone.name}</div>
                      <div style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;color:${labelColor};background:${color};">${zone.risk_level}</div>
                    </div>`
                                    );
                                }}
                            />
                        );
                    }
                    return (
                        <Circle
                            key={zone._id}
                            center={[zone.center_lat, zone.center_lng]}
                            radius={zone.radius_meters}
                            pathOptions={{
                                color: color,
                                fillColor: color,
                                fillOpacity: 0.15,
                                weight: 1.5,
                                dashArray: '4 4',
                            }}
                        >
                            <Popup>
                                <div style={{ minWidth: 140 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{zone.name}</div>
                                    <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: (zone.risk_level === 'safe' || zone.risk_level === 'moderate') ? '#000' : '#fff', background: color }}>
                                        {zone.risk_level}
                                    </div>
                                </div>
                            </Popup>
                        </Circle>
                    );
                })}

                {/* Real-time User Locations */}
                {Object.entries(safeUserLocations).map(([userId, loc]) => {
                    if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;
                    // Check if active (within last 5 mins)
                    const isActive = loc.timestamp ? (Date.now() - loc.timestamp) < 5 * 60 * 1000 : true;
                    if (!isActive) return null;

                    const color = loc.role === 'tourist'
                        ? '#6C63FF'
                        : (loc.role === 'resident' ? '#34D399' : (loc.role === 'business' ? '#FBBF24' : '#94a3b8'));

                    return (
                        <CircleMarker
                            key={userId}
                            center={[loc.lat, loc.lng]}
                            radius={6}
                            pathOptions={{ fillColor: color, color: '#fff', weight: 1.5, fillOpacity: 0.9 }}
                        >
                            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                                <div className="text-xs font-bold">{loc.name || 'User'}</div>
                                <div className="text-[9px] uppercase tracking-wider opacity-80">{loc.role || 'Unknown'}</div>
                            </Tooltip>
                        </CircleMarker>
                    );
                })}

                {/* Incidents (SOS, Anomalies) */}
                {safeIncidents.filter(i => i.status !== 'resolved').map((incident) => {
                    if (typeof incident.latitude !== 'number' || typeof incident.longitude !== 'number') return null;

                    return (
                        <Marker
                            key={`inc-${incident._id}`}
                            position={[incident.latitude, incident.longitude]}
                            icon={incidentIcon}
                        >
                            <Popup>
                                <div className="text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                                    <div className="font-bold text-red-600 mb-1">{incident.title}</div>
                                    <div className="text-xs font-semibold mb-2 p-1 bg-red-100 text-red-700 rounded uppercase inline-block border border-red-700">
                                        {incident.severity}
                                    </div>
                                    {incident.description && (
                                        <div className="text-xs text-slate-800 border-t border-slate-300 pt-1 mt-1">{incident.description}</div>
                                    )}
                                    {incident.reporter?.full_name && (
                                        <div className="text-[10px] text-slate-500 mt-2">Reported by: {incident.reporter.full_name}</div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}

                <DrawControl onZoneCreated={onZoneCreated} drawColor={drawColor} />
            </MapContainer>
        </div>
    );
}

// Separate component for drawing tools to use map context
function DrawControl({ onZoneCreated, drawColor = '#FF0033' }: { onZoneCreated?: (layer: L.Layer, color?: string) => void, drawColor?: string }) {
    const map = useMap();
    const onZoneCreatedRef = useRef(onZoneCreated);

    useEffect(() => {
        onZoneCreatedRef.current = onZoneCreated;
    }, [onZoneCreated]);

    useEffect(() => {
        let drawControl: any;
        let drawnItems: L.FeatureGroup;
        let handleDrawCreated: any;
        let isMounted = true;

        // Dynamic import to avoid SSR issues if ever ported to Next.js
        import('leaflet-draw').then(() => {
            if (!isMounted) return;

            drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);

            drawControl = new (L.Control as any).Draw({
                edit: { featureGroup: drawnItems },
                draw: {
                    polygon: {
                        shapeOptions: { color: drawColor, weight: 2, fillOpacity: 0.2 },
                        allowIntersection: false,
                    },
                    circle: {
                        shapeOptions: { color: drawColor, weight: 2, fillOpacity: 0.2 },
                    },
                    rectangle: false,
                    marker: false,
                    circlemarker: false,
                    polyline: false,
                }
            });
            map.addControl(drawControl);

            handleDrawCreated = (e: any) => {
                const layer = e.layer;
                // Don't add to drawnItems so it vanishes immediately, 
                // because the Dashboard will add the true Zone to the map.
                if (onZoneCreatedRef.current) onZoneCreatedRef.current(layer, drawColor);
            };

            map.on((L.Draw as any).Event.CREATED, handleDrawCreated);
        });

        return () => {
            isMounted = false;
            if (drawControl) map.removeControl(drawControl);
            if (handleDrawCreated) map.off((L.Draw as any).Event.CREATED, handleDrawCreated);
            if (drawnItems) map.removeLayer(drawnItems);
        };
    }, [map, drawColor]);

    return null;
}

