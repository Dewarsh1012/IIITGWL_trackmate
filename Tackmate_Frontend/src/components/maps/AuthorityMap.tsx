import { MapContainer, TileLayer, CircleMarker, Circle, Popup, useMap, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
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
}

export default function AuthorityMap({ zones, incidents, userLocations, focusLocation }: AuthorityMapProps) {
  const safeZones = zones || [];
  const safeIncidents = incidents || [];
  const safeUserLocations = userLocations || {};

  const defaultCenter: [number, number] = [27.5866, 91.8698]; // Tawang

  // Determine center based on focus or default
  const centerLat = focusLocation?.lat || defaultCenter[0];
  const centerLng = focusLocation?.lng || defaultCenter[1];

  return (
    <div style={{ height: '100%', width: '100%', minHeight: '500px', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #1E293B' }}>
      <MapContainer 
        center={[centerLat, centerLng] as [number, number]} 
        zoom={focusLocation ? 16 : 12} 
        style={{ height: '100%', width: '100%', background: '#0a0f1e' }}
      >
        <MapResizer />
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <RecenterMap lat={centerLat} lng={centerLng} zoom={focusLocation ? 16 : undefined} />

        {/* Zone overlays */}
        {safeZones.filter(z => typeof z.center_lat === 'number' && typeof z.center_lng === 'number').map((zone) => {
          const color = RISK_COLORS[zone.risk_level] || '#6b7280';
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
                  <div style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#fff', background: color }}>
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

          const color = loc.role === 'tourist' ? '#22c55e' : (loc.role === 'resident' ? '#3b82f6' : '#94a3b8');
          
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
                <div className="text-sm">
                  <div className="font-bold text-red-600 mb-1">{incident.title}</div>
                  <div className="text-xs font-semibold mb-2 p-1 bg-red-100 text-red-700 rounded uppercase inline-block">
                    {incident.severity}
                  </div>
                  {incident.description && (
                    <div className="text-xs text-slate-600 border-t pt-1 mt-1">{incident.description}</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
