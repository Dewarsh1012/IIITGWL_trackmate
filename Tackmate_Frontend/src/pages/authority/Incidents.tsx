import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, CheckCircle, FileText, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Link } from 'react-router-dom';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

const severityStyle = (sev: string): React.CSSProperties => {
  switch (sev?.toUpperCase()) {
    case 'CRITICAL': return { background: '#FF0033', color: NB.white, border: `2px solid ${NB.black}` };
    case 'HIGH': return { background: NB.red, color: NB.white, border: `2px solid ${NB.black}` };
    case 'MEDIUM': return { background: NB.orange, color: NB.white, border: `2px solid ${NB.black}` };
    default: return { background: NB.blue, color: NB.white, border: `2px solid ${NB.black}` };
  }
};

export default function AuthorityIncidents() {
  const { } = useAuth();
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => { fetchIncidents(); }, []);

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/incidents');
      if (res.data.success) setIncidents(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter !== 'ALL' && inc.status !== filter) return false;
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    return true;
  });

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/incidents/${id}`, { status: newStatus });
      if (res.data.success) setIncidents(prev => prev.map(i => i._id === id ? { ...i, status: newStatus } : i));
    } catch { alert('Failed to update incident status.'); }
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
        <div style={{ background: NB.white, borderBottom: `3px solid ${NB.black}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 3px 0 ${NB.black}`, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NB.black, margin: 0 }}>Incident Management</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B', fontWeight: 600 }}>Review, assign & resolve reported anomalies</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {/* Status filter */}
            <div style={{ display: 'flex', border: `3px solid ${NB.black}`, overflow: 'hidden' }}>
              {['ALL', 'active', 'resolved'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 14px', background: filter === f ? NB.yellow : NB.white, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', border: 'none', borderRight: f !== 'resolved' ? `2px solid ${NB.black}` : 'none' }}>
                  {f === 'ALL' ? 'All' : f}
                </button>
              ))}
            </div>
            {/* Severity filter */}
            <div style={{ display: 'flex', border: `3px solid ${NB.black}`, overflow: 'hidden' }}>
              {['ALL', 'CRITICAL', 'HIGH'].map(f => (
                <button key={f} onClick={() => setSeverityFilter(f)} style={{ padding: '8px 14px', background: severityFilter === f ? (f === 'CRITICAL' ? NB.red : f === 'HIGH' ? NB.orange : NB.yellow) : NB.white, color: (severityFilter === f && f !== 'ALL') ? NB.white : NB.black, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', border: 'none', borderRight: f !== 'HIGH' ? `2px solid ${NB.black}` : 'none' }}>
                  {f === 'ALL' ? 'Any Severity' : f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div style={{ display: 'flex', gap: 16, padding: '20px 28px 0' }}>
          {[
            { label: 'Total', value: incidents.length, color: NB.black },
            { label: 'Active', value: incidents.filter(i => i.status !== 'resolved').length, color: NB.red },
            { label: 'Resolved', value: incidents.filter(i => i.status === 'resolved').length, color: NB.mint },
          ].map((s, i) => (
            <div key={i} style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color }}>{s.value}</span>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ padding: '20px 28px 28px' }}>
          <div style={{ border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, background: NB.white, overflowX: 'auto' }}>
            <table className="geo-table">
              <thead>
                <tr>
                  <th>Incident</th><th>Severity / Source</th><th>Location</th><th>Time</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncidents.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: '#6B6B6B', fontWeight: 600 }}>No incidents match the applied filters.</td></tr>
                ) : filteredIncidents.map(inc => (
                  <tr key={inc._id}>
                    <td>
                      <p style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.9rem' }}>{inc.title}</p>
                      <p style={{ fontSize: '0.68rem', color: '#6B6B6B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{inc.incident_type}</p>
                    </td>
                    <td>
                      <span style={{ ...severityStyle(inc.severity), padding: '3px 10px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', display: 'inline-block', marginBottom: 4 }}>{inc.severity}</span>
                      <p style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: '#6B6B6B', margin: 0, fontWeight: 600 }}>{inc.source}</p>
                    </td>
                    <td>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: NB.blue, fontWeight: 700 }}>
                        {inc.latitude && inc.longitude ? `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}` : <span style={{ color: '#9A9A9A' }}>—</span>}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#6B6B6B', fontWeight: 600 }}>
                        <Clock size={12} /> {new Date(inc.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {inc.status === 'resolved' ? <CheckCircle size={14} color={NB.mint} /> : <AlertTriangle size={14} color={NB.orange} />}
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: inc.status === 'resolved' ? NB.mint : NB.orange }}>{inc.status}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {inc.status !== 'resolved' && (
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleStatusUpdate(inc._id, 'acknowledged')} style={{ background: NB.yellow, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, padding: '5px 10px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer', textTransform: 'uppercase' }}>Ack</button>
                          <button onClick={() => handleStatusUpdate(inc._id, 'resolved')} style={{ background: NB.mint, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, padding: '5px 10px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer', textTransform: 'uppercase' }}>Resolve</button>
                          <Link to={`/authority/efir?incidentId=${inc._id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: NB.cream, border: `2px solid ${NB.black}` }}>
                            <FileText size={14} color={NB.black} />
                          </Link>
                        </div>
                      )}
                      {inc.status === 'resolved' && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B6B6B' }}>No actions needed</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
