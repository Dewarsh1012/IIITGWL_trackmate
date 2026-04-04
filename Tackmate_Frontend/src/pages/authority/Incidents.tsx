import { useState, useEffect } from 'react';
import { AlertTriangle, Loader2, CheckCircle, FileText, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Link } from 'react-router-dom';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard } from '../../theme/clayTheme';

const severityStyle = (sev: string): React.CSSProperties => {
    switch (sev?.toUpperCase()) {
        case 'CRITICAL': return { background: 'rgba(239,68,68,0.1)', color: C.critical, border: `1px solid rgba(239,68,68,0.3)` };
        case 'HIGH': return { background: 'rgba(248,113,113,0.1)', color: C.high, border: `1px solid rgba(248,113,113,0.3)` };
        case 'MEDIUM': return { background: 'rgba(251,191,36,0.1)', color: C.moderate, border: `1px solid rgba(251,191,36,0.3)` };
        default: return { background: 'rgba(108,99,255,0.1)', color: C.primary, border: `1px solid rgba(108,99,255,0.3)` };
    }
};

export default function AuthorityIncidents() {
    const { } = useAuth();
    const [loading, setLoading] = useState(true);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [filter, setFilter] = useState('ALL');
    const [severityFilter, setSeverityFilter] = useState('ALL');
    const [errorMsg, setErrorMsg] = useState('');

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
            setErrorMsg('');
            const res = await api.patch(`/incidents/${id}`, { status: newStatus });
            if (res.data.success) setIncidents(prev => prev.map(i => i._id === id ? { ...i, status: newStatus } : i));
        } catch {
            setErrorMsg('Failed to update incident status.');
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
            <Loader2 size={36} color={C.primary} style={{ animation: 'spin-slow 1s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <style>{`
                .clay-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .clay-table th { color: ${C.textMuted}; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 18px 24px; text-align: left; border-bottom: 2px solid rgba(27,29,42,0.06); }
                .clay-table td { padding: 20px 24px; border-bottom: 1px solid ${C.border}; vertical-align: middle; transition: background 0.15s; }
                .clay-table tbody tr:hover td { background: rgba(108,99,255,0.02); }
                .clay-table tbody tr:last-child td { border-bottom: none; }
            `}</style>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, margin: 0 }}>Incident Management</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Review, assign & resolve reported anomalies</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        {/* Status filter */}
                        <div style={{ display: 'flex', background: C.surfaceAlt, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, boxShadow: 'inset 2px 2px 4px rgba(27,29,42,0.04)' }}>
                            {['ALL', 'active', 'resolved'].map(f => (
                                <button key={f} onClick={() => setFilter(f)} style={{ padding: '8px 16px', background: filter === f ? C.surface : 'transparent', color: filter === f ? C.primary : C.textSecondary, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', textTransform: 'capitalize', cursor: 'pointer', border: 'none', borderRadius: 8, boxShadow: filter === f ? '0 2px 8px rgba(27,29,42,0.08)' : 'none', transition: 'all 0.15s' }}>
                                    {f === 'ALL' ? 'All' : f}
                                </button>
                            ))}
                        </div>
                        {/* Severity filter */}
                        <div style={{ display: 'flex', background: C.surfaceAlt, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, boxShadow: 'inset 2px 2px 4px rgba(27,29,42,0.04)' }}>
                            {['ALL', 'CRITICAL', 'HIGH'].map(f => {
                                const activeColor = f === 'CRITICAL' ? C.critical : f === 'HIGH' ? C.high : C.primary;
                                return (
                                    <button key={f} onClick={() => setSeverityFilter(f)} style={{ padding: '8px 16px', background: severityFilter === f ? activeColor : 'transparent', color: severityFilter === f ? '#FFFFFF' : C.textSecondary, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', textTransform: 'capitalize', cursor: 'pointer', border: 'none', borderRadius: 8, boxShadow: severityFilter === f ? `0 4px 12px ${activeColor}40` : 'none', transition: 'all 0.15s' }}>
                                        {f === 'ALL' ? 'Any Severity' : f}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {errorMsg && (
                    <div style={{ margin: '24px 28px 0', background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 14, padding: '14px 18px', color: C.critical, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={18} /> {errorMsg}
                    </div>
                )}

                {/* Stats summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, padding: '24px 28px 0' }}>
                    {[
                        { label: 'Total Incidents', value: incidents.length, color: C.primary, gradient: 'rgba(108,99,255,0.05)' },
                        { label: 'Active Reports', value: incidents.filter(i => i.status !== 'resolved').length, color: C.high, gradient: 'rgba(248,113,113,0.05)' },
                        { label: 'Resolved Safe', value: incidents.filter(i => i.status === 'resolved').length, color: C.safe, gradient: 'rgba(52,211,153,0.05)' },
                    ].map((s, i) => (
                        <div key={i} style={{ ...clayCard, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6, background: s.gradient, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: s.color, opacity: 0.1, filter: 'blur(10px)' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted }}>{s.label}</span>
                            <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color, lineHeight: 1 }}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div style={{ padding: '24px 28px 32px' }}>
                    <div style={{ ...clayCard, overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="clay-table">
                                <thead>
                                    <tr>
                                        <th>Incident Details</th><th>Severity & Source</th><th>Location</th><th>Time Reported</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIncidents.length === 0 ? (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: C.textMuted, fontWeight: 600 }}>No incidents match the applied filters.</td></tr>
                                    ) : filteredIncidents.map(inc => (
                                        <tr key={inc._id}>
                                            <td>
                                                <p style={{ fontWeight: 800, color: C.text, margin: 0, fontSize: '0.95rem' }}>{inc.title}</p>
                                                <p style={{ fontSize: '0.72rem', color: C.textSecondary, margin: '4px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, background: C.surfaceAlt, display: 'inline-block', padding: '2px 8px', borderRadius: 6, border: `1px solid ${C.border}` }}>{inc.incident_type}</p>
                                            </td>
                                            <td>
                                                <span style={{ ...severityStyle(inc.severity), padding: '4px 10px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', borderRadius: 8, display: 'inline-block', marginBottom: 6 }}>{inc.severity}</span>
                                                <p style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: C.textMuted, margin: 0, fontWeight: 700 }}>{inc.source}</p>
                                            </td>
                                            <td>
                                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: C.text, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: inc.latitude ? C.safe : C.textMuted }} />
                                                    {inc.latitude && inc.longitude ? `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}` : <span style={{ color: C.textMuted }}>Unspecified</span>}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: C.textSecondary, fontWeight: 600 }}>
                                                    <Clock size={14} color={C.primaryLight} /> {new Date(inc.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {inc.status === 'resolved' ? <CheckCircle size={16} color={C.safe} /> : <AlertTriangle size={16} color={C.moderate} />}
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'capitalize', color: inc.status === 'resolved' ? C.safe : C.text }}>{inc.status}</span>
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {inc.status !== 'resolved' && (
                                                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                                        <button onClick={() => handleStatusUpdate(inc._id, 'acknowledged')} style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: '6px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '2px 2px 6px rgba(27,29,42,0.05)' }}>Ack</button>
                                                        <button onClick={() => handleStatusUpdate(inc._id, 'resolved')} style={{ background: 'linear-gradient(135deg, #34D399, #2DD4BF)', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '6px 14px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s', boxShadow: '0 4px 12px rgba(52,211,153,0.3)' }}>Resolve</button>
                                                        <Link to={`/authority/efir?incidentId=${inc._id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '2px 2px 6px rgba(27,29,42,0.05)', color: C.text, transition: 'all 0.15s' }}>
                                                            <FileText size={16} />
                                                        </Link>
                                                    </div>
                                                )}
                                                {inc.status === 'resolved' && (
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: C.safe, background: 'rgba(52,211,153,0.1)', padding: '6px 14px', borderRadius: 10 }}>Completed</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
