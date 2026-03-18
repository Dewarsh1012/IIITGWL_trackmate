import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const RISK_COLORS: Record<string, string> = {
  safe: '#22c55e',
  moderate: '#f59e0b',
  high: '#ef4444',
  restricted: '#7c3aed',
};

function RecenterMap({ lat, lng, zoom }: { lat: number; lng: number; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], zoom ?? map.getZoom(), { animate: true });
  }, [lat, lng, zoom, map]);
  return null;
}

export interface ZoneData {
  _id: string;
  name: string;
  risk_level: 'safe' | 'moderate' | 'high' | 'restricted';
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  description?: string;
}

interface TouristMapProps {
  lat: number | null;
  lng: number | null;
  zones?: ZoneData[];
  highlightZoneId?: string | null;
}

export default function TouristMap({ lat, lng, zones = [], highlightZoneId }: TouristMapProps) {
  const defaultCenter: [number, number] = [27.5866, 91.8698]; // Tawang
  const center = lat && lng ? [lat, lng] : defaultCenter;

  // Find highlighted zone to recenter on it
  const highlightedZone = highlightZoneId ? zones.find(z => z._id === highlightZoneId) : null;
  const recenterLat = highlightedZone ? highlightedZone.center_lat : (lat || defaultCenter[0]);
  const recenterLng = highlightedZone ? highlightedZone.center_lng : (lng || defaultCenter[1]);
  const recenterZoom = highlightedZone ? 15 : undefined;

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer center={center as [number, number]} zoom={13} style={{ height: '100%', width: '100%', background: 'var(--color-bg-deep)' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <RecenterMap lat={recenterLat} lng={recenterLng} zoom={recenterZoom} />

        {/* User position */}
        {lat && lng && (
          <>
            <CircleMarker 
              center={[lat, lng]} 
              radius={8}
              pathOptions={{ fillColor: '#1a57db', color: '#fff', weight: 2, fillOpacity: 1 }}
            >
              <Popup>
                <div style={{ textAlign: 'center', fontWeight: 600, fontSize: 12 }}>
                  📍 Your Location
                </div>
              </Popup>
            </CircleMarker>
            {/* Ping animation effect */}
            <CircleMarker 
              center={[lat, lng]} 
              radius={24}
              className="pulse-ping"
              pathOptions={{ fillColor: '#1a57db', color: 'transparent', fillOpacity: 0.2 }}
            />
          </>
        )}

        {/* Zone overlays */}
        {zones.map((zone) => {
          const color = RISK_COLORS[zone.risk_level] || '#6b7280';
          const isHighlighted = zone._id === highlightZoneId;
          return (
            <Circle
              key={zone._id}
              center={[zone.center_lat, zone.center_lng]}
              radius={zone.radius_meters}
              pathOptions={{
                color: isHighlighted ? '#fff' : color,
                fillColor: color,
                fillOpacity: isHighlighted ? 0.4 : 0.15,
                weight: isHighlighted ? 3 : 1.5,
                dashArray: isHighlighted ? undefined : '4 4',
              }}
            >
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{zone.name}</div>
                  <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', background: color }}>
                    {zone.risk_level}
                  </div>
                  {zone.description && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{zone.description}</div>
                  )}
                </div>
              </Popup>
            </Circle>
          );
        })}
      </MapContainer>
    </div>
  );
}
