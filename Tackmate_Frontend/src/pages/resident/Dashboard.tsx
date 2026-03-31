import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, TrendingUp, Plus, Navigation, Layers, Activity, Loader2, Users } from 'lucide-react';
import AlertPanel from '../../components/alerts/AlertPanel';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wardData, setWardData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const { socket } = useSocket();

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
    }
  }, [user, socket]);

  const fetchWardData = async () => {
    try {
      const wardId = typeof user?.ward === 'object' ? user.ward._id : user?.ward;
      const [wardRes, incidentsRes, analyticsRes] = await Promise.all([
        api.get(`/wards/${wardId}`), api.get(`/incidents?ward=${wardId}&limit=5`), api.get(`/analytics/ward/${wardId}`)
      ]);
      if (wardRes.data.success) setWardData(wardRes.data.data);
      if (incidentsRes.data.success) setIncidents(incidentsRes.data.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
    } catch {} finally { setLoading(false); }
  };

  const sevColor = (s: string) => ({ critical: NB.red, high: NB.orange }[s] || NB.blue);

  if (loading && !wardData) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', background: NB.cream }}>
      <Loader2 size={32} />
    </div>
  );

  const score = analytics?.safety_score || 85;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: NB.cream, fontFamily: "'Space Grotesk', sans-serif", paddingBottom: 80 }}>
      {/* Ward Header */}
      <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 16, marginBottom: 20 }}>
        <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: NB.black, margin: 0 }}>{wardData?.name || 'Local'} Ward</h2>
            <p style={{ margin: '4px 0 0', color: '#6B6B6B', fontSize: '0.8rem', fontWeight: 500 }}>
              Live Monitoring · {wardData?.district}, {wardData?.state}
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

      {/* Map placeholder */}
      <section style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, height: 300, position: 'relative', overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200')", backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2 }} />
        {incidents.slice(0, 3).map((inc, i) => (
          <div key={inc._id} style={{ position: 'absolute', width: 14, height: 14, background: sevColor(inc.severity), border: `2px solid ${NB.black}`, top: `${20 + i * 25}%`, left: `${30 + i * 20}%` }} />
        ))}
        <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[<Plus size={16} />, <Navigation size={16} />].map((icon, i) => (
            <button key={i} style={{ width: 36, height: 36, background: NB.white, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{icon}</button>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 12, bottom: 12, background: NB.white, border: `2px solid ${NB.black}`, padding: '8px 12px', display: 'flex', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 700 }}><div style={{ width: 8, height: 8, background: NB.red }} /> Incident</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 700 }}><div style={{ width: 8, height: 8, background: NB.mint }} /> Safe Zone</div>
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
