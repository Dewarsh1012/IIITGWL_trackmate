import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
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

function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], 15);
  }, [lat, lng, map]);
  return null;
}

interface TouristMapProps {
  lat: number | null;
  lng: number | null;
  zones?: any[];
}

export default function TouristMap({ lat, lng, zones = [] }: TouristMapProps) {
  const defaultCenter: [number, number] = [27.5866, 91.8698]; // Tawang

  return (
    <div style={{ height: '400px', width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
      <MapContainer center={lat && lng ? [lat, lng] : defaultCenter} zoom={13} style={{ height: '100%', width: '100%', background: 'var(--color-bg-deep)' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {lat && lng && (
          <>
            <RecenterMap lat={lat} lng={lng} />
            <CircleMarker 
              center={[lat, lng]} 
              radius={8}
              pathOptions={{ fillColor: 'var(--color-primary)', color: '#fff', weight: 2, fillOpacity: 1 }}
            />
            {/* Ping animation effect */}
            <CircleMarker 
              center={[lat, lng]} 
              radius={24}
              className="pulse-ping"
              pathOptions={{ fillColor: 'var(--color-primary)', color: 'transparent', fillOpacity: 0.2 }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
