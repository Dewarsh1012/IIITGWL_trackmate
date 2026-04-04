import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, MapPin, Clock, User, RefreshCw, Calendar, Search } from 'lucide-react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard } from '../../theme/clayTheme';

export default function DailyCheckins() {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const [loading, setLoading] = useState(true);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');

    const fetchCheckins = async () => {
        setLoading(true);
        try {
            const res = await api.get('/locations/checkins/all');
            if (res.data.success) setCheckins(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch check-ins:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCheckins(); }, []);

    // Real-time updates
    useEffect(() => {
        if (!socket) return;
        const handleNewIncident = (incident: any) => {
            if (incident.incident_type === 'checkin') {
                setCheckins(prev => [incident, ...prev]);
            }
        };
        socket.on('new-incident', handleNewIncident);
        return () => { socket.off('new-incident', handleNewIncident); };
    }, [socket]);

    // Filter check-ins
    const filteredCheckins = checkins.filter(ci => {
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const nameMatch = ci.reporter?.full_name?.toLowerCase().includes(q);
            const descMatch = ci.description?.toLowerCase().includes(q);
            const zoneMatch = ci.zone?.name?.toLowerCase().includes(q);
            if (!nameMatch && !descMatch && !zoneMatch) return false;
        }

        if (dateFilter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return new Date(ci.created_at) >= today;
        } else if (dateFilter === 'week') {
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return new Date(ci.created_at) >= weekAgo;
        }
        return true;
    });

    // Group by user for stats
    const uniqueUsers = new Set(filteredCheckins.map(ci => ci.reporter?._id).filter(Boolean));
    const todayCount = checkins.filter(ci => {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return new Date(ci.created_at) >= today;
    }).length;

    if (loading && checkins.length === 0) return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 size={36} color={C.primary} style={{ animation: 'spin-slow 1s linear infinite' }} />
            </main>
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, boxShadow: '0 2px 12px rgba(27,29,42,0.04)' }}>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, margin: 0 }}>Daily Check-Ins</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monitor tourist safety check-ins & location verifications</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {/* Date filter */}
                        <div style={{ display: 'flex', background: C.surfaceAlt, borderRadius: 12, padding: 4, border: `1px solid ${C.border}`, boxShadow: 'inset 2px 2px 4px rgba(27,29,42,0.04)' }}>
                            {(['today', 'week', 'all'] as const).map(f => (
                                <button key={f} onClick={() => setDateFilter(f)} style={{
                                    padding: '8px 16px', background: dateFilter === f ? C.surface : 'transparent',
                                    color: dateFilter === f ? C.primary : C.textSecondary,
                                    fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', textTransform: 'capitalize',
                                    cursor: 'pointer', border: 'none', borderRadius: 8,
                                    boxShadow: dateFilter === f ? '0 2px 8px rgba(27,29,42,0.08)' : 'none', transition: 'all 0.15s',
                                }}>
                                    {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All Time'}
                                </button>
                            ))}
                        </div>
                        <button onClick={fetchCheckins} style={{
                            background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12,
                            padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', color: C.text,
                            boxShadow: '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)',
                        }}>
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Stats Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, padding: '20px 28px 0' }}>
                    {[
                        { label: 'Total Check-Ins', value: filteredCheckins.length, color: C.safe, gradient: 'rgba(52,211,153,0.05)', icon: <CheckCircle2 size={20} /> },
                        { label: 'Unique Users', value: uniqueUsers.size, color: C.primary, gradient: 'rgba(108,99,255,0.05)', icon: <User size={20} /> },
                        { label: 'Today\'s Check-Ins', value: todayCount, color: C.moderate, gradient: 'rgba(251,191,36,0.05)', icon: <Calendar size={20} /> },
                    ].map((s, i) => (
                        <div key={i} style={{ ...clayCard, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 6, background: s.gradient, position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', background: s.color, opacity: 0.1, filter: 'blur(10px)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted }}>{s.label}</span>
                                <div style={{ width: 38, height: 38, background: `${s.color}15`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>{s.icon}</div>
                            </div>
                            <span style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.color, lineHeight: 1 }}>{s.value}</span>
                        </div>
                    ))}
                </div>

                {/* Search Bar */}
                <div style={{ padding: '16px 28px 0' }}>
                    <div style={{ ...clayCard, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Search size={16} color={C.textMuted} />
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search by tourist name, location, or zone..."
                            style={{
                                flex: 1, padding: '6px 0', background: 'none', border: 'none', outline: 'none',
                                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: C.text,
                            }}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 8, padding: '4px 10px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', color: C.textMuted, fontFamily: 'inherit' }}>Clear</button>
                        )}
                    </div>
                </div>

                {/* Check-in Table */}
                <div style={{ padding: '20px 28px 32px' }}>
                    <div style={{ ...clayCard, overflow: 'hidden' }}>
                        <style>{`
                            .checkin-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                            .checkin-table th { color: ${C.textMuted}; font-size: 0.72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 16px 24px; text-align: left; border-bottom: 2px solid rgba(27,29,42,0.06); background: ${C.surfaceAlt}; }
                            .checkin-table td { padding: 16px 24px; border-bottom: 1px solid ${C.border}; vertical-align: middle; transition: background 0.15s; }
                            .checkin-table tbody tr:hover td { background: rgba(52,211,153,0.03); }
                            .checkin-table tbody tr:last-child td { border-bottom: none; }
                        `}</style>
                        {filteredCheckins.length === 0 ? (
                            <div style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 56, height: 56, background: 'rgba(52,211,153,0.08)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle2 size={28} color={C.textMuted} />
                                </div>
                                <p style={{ fontSize: '0.88rem', fontWeight: 700, color: C.textMuted }}>No check-ins found for the selected period.</p>
                                <p style={{ fontSize: '0.75rem', fontWeight: 500, color: C.textMuted }}>Tourist check-ins will appear here in real-time.</p>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table className="checkin-table">
                                    <thead>
                                        <tr>
                                            <th>Tourist</th>
                                            <th>Check-In Type</th>
                                            <th>Location</th>
                                            <th>Zone</th>
                                            <th>Time</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCheckins.map((ci, idx) => (
                                            <tr key={ci._id || idx}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <div style={{
                                                            width: 38, height: 38,
                                                            background: 'linear-gradient(135deg, #34D399, #2DD4BF)',
                                                            borderRadius: 12,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontWeight: 800, fontSize: '0.88rem', color: '#FFFFFF', flexShrink: 0,
                                                        }}>
                                                            {ci.reporter?.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p style={{ fontWeight: 700, color: C.text, margin: 0, fontSize: '0.88rem' }}>{ci.reporter?.full_name || 'Unknown Tourist'}</p>
                                                            <p style={{ fontSize: '0.68rem', color: C.primary, margin: '2px 0 0', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>{ci.reporter?.blockchain_id || 'NO-CHAIN-ID'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 12px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
                                                        borderRadius: 20, display: 'inline-block', letterSpacing: '0.04em',
                                                        background: ci.title?.includes('Verified') ? 'rgba(108,99,255,0.08)' : 'rgba(52,211,153,0.08)',
                                                        color: ci.title?.includes('Verified') ? C.primary : C.safeDark,
                                                        border: `1px solid ${ci.title?.includes('Verified') ? 'rgba(108,99,255,0.2)' : 'rgba(52,211,153,0.2)'}`,
                                                    }}>
                                                        {ci.title?.includes('Verified') ? 'Stay Verified' : ci.title?.includes('Failed') ? 'Verify Failed' : 'Daily Check-In'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <MapPin size={13} color={C.safe} />
                                                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', fontWeight: 600, color: C.text }}>
                                                            {ci.latitude && ci.longitude ? `${ci.latitude.toFixed(4)}, ${ci.longitude.toFixed(4)}` : 'N/A'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    {ci.zone ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                            <div style={{
                                                                width: 8, height: 8, borderRadius: '50%',
                                                                background: ci.zone.risk_level === 'safe' ? C.safe : ci.zone.risk_level === 'moderate' ? C.moderate : C.high,
                                                            }} />
                                                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.text }}>{ci.zone.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span style={{ fontSize: '0.78rem', color: C.textMuted, fontStyle: 'italic' }}>Outside zones</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                        <Clock size={13} color={C.primaryLight} />
                                                        <div>
                                                            <p style={{ fontSize: '0.78rem', fontWeight: 600, color: C.textSecondary, margin: 0 }}>{new Date(ci.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                            <p style={{ fontSize: '0.62rem', fontWeight: 500, color: C.textMuted, margin: 0 }}>{new Date(ci.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ textAlign: 'right' }}>
                                                    {ci.reporter?._id && (
                                                        <button
                                                            onClick={() => navigate(`/authority/user/${ci.reporter._id}`)}
                                                            style={{
                                                                background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                                                                color: '#FFFFFF', border: 'none', borderRadius: 10,
                                                                padding: '6px 14px', fontFamily: 'inherit', fontWeight: 700,
                                                                fontSize: '0.72rem', cursor: 'pointer',
                                                                boxShadow: '0 2px 8px rgba(108,99,255,0.25)',
                                                                transition: 'all 0.15s',
                                                            }}
                                                        >
                                                            View Profile
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
