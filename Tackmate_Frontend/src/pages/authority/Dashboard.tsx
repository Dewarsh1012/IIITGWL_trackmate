import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../lib/api';
import { AlertTriangle, RefreshCw, Loader2, TrendingUp, Search, Users, Zap, Shield } from 'lucide-react';
import AuthorityMap from '../../components/maps/AuthorityMap';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';
import type { ZoneData } from '../../components/maps/TouristMap';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

const getSeverityStyle = (sev: string): React.CSSProperties => {
    switch (sev?.toLowerCase()) {
        case 'critical': return { background: '#FF0033', color: NB.white, border: `2px solid ${NB.black}` };
        case 'high': return { background: NB.red, color: NB.white, border: `2px solid ${NB.black}` };
        case 'medium': return { background: NB.orange, color: NB.white, border: `2px solid ${NB.black}` };
        default: return { background: NB.cream, color: NB.black, border: `2px solid ${NB.black}` };
    }
};

export default function AuthorityDashboard() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [incidents, setIncidents] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalUsers: 0, openIncidents: 0, sosLastHour: 0, activeUsersToday: 0 });
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState<ZoneData[]>([]);
    const [userLocations, setUserLocations] = useState<Record<string, { lat: number; lng: number; role?: string; name?: string; timestamp: number }>>({});
    const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    // Filter state for isolating a single user
    const [filteredUser, setFilteredUser] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [incidentsRes, summaryRes, zonesRes, locationsRes] = await Promise.all([
                api.get('/incidents?limit=10'),
                api.get('/analytics/summary'),
                api.get('/zones'),
                api.get('/locations/all')
            ]);

            if (incidentsRes.data.success) setIncidents(incidentsRes.data.data);
            if (summaryRes.data.success) setSummary(summaryRes.data.data);
            if (zonesRes.data.success) setZones(zonesRes.data.data);

            if (locationsRes.data.success) {
                const locMap: any = {};
                locationsRes.data.data.forEach((log: any) => {
                    if (log.user && !locMap[log.user._id]) {
                        locMap[log.user._id] = {
                            lat: log.latitude,
                            lng: log.longitude,
                            role: log.user.role,
                            name: log.user.full_name,
                            timestamp: new Date(log.recorded_at).getTime()
                        };
                    }
                });
                setUserLocations(locMap);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000);
        if (socket) {
            socket.on('new-incident', (incident: any) => { setIncidents(prev => [incident, ...prev.slice(0, 9)]); fetchDashboardData(); });
            socket.on('location:update', (data: any) => {
                // Handle both flattened and nested location data
                const lat = data.latitude || (data.location?.coordinates && data.location.coordinates[1]);
                const lng = data.longitude || (data.location?.coordinates && data.location.coordinates[0]);

                if (data.userId && lat && lng) {
                    setUserLocations(prev => ({
                        ...prev,
                        [data.userId]: {
                            lat,
                            lng,
                            role: data.role,
                            name: data.name,
                            timestamp: Date.now()
                        }
                    }));
                }
            });
        }
        return () => { clearInterval(interval); if (socket) { socket.off('new-incident'); socket.off('location:update'); } };
    }, [socket]);

    const handleUpdateIncident = async (id: string, status: string) => {
        try {
            setNotice(null);
            const res = await api.patch(`/incidents/${id}`, { status });
            if (res.data.success) setIncidents(prev => prev.map(i => i._id === id ? { ...i, status } : i));
        } catch (_err) {
            setNotice({ type: 'error', message: 'Failed to update incident status.' });
        }
    };

    const handleZoneCreated = async (layer: any) => {
        try {
            let latlng, radius;
            if (typeof layer.getRadius === 'function') {
                latlng = layer.getLatLng();
                radius = layer.getRadius();
            } else if (typeof layer.getBounds === 'function') {
                // Approximate polygon as a circle for the existing schema mapping
                latlng = layer.getBounds().getCenter();
                radius = latlng.distanceTo(layer.getBounds().getNorthEast());
            }

            if (latlng) {
                const payload = {
                    name: `Manual High-Risk Zone (${new Date().toLocaleTimeString()})`,
                    risk_level: 'high',
                    center_lat: latlng.lat,
                    center_lng: latlng.lng,
                    radius_meters: Math.min(Math.round(radius), 5000), // Cap at 5km
                    is_active: true
                };
                const res = await api.post('/zones', payload);
                if (res.data.success) {
                    setZones([...zones, res.data.data]);
                    setNotice({ type: 'success', message: 'High-risk zone added successfully.' });
                }
            }
        } catch (err: any) {
            setNotice({ type: 'error', message: `Failed to save zone: ${err.message}` });
        }
    };

    const filteredLocations = filteredUser ? { [filteredUser]: userLocations[filteredUser] } : userLocations;

    const statCards = [
        { label: 'Active Users', value: summary.activeUsersToday, icon: <Users size={20} />, accent: NB.blue, pulse: false },
        { label: 'Open Incidents', value: summary.openIncidents, icon: <AlertTriangle size={20} />, accent: NB.red, pulse: summary.openIncidents > 0 },
        { label: 'SOS (Last Hour)', value: summary.sosLastHour, icon: <Zap size={20} />, accent: '#FF0033', pulse: summary.sosLastHour > 0 },
        { label: 'Total Profiles', value: summary.totalUsers, icon: <Shield size={20} />, accent: NB.orange, pulse: false },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
            <AuthoritySidebar />

            <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0 }}>
                {/* Top bar */}
                <div className="top-header responsive-container" style={{ background: NB.white, borderBottom: `3px solid ${NB.black}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 3px 0 ${NB.black}` }}>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NB.black, margin: 0, letterSpacing: '-0.01em' }}>Command Dashboard</h1>
                        <p style={{ fontSize: '0.75rem', color: '#6B6B6B', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {user?.full_name} · {user?.designation || 'Authority Officer'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={fetchDashboardData} style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {notice && (
                    <div style={{ margin: '16px 28px 0', background: notice.type === 'success' ? NB.mint : '#FFF0F0', border: `3px solid ${notice.type === 'success' ? NB.black : NB.red}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: notice.type === 'success' ? NB.black : NB.red }}>
                        {notice.type === 'success' ? '✅' : '⚠️'} {notice.message}
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid-4 responsive-grid mobile-p-16" style={{ gap: 20, padding: '24px 28px 0' }}>
                    {statCards.map((s, i) => (
                        <div key={i} style={{
                            background: NB.white, border: `3px solid ${NB.black}`,
                            boxShadow: `4px 4px 0 ${NB.black}`,
                            borderTop: `6px solid ${s.accent}`,
                            padding: '20px',
                            animation: s.pulse ? 'nb-pulse 2s infinite' : undefined,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: 0 }}>{s.label}</p>
                                <div style={{ width: 36, height: 36, background: s.accent, border: `2px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accent === NB.yellow ? NB.black : NB.white }}>
                                    {s.icon}
                                </div>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: NB.black, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.value}</div>
                            {s.pulse && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}><div style={{ width: 8, height: 8, background: s.accent, animation: 'pulse-red 1.5s infinite' }} /><span style={{ fontSize: '0.65rem', fontWeight: 800, color: s.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Needs Attention</span></div>}
                            {!s.pulse && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, color: NB.mint, fontSize: '0.65rem', fontWeight: 700 }}><TrendingUp size={11} /> Live tracking active</div>}
                        </div>
                    ))}
                </div>

                {/* Map */}
                <div className="responsive-container" style={{ padding: '24px 28px 0', flex: 1, position: 'relative', minHeight: 420 }}>
                    <div style={{ border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, overflow: 'hidden', height: 420, position: 'relative' }}>
                        <AuthorityMap
                            zones={zones}
                            incidents={incidents}
                            userLocations={filteredLocations}
                            focusLocation={focusLocation}
                            onZoneCreated={handleZoneCreated}
                        />
                        {/* Search overlay & Clear filter */}
                        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 400, width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: NB.black }} />
                                <input
                                    value={searchQuery}
                                    onChange={e => {
                                        setSearchQuery(e.target.value);
                                        const q = e.target.value.toLowerCase();
                                        const zone = zones.find(z => z.name.toLowerCase().includes(q));
                                        if (zone) setFocusLocation({ lat: zone.center_lat, lng: zone.center_lng });
                                    }}
                                    placeholder="Search zones..."
                                    style={{ width: '100%', padding: '9px 12px 9px 32px', background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600, outline: 'none' }}
                                />
                            </div>
                            {filteredUser && (
                                <button onClick={() => { setFilteredUser(null); setFocusLocation(null); }} style={{ background: NB.red, color: NB.white, border: `2px solid ${NB.black}`, padding: '4px 8px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', boxShadow: `2px 2px 0 ${NB.black}` }}>
                                    Clear User Filter ✕
                                </button>
                            )}
                        </div>
                        {/* Legend */}
                        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 400, background: NB.white, border: `2px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '10px 14px' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Map Legend</div>
                            {[{ color: NB.blue, label: 'Resident (Live)' }, { color: NB.mint, label: 'Tourist (Live)' }, { color: NB.red, label: 'Active Incident' }, { color: '#FF0033', label: 'High Risk Zone', opacity: 0.5 }].map((l, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, color: NB.black }}>
                                    <div style={{ width: 10, height: 10, background: l.color, border: `1.5px solid ${NB.black}`, opacity: l.opacity || 1 }} />
                                    {l.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live Alert Feed */}
                <div style={{ padding: '24px 28px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: NB.black, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 24, background: NB.red, display: 'inline-block' }} />
                            Live Alert Feed
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#6B6B6B' }}>Click a row to isolate reporter on map</p>
                    </div>
                    <div style={{ border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, background: NB.white, overflow: 'hidden' }}>
                        {loading && incidents.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <Loader2 size={28} style={{ animation: 'spin-slow 1s linear infinite' }} />
                                <p style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B' }}>Connecting to node feed...</p>
                            </div>
                        ) : (
                            <table className="geo-table">
                                <thead>
                                    <tr>
                                        <th>Severity</th><th>Title / Zone</th><th>Reporter</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {incidents.map(incident => {
                                        const reporterId = incident.reporter?._id;
                                        const isFiltered = filteredUser === reporterId;
                                        return (
                                            <tr
                                                key={incident._id}
                                                onClick={() => {
                                                    if (!reporterId) return;
                                                    if (isFiltered) {
                                                        setFilteredUser(null);
                                                        setFocusLocation(null);
                                                    } else {
                                                        setFilteredUser(reporterId);
                                                        const loc = userLocations[reporterId];
                                                        if (loc) setFocusLocation({ lat: loc.lat, lng: loc.lng });
                                                        else setNotice({ type: 'error', message: "Reporter's live location is currently unavailable." });
                                                    }
                                                }}
                                                style={{
                                                    cursor: reporterId ? 'pointer' : 'default',
                                                    background: isFiltered ? 'rgba(255,229,0,0.15)' : 'transparent',
                                                    borderLeft: isFiltered ? `4px solid ${NB.yellow}` : '4px solid transparent'
                                                }}
                                            >
                                                <td>
                                                    <span style={{ ...getSeverityStyle(incident.severity), padding: '3px 10px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-block' }}>
                                                        {incident.severity}
                                                    </span>
                                                </td>
                                                <td>
                                                    <p style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.88rem' }}>{incident.title}</p>
                                                    <p style={{ fontSize: '0.72rem', color: '#6B6B6B', margin: 0, fontWeight: 600 }}>{incident.zone?.name || 'Unknown Location'}</p>
                                                </td>
                                                <td>
                                                    <p style={{ fontWeight: 600, color: NB.black, margin: 0, fontSize: '0.85rem' }}>{incident.reporter?.full_name || 'System'}</p>
                                                    <p style={{ fontSize: '0.7rem', color: NB.blue, margin: 0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{incident.reporter?.blockchain_id || 'LOCAL-AI'}</p>
                                                </td>
                                                <td>
                                                    <span style={{ padding: '3px 10px', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', border: `2px solid ${NB.black}`, background: incident.status === 'resolved' ? NB.mint : incident.status === 'acknowledged' ? NB.yellow : NB.cream }}>
                                                        {incident.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                    {incident.status !== 'resolved' && (
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                            {incident.status !== 'acknowledged' && (
                                                                <button onClick={() => handleUpdateIncident(incident._id, 'acknowledged')} style={{ background: NB.yellow, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, padding: '5px 12px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase' }}>
                                                                    Acknowledge
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleUpdateIncident(incident._id, 'resolved')} style={{ background: NB.mint, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, padding: '5px 12px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase' }}>
                                                                Resolve
                                                            </button>
                                                        </div>
                                                    )}
                                                    {incident.status === 'resolved' && <span style={{ fontSize: '0.72rem', fontWeight: 800, color: NB.mint, textTransform: 'uppercase' }}>✓ Done</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {incidents.length === 0 && (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '28px', color: '#6B6B6B', fontWeight: 600 }}>No active incidents in this sector.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
