import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import TouristMap from '../../components/maps/TouristMap';
import type { ZoneData } from '../../components/maps/TouristMap';
import { Link } from 'react-router-dom';
import { 
  Map as MapIcon, AlertTriangle, ShieldAlert, 
  Watch, Shield, Loader2, Check, RefreshCw, 
  Navigation as NearMe, Calendar, CheckCircle2,
  X, Send, MapPin, Radio, Bluetooth, Wifi
} from 'lucide-react';
import AlertPanel from '../../components/alerts/AlertPanel';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1); const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function NBToast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? NB.mint : type === 'error' ? NB.red : NB.blue;
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: bg, color: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.88rem' }}>
      {type === 'success' ? <Check size={16} /> : type === 'error' ? <X size={16} /> : <Radio size={16} />}
      {message}
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', marginLeft: 8 }}><X size={12} /></button>
    </div>
  );
}

function NBModal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 484, background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `6px 6px 0 ${NB.black}`, fontFamily: "'Space Grotesk', sans-serif" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: `3px solid ${NB.black}`, background: NB.yellow }}>
          <h3 style={{ fontWeight: 800, color: NB.black, margin: 0, fontSize: '1rem' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}

export default function TouristDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const sosIntervalRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [highlightZoneId, setHighlightZoneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [updateTripModalOpen, setUpdateTripModalOpen] = useState(false);
  const [iotModalOpen, setIotModalOpen] = useState(false);

  // ── GPS tracking ─────────────────────────────────────────────────────

  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => { setUserLat(27.5855); setUserLng(91.8594); },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } else { setUserLat(27.5855); setUserLng(91.8594); }
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  // Emit location via socket every 5 seconds for live tracking
  useEffect(() => {
    if (!socket || !user || !userLat || !userLng) return;
    const interval = setInterval(() => {
      socket.emit('location_update', { userId: user.id, latitude: userLat, longitude: userLng });
    }, 5000);
    return () => clearInterval(interval);
  }, [socket, user, userLat, userLng]);

  // Listen for zone alerts from backend
  useEffect(() => {
    if (!socket) return;
    const handleZoneAlert = (data: any) => {
      const color = data.zone?.risk_level === 'high' || data.zone?.risk_level === 'restricted' ? 'error' : 'info';
      setToast({ message: data.message, type: color as any });
    };
    socket.on('zone_alert', handleZoneAlert);
    return () => { socket.off('zone_alert', handleZoneAlert); };
  }, [socket]);

  const fetchTouristData = useCallback(async () => {
    try {
      const [tripRes, alertsRes, zonesRes] = await Promise.all([api.get('/trips/active'), api.get('/incidents?limit=10'), api.get('/zones')]);
      if (tripRes.data.success) setActiveTrip(tripRes.data.data);
      if (alertsRes.data.success) setAlerts(alertsRes.data.data || []);
      if (zonesRes.data.success) setZones(zonesRes.data.data || []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchTouristData();
    const interval = setInterval(fetchTouristData, 30000);
    if (socket) { socket.on('new-incident', (inc: any) => setAlerts(prev => [inc, ...prev])); }
    return () => { clearInterval(interval); if (socket) socket.off('new-incident'); };
  }, [socket, fetchTouristData]);

  const handleCheckin = async () => {
    if (!userLat || !userLng) { setToast({ message: 'Unable to get your location', type: 'error' }); return; }
    setCheckinLoading(true);
    try {
      const res = await api.post('/locations', { latitude: userLat, longitude: userLng, source: 'gps' });
      setCheckinDone(true);
      const zone = res.data.data?.zone;
      setToast({ message: zone ? `Checked in at ${zone.name}` : 'Daily check-in recorded ✓', type: 'success' });
      setTimeout(() => setCheckinDone(false), 5000);
    } catch { setToast({ message: 'Check-in failed. Try again.', type: 'error' }); } finally { setCheckinLoading(false); }
  };

  const handleVerifyStay = async () => {
    if (!userLat || !userLng) { setToast({ message: 'Unable to get location', type: 'error' }); return; }
    try {
      const res = await api.post('/locations', { latitude: userLat, longitude: userLng, source: 'gps' });
      const zone = res.data.data?.zone;
      if (zone) { setVerifyResult(`✓ You are in "${zone.name}" — ${zone.risk_level} zone`); setHighlightZoneId(zone._id); setTimeout(() => setHighlightZoneId(null), 8000); }
      else { setVerifyResult('ℹ You are not inside any registered zone'); }
      setTimeout(() => setVerifyResult(null), 6000);
    } catch { setToast({ message: 'Verification failed', type: 'error' }); }
  };

  const handleSafeHouse = () => {
    if (!userLat || !userLng) { setToast({ message: 'Unable to get location', type: 'error' }); return; }
    const safeZones = zones.filter(z => z.risk_level === 'safe');
    if (safeZones.length === 0) { setToast({ message: 'No safe zones in area', type: 'info' }); return; }
    let nearest = safeZones[0]; let minDist = haversine(userLat, userLng, nearest.center_lat, nearest.center_lng);
    for (const z of safeZones) { const d = haversine(userLat, userLng, z.center_lat, z.center_lng); if (d < minDist) { nearest = z; minDist = d; } }
    setHighlightZoneId(nearest._id);
    setToast({ message: `Nearest safe zone: ${nearest.name} (${Math.round(minDist)}m)`, type: 'success' });
    setTimeout(() => setHighlightZoneId(null), 10000);
  };

  const handleSOSStart = () => {
    if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
    setCountdown(3);
    sosIntervalRef.current = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
  };

  const handleSOSEnd = () => { 
    if (sosIntervalRef.current) { clearInterval(sosIntervalRef.current); sosIntervalRef.current = null; } 
    setCountdown(0); 
  };

  useEffect(() => {
    if (countdown === 0 && sosIntervalRef.current) {
      clearInterval(sosIntervalRef.current);
      sosIntervalRef.current = null;
      triggerSOS();
    }
  }, [countdown]);

  const triggerSOS = async () => {
    setSosLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej)).catch(() => null);
      await api.post('/incidents', { title: 'EMERGENCY SOS TRIGGERED', incident_type: 'sos_emergency', severity: 'critical', source: 'sos_panic', latitude: pos?.coords.latitude || userLat || 27.5855, longitude: pos?.coords.longitude || userLng || 91.8594, is_public: true });
      setSosSuccess(true); setTimeout(() => setSosSuccess(false), 5000);
    } catch { setToast({ message: 'SOS transmission failed!', type: 'error' }); } finally { setSosLoading(false); }
  };

  const filteredZones = searchQuery.trim() ? zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase())) : zones;

  const safetyScore = user?.safety_score ?? 85;

  return (
    <div style={{ background: NB.cream, minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif", padding: '0 0 80px' }}>
      {toast && <NBToast {...toast} onClose={() => setToast(null)} />}

      {/* Safety Banner */}
      <div className="top-header responsive-container" style={{ background: NB.black, borderBottom: `3px solid ${NB.black}`, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: NB.mint, border: `2px solid ${NB.mint}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Shield size={20} color={NB.black} /></div>
          <div>
            <h2 style={{ color: NB.white, fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>System Protected — Monitoring Active</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>Your location is being monitored by {activeTrip?.destination_region || 'local authorities'}.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertPanel />
          <div style={{ background: NB.yellow, border: `2px solid ${NB.yellow}`, padding: '6px 14px', fontWeight: 800, fontSize: '0.78rem', textTransform: 'uppercase', color: '#000000' }}>Safety Score: {safetyScore}%</div>
        </div>
      </div>

      <div className="responsive-grid responsive-container" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, padding: '20px 24px', maxWidth: 1440, margin: '0 auto' }}>
        {/* Map column */}
        <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, overflow: 'hidden', minHeight: 600, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, color: NB.black, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><MapIcon size={16} /> Live Safety GIS</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ label: 'Safe', color: NB.mint }, { label: 'Moderate', color: NB.orange }, { label: 'Restricted', color: NB.red }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', background: '#FFFFFF', color: '#000000', border: `1.5px solid ${NB.black}` }}>
                  <div style={{ width: 8, height: 8, background: l.color }} />{l.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ position: 'relative', flex: 1, minHeight: 400 }}>
            <TouristMap lat={userLat} lng={userLng} zones={zones} highlightZoneId={highlightZoneId} />
            {/* Search */}
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 100, width: 260 }}>
              <div style={{ position: 'relative' }}>
                <MapPin size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: NB.black }} />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search zones..." style={{ width: '100%', padding: '9px 12px 9px 30px', background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.8rem', fontWeight: 600, outline: 'none' }} />
              </div>
              {searchQuery.trim() && filteredZones.length > 0 && (
                <div style={{ background: NB.white, border: `2px solid ${NB.black}`, borderTop: 'none', maxHeight: 180, overflowY: 'auto' }}>
                  {filteredZones.map(zone => (
                    <button key={zone._id} onClick={() => { setHighlightZoneId(zone._id); setSearchQuery(''); setTimeout(() => setHighlightZoneId(null), 8000); }} style={{ width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${NB.cream}`, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
                      <div style={{ width: 8, height: 8, background: zone.risk_level === 'safe' ? NB.mint : zone.risk_level === 'moderate' ? NB.orange : NB.red }} />
                      <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{zone.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Trip info */}
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.yellow, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Calendar size={15} color="#000000" /><h3 style={{ fontWeight: 800, color: '#000000', margin: 0, fontSize: '0.88rem' }}>Active Itinerary</h3>
            </div>
            <div style={{ padding: '16px' }}>
              {activeTrip ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', background: NB.cream, padding: '10px 12px', border: `2px solid ${NB.black}` }}>
                    <div><p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', margin: 0 }}>Destination</p><p style={{ fontWeight: 700, color: NB.black, margin: '2px 0 0', fontSize: '0.9rem' }}>{activeTrip.destination_region}</p></div>
                    <div style={{ textAlign: 'right' }}><p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', margin: 0 }}>Duration</p><p style={{ fontWeight: 700, color: NB.black, margin: '2px 0 0', fontSize: '0.78rem' }}>{new Date(activeTrip.start_date).toLocaleDateString()} – {new Date(activeTrip.end_date).toLocaleDateString()}</p></div>
                  </div>
                  {verifyResult && <div style={{ padding: '10px 12px', background: '#E8F5FF', border: `2px solid ${NB.blue}`, fontSize: '0.82rem', fontWeight: 600, color: NB.blue }}>{verifyResult}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setUpdateTripModalOpen(true)} style={{ flex: 1, padding: '9px', background: NB.yellow, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase', color: '#000000' }}>Update Plan</button>
                    <button onClick={handleVerifyStay} style={{ flex: 1, padding: '9px', background: NB.cream, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase' }}>Verify Stay</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', border: `2px dashed ${NB.black}` }}>
                  <p style={{ fontSize: '0.85rem', color: '#6B6B6B', marginBottom: 12, fontWeight: 500 }}>No active trip found for your profile.</p>
                  <Link to="/tourist/plan" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: NB.yellow, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, padding: '8px 16px', textDecoration: 'none', color: NB.black, fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                    <NearMe size={14} /> Start Planning
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '16px' }}>
            <h3 style={{ fontWeight: 800, color: NB.black, margin: '0 0 14px', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Safety Services</h3>
            <div className="responsive-flex-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { icon: checkinDone ? <Check size={22} color={NB.mint} /> : checkinLoading ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={22} color={NB.blue} />, label: checkinDone ? 'Checked In ✓' : 'Daily Check-in', action: handleCheckin, accent: NB.blue },
                { icon: <AlertTriangle size={22} color={NB.orange} />, label: 'Report Anomaly', action: () => setReportModalOpen(true), accent: NB.orange },
                { icon: <Watch size={22} color={NB.blue} />, label: 'IoT Sync', action: () => setIotModalOpen(true), accent: NB.blue },
                { icon: <ShieldAlert size={22} color='#8B5CF6' />, label: 'Safe House', action: handleSafeHouse, accent: '#8B5CF6' },
              ].map((btn, i) => (
                <button key={i} onClick={btn.action} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px', background: NB.cream, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = NB.cream; }}
                >
                  {btn.icon}
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: NB.black }}>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: 800, color: NB.black, margin: 0, fontSize: '0.88rem' }}>Safety Broadcasts</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={fetchTouristData} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><RefreshCw size={13} className={loading ? 'animate-spin' : ''} /></button>
                {alerts.length > 0 && <span style={{ padding: '2px 8px', background: NB.red, color: NB.white, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>{alerts.length} Active</span>}
              </div>
            </div>
            <div style={{ padding: '12px', maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alerts.length > 0 ? alerts.map(alert => {
                const col = alert.severity === 'critical' ? NB.red : alert.severity === 'high' ? NB.orange : NB.blue;
                return (
                  <div key={alert._id} style={{ padding: '10px 12px', background: NB.cream, border: `2px solid ${col}`, display: 'flex', gap: 10 }}>
                    <AlertTriangle size={16} color={col} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div>
                      <p style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.82rem' }}>{alert.title}</p>
                      <p style={{ fontSize: '0.72rem', color: '#6B6B6B', margin: '2px 0 0', fontWeight: 500 }}>{alert.description || alert.zone?.name || new Date(alert.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              }) : (
                <div style={{ padding: '20px', textAlign: 'center', border: `2px dashed ${NB.black}` }}>
                  <Check size={20} color={NB.mint} style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: '0.78rem', color: '#6B6B6B', fontWeight: 600 }}>All sectors clear. Enjoy your trip!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SOS Button */}
      <div style={{ position: 'fixed', bottom: 80, right: 32, zIndex: 1000 }}>
        {sosSuccess ? (
          <div style={{ width: 80, height: 80, background: NB.mint, border: `4px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, color: NB.black }}>
            <Check size={28} /><span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>Alert Sent</span>
          </div>
        ) : (
          <button onMouseDown={handleSOSStart} onMouseUp={handleSOSEnd} onMouseLeave={handleSOSEnd} onTouchStart={handleSOSStart} onTouchEnd={handleSOSEnd}
            style={{ width: 80, height: 80, background: NB.red, border: `4px solid ${NB.black}`, boxShadow: countdown > 0 ? `0 0 0 8px rgba(255,59,59,0.4)` : `4px 4px 0 ${NB.black}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', color: NB.white, transform: countdown > 0 ? 'scale(1.1)' : undefined, transition: 'all 0.2s', outline: 'none' }}
          >
            {sosLoading ? <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /> : countdown > 0 ? <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{countdown}</span> : <><ShieldAlert size={28} /><span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase' }}>Hold SOS</span></>}
          </button>
        )}
        {countdown > 0 && <div style={{ position: 'absolute', top: 0, right: '110%', whiteSpace: 'nowrap', background: NB.red, color: NB.white, borderRight: `3px solid ${NB.black}`, padding: '8px 14px', fontWeight: 800, fontSize: '0.78rem' }}>TRANSMITTING IN {countdown}s...</div>}
      </div>

      {/* Report Modal */}
      <ReportAnomalyModal open={reportModalOpen} onClose={() => setReportModalOpen(false)} userLat={userLat} userLng={userLng}
        onSuccess={(t) => { setToast({ message: `Anomaly "${t}" reported`, type: 'success' }); fetchTouristData(); }}
        onError={(m) => setToast({ message: m, type: 'error' })}
      />
      <UpdateTripModal open={updateTripModalOpen} onClose={() => setUpdateTripModalOpen(false)} trip={activeTrip}
        onSuccess={() => { setToast({ message: 'Trip updated', type: 'success' }); fetchTouristData(); }}
        onError={(m) => setToast({ message: m, type: 'error' })}
      />
      <NBModal open={iotModalOpen} onClose={() => setIotModalOpen(false)} title="IoT Device Sync">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[{ icon: <Bluetooth size={20} color={NB.blue} />, label: 'Bluetooth Pair', sub: 'Search for nearby IoT bands', action: () => { setToast({ message: 'Searching Bluetooth...', type: 'info' }); setIotModalOpen(false); } },
            { icon: <Wifi size={20} color={NB.mint} />, label: 'WiFi Direct', sub: 'Connect via local network', action: () => { setToast({ message: 'WiFi scan initiated', type: 'info' }); setIotModalOpen(false); } }].map((b, i) => (
            <button key={i} onClick={b.action} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: NB.cream, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%' }}>
              {b.icon}<div><p style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.9rem' }}>{b.label}</p><p style={{ fontSize: '0.72rem', color: '#6B6B6B', margin: 0 }}>{b.sub}</p></div>
            </button>
          ))}
        </div>
      </NBModal>
    </div>
  );
}

const nbInputStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', background: '#FFFBF0', border: '2px solid #0A0A0A', fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.88rem', fontWeight: 500, outline: 'none', color: '#0A0A0A', borderRadius: 0 };

function ReportAnomalyModal({ open, onClose, userLat, userLng, onSuccess, onError }: { open: boolean; onClose: () => void; userLat: number | null; userLng: number | null; onSuccess: (title: string) => void; onError: (msg: string) => void; }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [incidentType, setIncidentType] = useState('suspicious_activity'); const [severity, setSeverity] = useState('medium'); const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim()) return; setSubmitting(true);
    try {
      await api.post('/incidents', { title, description, incident_type: incidentType, severity, source: 'resident_report', latitude: userLat || 27.5855, longitude: userLng || 91.8594, is_public: true });
      onSuccess(title); setTitle(''); setDescription(''); onClose();
    } catch (err: any) { onError(err.response?.data?.message || 'Failed to submit'); } finally { setSubmitting(false); }
  };
  return (
    <NBModal open={open} onClose={onClose} title="Report Safety Anomaly">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Incident Type</label>
          <select value={incidentType} onChange={e => setIncidentType(e.target.value)} style={nbInputStyle}><option value="suspicious_activity">Suspicious Activity</option><option value="theft">Theft</option><option value="harassment">Harassment</option><option value="natural_hazard">Natural Hazard</option><option value="medical">Medical Emergency</option><option value="other">Other</option></select>
        </div>
        <div><label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Title</label><input value={title} onChange={e => setTitle(e.target.value)} style={nbInputStyle} placeholder="Brief summary" required /></div>
        <div><label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...nbInputStyle, resize: 'vertical', minHeight: 80 }} rows={3} placeholder="Details about what you observed..." /></div>
        <div><label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Severity</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['low', 'medium', 'high', 'critical'] as const).map(s => {
              const col = s === 'low' ? NB.mint : s === 'medium' ? NB.blue : s === 'high' ? NB.orange : NB.red;
              return <button key={s} type="button" onClick={() => setSeverity(s)} style={{ flex: 1, padding: '8px 4px', background: severity === s ? col : NB.cream, color: severity === s ? NB.white : NB.black, border: `2px solid ${severity === s ? col : NB.black}`, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', cursor: 'pointer' }}>{s}</button>;
            })}
          </div>
        </div>
        <div style={{ padding: '8px 12px', background: NB.cream, border: `2px solid ${NB.black}`, fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, color: '#6B6B6B' }}>
          <MapPin size={12} color={NB.blue} /> {userLat?.toFixed(4)}, {userLng?.toFixed(4)} (auto-detected)
        </div>
        <button type="submit" disabled={submitting || !title.trim()} style={{ width: '100%', padding: '12px', background: NB.orange, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, fontFamily: 'inherit', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: NB.white, opacity: (submitting || !title.trim()) ? 0.6 : 1 }}>
          {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />} Submit Report
        </button>
      </form>
    </NBModal>
  );
}

function UpdateTripModal({ open, onClose, trip, onSuccess, onError }: { open: boolean; onClose: () => void; trip: any; onSuccess: () => void; onError: (msg: string) => void; }) {
  const [destination, setDestination] = useState(''); const [startDate, setStartDate] = useState(''); const [endDate, setEndDate] = useState(''); const [submitting, setSubmitting] = useState(false);
  useEffect(() => { if (trip) { setDestination(trip.destination_region || ''); setStartDate(trip.start_date ? trip.start_date.split('T')[0] : ''); setEndDate(trip.end_date ? trip.end_date.split('T')[0] : ''); } }, [trip]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!trip?._id) return; setSubmitting(true);
    try { await api.patch(`/trips/${trip._id}`, { destination_region: destination, start_date: startDate, end_date: endDate }); onSuccess(); onClose(); }
    catch (err: any) { onError(err.response?.data?.message || 'Failed to update trip'); } finally { setSubmitting(false); }
  };
  return (
    <NBModal open={open} onClose={onClose} title="Update Travel Plan">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div><label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Destination Region</label><input value={destination} onChange={e => setDestination(e.target.value)} style={nbInputStyle} placeholder="e.g. Tawang District" required /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Start Date</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={nbInputStyle} required /></div>
          <div><label style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B', display: 'block', marginBottom: 6 }}>End Date</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={nbInputStyle} required /></div>
        </div>
        <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', background: NB.yellow, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, fontFamily: 'inherit', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: NB.black }}>
          {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />} Save Changes
        </button>
      </form>
    </NBModal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Create Trip Modal
// ═══════════════════════════════════════════════════════════════════════

function CreateTripModal({ open, onClose, onSuccess, onError }: {
  open: boolean; onClose: () => void;
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [entryPoint, setEntryPoint] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !startDate || !endDate) return;
    setSubmitting(true);
    try {
      await api.post('/trips', {
        destination_region: destination,
        start_date: startDate,
        end_date: endDate,
        entry_point: entryPoint || undefined,
        vehicle_details: vehicleDetails || undefined,
      });
      onSuccess();
      setDestination(''); setStartDate(''); setEndDate(''); setEntryPoint(''); setVehicleDetails('');
      onClose();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setSubmitting(false);
    }
  };

  const InputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 [color-scheme:dark]";

  return (
    <NBModal open={open} onClose={onClose} title="Plan Your Trip">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Destination Region *</label>
          <input value={destination} onChange={e => setDestination(e.target.value)} className={InputClass} placeholder="e.g. Tawang District, Arunachal Pradesh" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Start Date *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={InputClass} required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">End Date *</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={InputClass} required />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Entry Point</label>
          <input value={entryPoint} onChange={e => setEntryPoint(e.target.value)} className={InputClass} placeholder="e.g. Guwahati Airport" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Vehicle Details</label>
          <input value={vehicleDetails} onChange={e => setVehicleDetails(e.target.value)} className={InputClass} placeholder="e.g. Self-drive SUV, AS-01-XX-1234" />
        </div>
        <button type="submit" disabled={submitting || !destination.trim() || !startDate || !endDate} className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 rounded-lg font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-none outline-none cursor-pointer">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <NearMe className="size-4" />}
          {submitting ? 'Creating Trip...' : 'Start My Trip'}
        </button>
      </form>
    </NBModal>
  );
}
