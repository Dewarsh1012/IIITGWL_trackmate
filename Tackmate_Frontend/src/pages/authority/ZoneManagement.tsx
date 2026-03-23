import { useState, useEffect } from 'react';
import { MapPin, Loader2, Activity, Shield } from 'lucide-react';
import api from '../../lib/api';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

const riskColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'CRITICAL': return '#FF0033';
    case 'HIGH': return NB.red;
    case 'MODERATE': return NB.orange;
    default: return NB.mint;
  }
};

export default function AuthorityZones() {
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    try {
      const res = await api.get('/zones');
      if (res.data.success) setZones(res.data.data);
    } catch { console.error('Failed to fetch zones'); } finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: NB.cream }}>
      <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
      <AuthoritySidebar />
      <main className="page-with-sidebar" style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ background: NB.white, borderBottom: `3px solid ${NB.black}`, padding: '16px 28px', boxShadow: `0 3px 0 ${NB.black}` }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NB.black, margin: 0 }}>Zone Management</h1>
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B', fontWeight: 600 }}>Dynamic risk matrices & geographical sector alerts</p>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 16, padding: '20px 28px 0' }}>
          {[
            { label: 'Total Zones', value: zones.length, color: NB.black },
            { label: 'High Risk', value: zones.filter(z => ['CRITICAL', 'HIGH'].includes(z.risk_level?.toUpperCase())).length, color: NB.red },
            { label: 'Safe', value: zones.filter(z => !['CRITICAL', 'HIGH'].includes(z.risk_level?.toUpperCase())).length, color: NB.mint },
          ].map((s, i) => (
            <div key={i} style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Zone cards */}
        <div style={{ padding: '20px 28px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {zones.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', border: `3px dashed ${NB.black}`, padding: '48px', textAlign: 'center', color: '#6B6B6B', fontWeight: 600, fontSize: '0.9rem' }}>
              No operational zones established.
            </div>
          ) : zones.map(zone => {
            const rc = riskColor(zone.risk_level);
            const isHighRisk = ['CRITICAL', 'HIGH'].includes(zone.risk_level?.toUpperCase());
            return (
              <div key={zone._id} style={{
                background: NB.white,
                border: `3px solid ${NB.black}`,
                boxShadow: `4px 4px 0 ${NB.black}`,
                borderTop: `6px solid ${rc}`,
                padding: '20px',
                transition: 'all 0.1s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 ${NB.black}`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = `4px 4px 0 ${NB.black}`; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, background: rc, border: `2px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={16} color={NB.white} />
                    </div>
                    <h3 style={{ fontWeight: 800, color: NB.black, margin: 0, fontSize: '1rem' }}>{zone.name}</h3>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '3px 10px', background: rc, color: isHighRisk ? NB.white : NB.black, border: `2px solid ${NB.black}` }}>
                    {zone.risk_level || 'LOW'}
                  </span>
                </div>

                <p style={{ fontSize: '0.85rem', color: '#3A3A3A', lineHeight: 1.55, minHeight: 40, margin: '0 0 16px', fontWeight: 400 }}>
                  {zone.description || 'Geofenced operational sector.'}
                </p>

                <div className="responsive-grid" style={{ borderTop: `2px solid ${NB.black}`, paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <p style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: '0 0 4px' }}>Active Incidents</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: isHighRisk ? NB.red : NB.black, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={16} /> {zone.active_incidents_count || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: '0 0 4px' }}>Safety Index</p>
                    <p style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: NB.black, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={16} /> {zone.safety_score || 100}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
