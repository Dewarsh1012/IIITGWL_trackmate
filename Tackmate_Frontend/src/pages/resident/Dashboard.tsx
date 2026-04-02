import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, TrendingUp, Plus, Layers, Activity, Loader2, Users } from 'lucide-react';
import AlertPanel from '../../components/alerts/AlertPanel';
import TouristMap, { type ZoneData } from '../../components/maps/TouristMap';
import { useRef } from 'react';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wardData, setWardData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const { socket } = useSocket();
  const [zones, setZones] = useState<ZoneData[]>([]);
  
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const sosIntervalRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState(0);

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

  useEffect(() => {
    if (!socket || !user || !userLat || !userLng) return;
    const interval = setInterval(() => {
      socket.emit('location_update', { userId: user.id || (user as any)._id, latitude: userLat, longitude: userLng, role: 'resident' });
    }, 5000);
    return () => clearInterval(interval);
  }, [socket, user, userLat, userLng]);

  const handleSOSStart = () => {
    if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
    setCountdown(3);
    sosIntervalRef.current = window.setInterval(() => {
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
    } catch { alert('SOS transmission failed!'); } finally { setSosLoading(false); }
  };

  useEffect(() => {
    if (user?.ward) {
      fetchWardData();
      const interval = setInterval(fetchWardData, 60000);
      if (socket) {
        const wardId = typeof user.ward === 'object' ? user.ward._id : user.ward;
        socket.on('new-incident', (incident: any) => {
          const incWardId = typeof incident.ward === 'object' ? incident.ward?._id : incident.ward;
          if (incWardId === wardId) setIncidents(prev => [incident, ...prev.slice(0, 9)]);
        });
      }
      return () => { clearInterval(interval); if (socket) socket.off('new-incident'); };
    } else {
      // No ward assigned — fetch general incidents and stop loading
      fetchGeneralData();
    }
  }, [user, socket]);

  const fetchGeneralData = async () => {
    try {
      const [incidentsRes, zonesRes] = await Promise.all([
        api.get('/incidents?limit=5'),
        api.get('/zones')
      ]);
      if (incidentsRes.data.success) setIncidents(incidentsRes.data.data || []);
      if (zonesRes.data.success) setZones(zonesRes.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const fetchWardData = async () => {
    try {
      const wardId = typeof user?.ward === 'object' ? user.ward._id : user?.ward;
      const [wardRes, incidentsRes, analyticsRes, zonesRes] = await Promise.all([
        api.get(`/wards/${wardId}`), api.get(`/incidents?ward=${wardId}&limit=5`), api.get(`/analytics/ward/${wardId}`), api.get('/zones')
      ]);
      if (wardRes.data.success) setWardData(wardRes.data.data);
      if (incidentsRes.data.success) setIncidents(incidentsRes.data.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (zonesRes.data.success) setZones(zonesRes.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  const sevColor = (s: string) => ({ critical: NB.red, high: NB.orange }[s] || NB.blue);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: NB.cream }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  );

  const score = analytics?.safety_score || 85;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: NB.cream, fontFamily: "'Space Grotesk', sans-serif", paddingBottom: 80 }}>
      {/* No-ward info banner */}
      {!user?.ward && (
        <div style={{ background: '#FFF8E1', border: `2px solid ${NB.yellow}`, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', fontWeight: 600, color: '#6B6B00' }}>
          <AlertTriangle size={16} color={NB.orange} />
          No ward assigned to your account. Showing general area data. Contact local authority to get assigned to a ward.
        </div>
      )}
      {/* Ward Header */}
      <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 16, marginBottom: 20 }}>
        <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: NB.black, margin: 0 }}>{wardData?.name || 'Your Area'}</h2>
            <p style={{ margin: '4px 0 0', color: '#6B6B6B', fontSize: '0.8rem', fontWeight: 500 }}>
              {wardData ? `Live Monitoring · ${wardData.district}, ${wardData.state}` : 'General Monitoring · All Areas'}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <AlertPanel />
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', color: '#6B6B6B', margin: 0 }}>Score</p>
              <p style={{ color: score > 80 ? NB.mint : NB.orange, fontWeight: 700, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                <TrendingUp size={12} /> Healthy
              </p>
            </div>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="26" fill="none" stroke={NB.cream} strokeWidth="7" />
                <circle cx="32" cy="32" r="26" fill="none" stroke={score > 80 ? NB.mint : NB.orange} strokeWidth="7" strokeDasharray="163.4" strokeDashoffset={163.4 - (163.4 * score / 100)} />
              </svg>
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontWeight: 800, fontSize: '0.88rem', color: NB.black }}>{score}</span>
            </div>
          </div>
        </div>
        <div style={{ background: NB.black, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Users size={24} color={NB.yellow} />
          <p style={{ fontSize: '1.8rem', fontWeight: 800, color: NB.white, margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{analytics?.resident_count || 42}</p>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Active Circle</p>
        </div>
      </section>

      <section style={{ marginBottom: 20 }}>
        {countdown > 0 ? (
            <div style={{ background: '#FF0033', padding: '16px', border: `3px solid ${NB.black}`, color: NB.white, textAlign: 'center', animation: 'nb-pulse 1s infinite' }}>
              <h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 900 }}>{countdown}</h2>
              <p style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Release to Cancel SOS</p>
            </div>
        ) : sosSuccess ? (
            <div style={{ background: NB.black, padding: '16px', border: `3px solid ${NB.black}`, color: NB.mint, textAlign: 'center' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px', fontWeight: 800 }}>HELP DISPATCHED</h3>
              <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700 }}>Authorities have been notified and mapped to your live location.</p>
            </div>
        ) : (
            <button
              onMouseDown={handleSOSStart} onMouseUp={handleSOSEnd} onMouseLeave={handleSOSEnd}
              onTouchStart={handleSOSStart} onTouchEnd={handleSOSEnd}
              disabled={sosLoading}
              style={{ width: '100%', padding: '20px', background: '#FF0033', border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: sosLoading ? 0.7 : 1 }}
            >
              <span style={{ fontWeight: 800, fontSize: '1.4rem', color: NB.white, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Hold for Emergency
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em' }}>
                Hold for 3 seconds to dispatch help
              </span>
            </button>
        )}
      </section>

      {/* Map Section */}
      <section style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, height: 400, position: 'relative', overflow: 'hidden', marginBottom: 20, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, position: 'relative', background: '#FFFBF0' }}>
            <TouristMap lat={userLat || wardData?.latitude} lng={userLng || wardData?.longitude} zones={zones} />
        </div>
        {/* Map Legend (below map) */}
        <div style={{ background: NB.cream, borderTop: `3px solid ${NB.black}`, padding: '10px 14px', display: 'flex', gap: 14, overflowX: 'auto' }}>
            {[{ label: 'Safe', color: NB.mint }, { label: 'Moderate', color: NB.orange }, { label: 'Restricted', color: NB.red }].map(l => (
                <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', background: '#FFFFFF', color: '#000000', border: `1.5px solid ${NB.black}` }}>
                  <div style={{ width: 8, height: 8, background: l.color }} />{l.label}
                </div>
            ))}
        </div>
      </section>

      {/* Bottom row */}
      <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontWeight: 800, color: NB.black, margin: 0 }}>Recent Incidents</h3>
            <Link to="/resident/incidents" style={{ fontSize: '0.72rem', fontWeight: 700, color: NB.blue, textDecoration: 'none', textTransform: 'uppercase' }}>View Map</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {incidents.length > 0 ? incidents.map(inc => (
              <div key={inc._id} style={{ background: NB.white, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, padding: '12px', display: 'flex', gap: 10, borderLeft: `5px solid ${sevColor(inc.severity)}` }}>
                <AlertTriangle size={16} color={sevColor(inc.severity)} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h4 style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.85rem' }}>{inc.title}</h4>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', background: sevColor(inc.severity), color: NB.white, padding: '2px 5px' }}>{inc.severity}</span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6B6B6B', margin: '3px 0 0' }}>{inc.description || 'No description.'}</p>
                </div>
              </div>
            )) : (
              <div style={{ padding: '24px', textAlign: 'center', border: `2px dashed ${NB.mint}`, background: '#F0FFF8' }}>
                <Shield size={20} color={NB.mint} style={{ margin: '0 auto 8px' }} />
                <p style={{ fontSize: '0.82rem', color: '#6B6B6B', fontWeight: 600 }}>Ward is currently clear.</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 style={{ fontWeight: 800, color: NB.black, margin: '0 0 12px' }}>Community Vitals</h3>
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}` }}>
            {[
              { icon: <Activity size={18} color={NB.blue} />, label: 'Police Patrol Frequency', sub: 'Community verified', value: 'High', trend: '+12%', tc: NB.mint },
              { icon: <Layers size={18} color={NB.orange} />, label: 'Street Light Coverage', sub: 'Status: Operational', value: '94%', trend: 'Check-in due', tc: '#9A9A9A' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', borderBottom: i === 0 ? `2px solid ${NB.cream}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, background: NB.cream, border: `2px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                  <div>
                    <p style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.85rem' }}>{item.label}</p>
                    <p style={{ fontSize: '0.7rem', color: '#6B6B6B', margin: 0 }}>{item.sub}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontWeight: 800, color: NB.black, margin: 0 }}>{item.value}</p>
                  <p style={{ fontSize: '0.65rem', color: item.tc, fontWeight: 700, margin: 0 }}>{item.trend}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Link to="/resident/report" style={{ position: 'fixed', bottom: 80, right: 24, background: NB.red, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: NB.white, zIndex: 30 }}>
        <Plus size={24} />
      </Link>
    </div>
  );
}
