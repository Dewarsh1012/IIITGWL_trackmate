import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../i18n';
import api from '../../lib/api';
import { AlertTriangle, RefreshCw, Loader2, TrendingUp, Search, Users, Zap, Shield, MapPin, Eye, Activity, Globe, CheckCircle2, Clock } from 'lucide-react';
import AuthorityMap from '../../components/maps/AuthorityMap';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';
import type { ZoneData } from '../../components/maps/TouristMap';

/* ── Clay color palette ── */
const C = {
    bg: '#F0EDFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F5FF',
    dark: '#1B1D2A',
    darkAlt: '#252840',
    text: '#1B1D2A',
    textSecondary: '#4A4D68',
    textMuted: '#8B8FA8',
    primary: '#6C63FF',
    primaryLight: '#8B85FF',
    accent: '#FF6B8A',
    safe: '#34D399',
    moderate: '#FBBF24',
    high: '#F87171',
    restricted: '#A78BFA',
    critical: '#EF4444',
    border: 'rgba(27,29,42,0.08)',
};

const clayCard: React.CSSProperties = {
    background: C.surface,
    borderRadius: 20,
    border: `1px solid ${C.border}`,
    boxShadow: '6px 6px 14px rgba(27,29,42,0.10), -3px -3px 10px rgba(255,255,255,0.9)',
};

const getSeverityStyle = (sev: string): React.CSSProperties => {
    switch (sev?.toLowerCase()) {
        case 'critical': return { background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#FFFFFF', borderRadius: 20, border: 'none' };
        case 'high': return { background: 'linear-gradient(135deg, #F87171, #EF4444)', color: '#FFFFFF', borderRadius: 20, border: 'none' };
        case 'medium': return { background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', color: '#FFFFFF', borderRadius: 20, border: 'none' };
        default: return { background: C.surfaceAlt, color: C.text, borderRadius: 20, border: `1px solid ${C.border}` };
    }
};

const clampProbability = (value: number): number => Math.max(0, Math.min(1, value));

const parseSosRisk = (alert: any) => {
    const metadata = alert?.metadata || {};
    const realDanger = clampProbability(Number(
        metadata.sos_risk_real_danger_probability ??
        metadata.sos_risk_hybrid_score ??
        metadata.hybrid_score ??
        0.5
    ));
    const falseAlarm = clampProbability(Number(
        metadata.sos_risk_false_alarm_probability ??
        (1 - realDanger)
    ));
    const confidenceBand = String(metadata.sos_risk_confidence_band || 'medium').toLowerCase();

    return {
        realDanger,
        falseAlarm,
        confidenceBand,
    };
};

export default function AuthorityDashboard() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const navigate = useNavigate();
    const [incidents, setIncidents] = useState<any[]>([]);
    const [summary, setSummary] = useState({ totalUsers: 0, openIncidents: 0, sosLastHour: 0, activeUsersToday: 0, totalTourists: 0, totalResidents: 0, totalBusinesses: 0 });
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState<ZoneData[]>([]);
    const [userLocations, setUserLocations] = useState<Record<string, { lat: number; lng: number; role?: string; name?: string; timestamp: number }>>({});
    const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUser, setFilteredUser] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [drawColor, setDrawColor] = useState(C.high);
    const [emergencyAlerts, setEmergencyAlerts] = useState<any[]>([]);
    const [checkins, setCheckins] = useState<any[]>([]);
    const [riskPulse, setRiskPulse] = useState<any>(null);
    const [crisisTimeline, setCrisisTimeline] = useState<any[]>([]);
    const [responderAssignments, setResponderAssignments] = useState<any[]>([]);
    const [guardianSummaries, setGuardianSummaries] = useState<any[]>([]);
    const [misuseFlags, setMisuseFlags] = useState<any[]>([]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [incidentsRes, summaryRes, zonesRes, locationsRes, checkinsRes, riskPulseRes] = await Promise.all([
                api.get('/incidents?limit=10'),
                api.get('/analytics/summary'),
                api.get('/zones'),
                api.get('/locations/all'),
                api.get('/locations/checkins/all').catch(() => ({ data: { success: false, data: [] } })),
                api.get('/analytics/risk-pulse').catch(() => ({ data: { success: false, data: null } })),
            ]);

            if (incidentsRes.data.success) setIncidents(incidentsRes.data.data);
            if (summaryRes.data.success) {
                const d = summaryRes.data.data;
                setSummary({
                    totalUsers: d.totalUsers || 0,
                    openIncidents: d.openIncidents || 0,
                    sosLastHour: d.sosLastHour || 0,
                    activeUsersToday: d.activeUsersToday || 0,
                    totalTourists: d.totalTourists || d.totalUsers || 0,
                    totalResidents: d.totalResidents || 0,
                    totalBusinesses: d.totalBusinesses || 0,
                });
            }
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
            if (checkinsRes.data.success) setCheckins(checkinsRes.data.data || []);
            if (riskPulseRes.data.success) setRiskPulse(riskPulseRes.data.data || null);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 60000);
        if (socket) {
            const onNewIncident = (incident: any) => {
                setIncidents(prev => [incident, ...prev.slice(0, 9)]);
                if (incident.incident_type === 'checkin') {
                    setCheckins(prev => [incident, ...prev.slice(0, 49)]);
                }
                fetchDashboardData();
            };

            const onSosTriggered = (incident: any) => {
                setEmergencyAlerts(prev => {
                    const deduped = prev.filter((item) => item._id !== incident._id);
                    return [incident, ...deduped].slice(0, 6);
                });
                setIncidents(prev => [incident, ...prev.slice(0, 9)]);
            };

            const onLocationUpdate = (data: any) => {
                const lat = data.latitude || (data.location?.coordinates && data.location.coordinates[1]);
                const lng = data.longitude || (data.location?.coordinates && data.location.coordinates[0]);
                if (data.userId && lat && lng) {
                    setUserLocations(prev => ({
                        ...prev,
                        [data.userId]: { lat, lng, role: data.role, name: data.name, timestamp: Date.now() }
                    }));
                }
            };

            const onRiskPulse = (payload: any) => {
                setRiskPulse(payload);
            };

            const onCrisisTimeline = (payload: any) => {
                const events = Array.isArray(payload?.events) ? payload.events : [];
                if (!events.length) return;

                const enrichedEvents = events.map((event: any) => ({
                    ...event,
                    incident_id: payload.incident_id,
                }));

                setCrisisTimeline((prev) => [...enrichedEvents.reverse(), ...prev].slice(0, 24));
            };

            const onResponderAssigned = (payload: any) => {
                setResponderAssignments((prev) => [payload, ...prev].slice(0, 8));
            };

            const onGuardianDispatchSummary = (payload: any) => {
                setGuardianSummaries((prev) => [payload, ...prev].slice(0, 8));
            };

            const onMisuseFlagged = (payload: any) => {
                setMisuseFlags((prev) => [payload, ...prev].slice(0, 8));
            };

            socket.on('new-incident', onNewIncident);
            socket.on('sos:triggered', onSosTriggered);
            socket.on('location:update', onLocationUpdate);
            socket.on('risk:pulse', onRiskPulse);
            socket.on('crisis:timeline', onCrisisTimeline);
            socket.on('responder:auto-assigned', onResponderAssigned);
            socket.on('guardian:dispatch-summary', onGuardianDispatchSummary);
            socket.on('sos:misuse-flagged', onMisuseFlagged);

            return () => {
                clearInterval(interval);
                socket.off('new-incident', onNewIncident);
                socket.off('sos:triggered', onSosTriggered);
                socket.off('location:update', onLocationUpdate);
                socket.off('risk:pulse', onRiskPulse);
                socket.off('crisis:timeline', onCrisisTimeline);
                socket.off('responder:auto-assigned', onResponderAssigned);
                socket.off('guardian:dispatch-summary', onGuardianDispatchSummary);
                socket.off('sos:misuse-flagged', onMisuseFlagged);
            };
        }

        return () => {
            clearInterval(interval);
        };
    }, [socket]);

    const handleUpdateIncident = async (id: string, status: string) => {
        try {
            setNotice(null);
            const res = await api.patch(`/incidents/${id}`, { status });
            if (res.data.success) setIncidents(prev => prev.map(i => i._id === id ? { ...i, status } : i));
        } catch {
            setNotice({ type: 'error', message: 'Failed to update incident status.' });
        }
    };

    const handleZoneCreated = async (layer: any, drawnColor?: string) => {
        try {
            let latlng: any, radius: number = 0;
            const geojson = (typeof layer.getLatLngs === 'function' && typeof layer.toGeoJSON === 'function')
                ? layer.toGeoJSON()
                : undefined;
            if (typeof layer.getRadius === 'function') {
                latlng = layer.getLatLng();
                radius = layer.getRadius();
            } else if (typeof layer.getBounds === 'function') {
                latlng = layer.getBounds().getCenter();
                radius = latlng.distanceTo(layer.getBounds().getNorthEast());
            }
            if (latlng) {
                let risk_level = 'restricted';
                if (drawnColor === C.safe) risk_level = 'safe';
                else if (drawnColor === C.moderate) risk_level = 'moderate';
                else if (drawnColor === C.high) risk_level = 'high';
                else if (drawnColor === C.restricted) risk_level = 'restricted';

                const payload: Record<string, any> = {
                    name: `Manual Zone (${new Date().toLocaleTimeString()})`,
                    risk_level,
                    center_lat: latlng.lat,
                    center_lng: latlng.lng,
                    radius_meters: Math.min(Math.round(radius), 5000),
                    is_active: true,
                };
                if (geojson) payload.geojson = geojson;
                const res = await api.post('/zones', payload);
                if (res.data.success) {
                    setZones(prev => [...prev, res.data.data]);
                    setNotice({ type: 'success', message: 'Zone added successfully.' });
                }
            }
        } catch (err: any) {
            setNotice({ type: 'error', message: `Failed to save zone: ${err.message}` });
        }
    };

    const handleZoneDeleted = async (zoneId: string) => {
        const confirmed = window.confirm('Delete this zone permanently?');
        if (!confirmed) return;

        try {
            setNotice(null);
            const res = await api.delete(`/zones/${zoneId}`);
            if (res.data.success) {
                setZones(prev => prev.filter(zone => String(zone._id) !== zoneId));
                setNotice({ type: 'success', message: 'Zone deleted successfully.' });
            }
        } catch {
            setNotice({ type: 'error', message: 'Failed to delete zone.' });
        }
    };

    const filteredLocations = filteredUser ? { [filteredUser]: userLocations[filteredUser] } : userLocations;

    /* Count users by role from live locations */
    const liveRoleCounts = Object.values(userLocations).reduce((acc, u) => {
        if (u.role === 'tourist') acc.tourists++;
        else if (u.role === 'resident') acc.residents++;
        else if (u.role === 'business') acc.businesses++;
        return acc;
    }, { tourists: 0, residents: 0, businesses: 0 });

    const { t } = useLanguage();

    const statCards = [
        { label: t('liveUsers'), value: Object.keys(userLocations).length, icon: <Eye size={20} />, color: C.primary, colorBg: 'rgba(108,99,255,0.08)', pulse: false },
        { label: t('openIncidents'), value: summary.openIncidents, icon: <AlertTriangle size={20} />, color: C.high, colorBg: 'rgba(248,113,113,0.08)', pulse: summary.openIncidents > 0 },
        { label: t('sosLastHour'), value: summary.sosLastHour, icon: <Zap size={20} />, color: C.critical, colorBg: 'rgba(239,68,68,0.08)', pulse: summary.sosLastHour > 0 },
        { label: t('totalProfiles'), value: summary.totalUsers, icon: <Shield size={20} />, color: C.safe, colorBg: 'rgba(52,211,153,0.08)', pulse: false },
    ];

    const roleBadges = [
        { label: t('tourists'), count: liveRoleCounts.tourists, color: C.primary, icon: <Globe size={14} /> },
        { label: t('residents'), count: liveRoleCounts.residents, color: C.safe, icon: <Users size={14} /> },
        { label: t('businesses'), count: liveRoleCounts.businesses, color: C.moderate, icon: <Activity size={14} /> },
    ];

    const pulseTrend = String(riskPulse?.trend || 'stable').toLowerCase();
    const pulseTrendColor = pulseTrend === 'rising' ? C.high : pulseTrend === 'falling' ? C.safe : C.primary;
    const pulseTrendLabel = pulseTrend === 'rising' ? 'Rising' : pulseTrend === 'falling' ? 'Cooling' : 'Stable';
    const pulseGlobal = Number(riskPulse?.global_risk_score || 0);
    const pulseForecast = Number(riskPulse?.forecast_risk_score || 0);
    const pulseHotspots = Array.isArray(riskPulse?.hotspots) ? riskPulse.hotspots.slice(0, 4) : [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />

            <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0 }}>
                {/* Top bar */}
                <div className="top-header responsive-container" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 12px rgba(27,29,42,0.04)' }}>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>{t('commandDashboard')}</h1>
                        <p style={{ fontSize: '0.75rem', color: C.textMuted, margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {user?.full_name} · {user?.designation || t('authorityOfficer')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {/* Role breakdown badges */}
                        {roleBadges.map((rb, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${rb.color}12`, padding: '6px 14px', borderRadius: 12, border: `1px solid ${rb.color}20` }}>
                                <span style={{ color: rb.color }}>{rb.icon}</span>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.text }}>{rb.count}</span>
                                <span style={{ fontSize: '0.62rem', fontWeight: 600, color: C.textMuted }}>{rb.label}</span>
                            </div>
                        ))}
                        <button onClick={fetchDashboardData} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', color: C.text, boxShadow: '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)', transition: 'all 0.15s' }}>
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> <span className="refresh-text">{t('refresh')}</span>
                        </button>
                    </div>
                </div>

                {/* Emergency Alerts Navbar Banner */}
                {emergencyAlerts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        {emergencyAlerts.map(alert => {
                            const risk = parseSosRisk(alert);
                            const role = String(alert.reporter?.role || alert.metadata?.triggered_by_role || 'unknown').toUpperCase();
                            const confidenceColor = risk.confidenceBand === 'critical'
                                ? '#FEE2E2'
                                : risk.confidenceBand === 'high'
                                    ? '#FECACA'
                                    : '#FDE68A';

                            return (
                                <div key={`sos-${alert._id}`} className="responsive-container" style={{
                                    width: '100%',
                                    background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                                    padding: '16px 28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 18,
                                    animation: 'nb-pulse 1.2s infinite',
                                    borderBottom: '2px solid #991B1B',
                                    boxShadow: '0 4px 14px rgba(185,28,28,0.35)',
                                    zIndex: 900,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0, flex: 1 }}>
                                        <AlertTriangle size={24} color="#FFFFFF" strokeWidth={2.5} style={{ marginTop: 4, flexShrink: 0 }} />
                                        <div style={{ minWidth: 0, flex: 1 }}>
                                            <h2 style={{ color: '#FFFFFF', fontWeight: 900, margin: 0, fontSize: '1rem', letterSpacing: '0.04em' }}>
                                                RED ALERT: {alert.title}
                                            </h2>
                                            <p style={{ color: '#FFFFFF', fontWeight: 700, margin: '4px 0 0', fontSize: '0.85rem' }}>
                                                Person in danger: {alert.reporter?.full_name || 'Unknown User'} ({role})
                                            </p>
                                            <p style={{ color: 'rgba(255,255,255,0.86)', margin: '2px 0 0', fontSize: '0.78rem', fontWeight: 600 }}>
                                                Zone: {alert.zone?.name || 'Unknown'} | Loc: {alert.latitude?.toFixed(4)}, {alert.longitude?.toFixed(4)}
                                            </p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10, maxWidth: 520 }}>
                                                <div style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '8px 10px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFFFFF' }}>Real Danger</span>
                                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FFFFFF' }}>{Math.round(risk.realDanger * 100)}%</span>
                                                    </div>
                                                    <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.round(risk.realDanger * 100)}%`, height: '100%', background: '#FFFFFF' }} />
                                                    </div>
                                                </div>
                                                <div style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '8px 10px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFFFFF' }}>False Alarm</span>
                                                        <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#FFFFFF' }}>{Math.round(risk.falseAlarm * 100)}%</span>
                                                    </div>
                                                    <div style={{ width: '100%', height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                                                        <div style={{ width: `${Math.round(risk.falseAlarm * 100)}%`, height: '100%', background: '#FCA5A5' }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                                        <span style={{ background: confidenceColor, color: '#7F1D1D', borderRadius: 999, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            {risk.confidenceBand} confidence
                                        </span>
                                        <div style={{ display: 'flex', gap: 12 }}>
                                            <button onClick={() => setFocusLocation({ lat: alert.latitude, lng: alert.longitude })} style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 10, padding: '8px 16px', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', color: '#FFFFFF', fontSize: '0.8rem', transition: 'all 0.2s' }}>
                                                Track Location
                                            </button>
                                            <button onClick={() => {
                                                setEmergencyAlerts(prev => prev.filter(a => a._id !== alert._id));
                                                handleUpdateIncident(alert._id, 'acknowledged');
                                            }} style={{ background: '#FFFFFF', border: 'none', borderRadius: 10, padding: '8px 16px', fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', color: C.critical, fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s' }}>
                                                Acknowledge
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {notice && (
                    <div style={{ margin: '16px 28px 0', background: notice.type === 'success' ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)', border: `1px solid ${notice.type === 'success' ? C.safe : C.high}30`, borderRadius: 14, padding: '12px 16px', fontSize: '0.82rem', fontWeight: 700, color: notice.type === 'success' ? '#059669' : '#DC2626' }}>
                        {notice.type === 'success' ? '✅' : '⚠️'} {notice.message}
                    </div>
                )}

                {/* Stat Cards */}
                <div className="grid-4 responsive-grid" style={{ gap: 16, padding: '20px 28px 0' }}>
                    {statCards.map((s, i) => (
                        <div key={i} style={{
                            ...clayCard,
                            padding: '20px',
                            borderLeft: `4px solid ${s.color}`,
                            animation: s.pulse ? 'nb-pulse 2s infinite' : undefined,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, margin: 0 }}>{s.label}</p>
                                <div style={{ width: 38, height: 38, background: s.colorBg, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                                    {s.icon}
                                </div>
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{s.value}</div>
                            {s.pulse && <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, animation: 'pulse-red 1.5s infinite' }} /><span style={{ fontSize: '0.65rem', fontWeight: 700, color: s.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Needs Attention</span></div>}
                            {!s.pulse && <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, color: C.safe, fontSize: '0.65rem', fontWeight: 700 }}><TrendingUp size={11} /> Live tracking active</div>}
                        </div>
                    ))}
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, padding: '16px 28px 0' }}>
                    <div style={{ ...clayCard, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted }}>
                                    Predictive Risk Pulse
                                </p>
                                <h3 style={{ margin: '4px 0 0', fontWeight: 800, color: C.text, fontSize: '1rem' }}>
                                    Live Forecast Engine
                                </h3>
                            </div>
                            <span style={{ background: `${pulseTrendColor}18`, color: pulseTrendColor, border: `1px solid ${pulseTrendColor}25`, borderRadius: 999, padding: '4px 10px', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                {pulseTrendLabel}
                            </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                            <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px' }}>
                                <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Current Risk</p>
                                <p style={{ margin: '2px 0 0', fontSize: '1.5rem', fontWeight: 800, color: pulseGlobal >= 70 ? C.high : pulseGlobal >= 45 ? C.moderate : C.safe, fontFamily: "'JetBrains Mono', monospace" }}>
                                    {pulseGlobal}
                                </p>
                            </div>
                            <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px' }}>
                                <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>+60m Forecast</p>
                                <p style={{ margin: '2px 0 0', fontSize: '1.5rem', fontWeight: 800, color: pulseForecast >= 70 ? C.high : pulseForecast >= 45 ? C.moderate : C.safe, fontFamily: "'JetBrains Mono', monospace" }}>
                                    {pulseForecast}
                                </p>
                            </div>
                        </div>

                        {pulseHotspots.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {pulseHotspots.map((hotspot: any) => (
                                    <div key={hotspot.zone_id} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: C.text }}>{hotspot.zone_name}</p>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.64rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>{hotspot.trend} trend</p>
                                        </div>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: hotspot.risk_score >= 65 ? C.high : C.primary }}>
                                            {hotspot.risk_score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ margin: 0, fontSize: '0.76rem', color: C.textMuted, fontWeight: 600 }}>Risk pulse warming up. No hotspot forecast yet.</p>
                        )}
                    </div>

                    <div style={{ ...clayCard, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text }}>
                                Auto Responder Queue
                            </h3>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: C.textMuted }}>{responderAssignments.length} live</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 228, overflowY: 'auto' }}>
                            {responderAssignments.length > 0 ? responderAssignments.map((assignment, idx) => (
                                <div key={`${assignment.incident_id || 'assignment'}-${idx}`} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 10px' }}>
                                    <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: C.text }}>Incident {String(assignment.incident_id || '').slice(-6).toUpperCase()}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: C.textMuted, fontWeight: 600 }}>
                                        Primary: {assignment.primary_responder?.full_name || 'Pending'}
                                    </p>
                                </div>
                            )) : (
                                <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '0.74rem', color: C.textMuted, fontWeight: 600 }}>No active auto-assignments yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '16px 28px 0' }}>
                    <div style={{ ...clayCard, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text }}>
                                Live Crisis Timeline
                            </h3>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: C.textMuted }}>{crisisTimeline.length} events</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 228, overflowY: 'auto' }}>
                            {crisisTimeline.length > 0 ? crisisTimeline.map((event, idx) => (
                                <div key={`${event.event_id || idx}`} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 10px' }}>
                                    <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: C.text }}>{event.label}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.64rem', color: C.textMuted, fontWeight: 600 }}>
                                        {event.actor_role || 'system'} · {event.incident_id ? `#${String(event.incident_id).slice(-6).toUpperCase()}` : 'global'}
                                    </p>
                                </div>
                            )) : (
                                <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '0.74rem', color: C.textMuted, fontWeight: 600 }}>Timeline feed waiting for incident events.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ ...clayCard, padding: '16px 18px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text }}>
                                Guardian + Misuse Shield
                            </h3>
                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: C.textMuted }}>
                                {guardianSummaries.length + misuseFlags.length} signals
                            </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 228, overflowY: 'auto' }}>
                            {guardianSummaries.map((item, idx) => (
                                <div key={`guardian-${idx}`} style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 12, padding: '8px 10px' }}>
                                    <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: C.text }}>Guardian dispatch sent</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.64rem', color: C.textMuted, fontWeight: 600 }}>
                                        #{String(item.incident_id || '').slice(-6).toUpperCase()} · {item.recipient_count || 0} recipients
                                    </p>
                                </div>
                            ))}
                            {misuseFlags.map((item, idx) => (
                                <div key={`misuse-${idx}`} style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 12, padding: '8px 10px' }}>
                                    <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: C.high }}>Misuse shield flagged SOS</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.64rem', color: C.textMuted, fontWeight: 600 }}>
                                        #{String(item.incident_id || '').slice(-6).toUpperCase()} · score {Math.round(Number(item.misuse_risk_score || 0) * 100)}%
                                    </p>
                                </div>
                            ))}
                            {guardianSummaries.length === 0 && misuseFlags.length === 0 && (
                                <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px' }}>
                                    <p style={{ margin: 0, fontSize: '0.74rem', color: C.textMuted, fontWeight: 600 }}>No guardian or misuse alerts at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Live Monitoring Panel */}
                <div className="responsive-container" style={{ padding: '16px 28px 0' }}>
                    <div style={{ ...clayCard, padding: '16px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted }}>Live Monitoring</p>
                            <h3 style={{ margin: '4px 0 0', fontWeight: 800, color: C.text, fontSize: '1rem' }}>Authority Command Live Map</h3>
                            <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: C.textMuted }}>Tracking {Object.keys(userLocations).length} live devices across zones.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button
                                onClick={() => {
                                    setFilteredUser(null);
                                    setFocusLocation(null);
                                }}
                                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', color: C.text }}
                            >
                                Reset View
                            </button>
                            <button
                                onClick={() => {
                                    const first = Object.values(userLocations)[0];
                                    if (first) setFocusLocation({ lat: first.lat, lng: first.lng });
                                }}
                                style={{ background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', borderRadius: 12, padding: '8px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', color: '#FFFFFF', boxShadow: '0 6px 12px rgba(108,99,255,0.25)' }}
                            >
                                Focus Live
                            </button>
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="responsive-container" style={{ padding: '20px 28px 0', flex: 1, position: 'relative', minHeight: 420 }}>
                    <div style={{ ...clayCard, overflow: 'hidden', height: 420, position: 'relative', padding: 0 }}>
                        <AuthorityMap
                            zones={zones}
                            incidents={incidents}
                            userLocations={filteredLocations}
                            focusLocation={focusLocation}
                            onZoneCreated={handleZoneCreated}
                            onZoneDeleted={handleZoneDeleted}
                            drawColor={drawColor}
                        />
                        {/* Search overlay & controls */}
                        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 400, width: 240, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                                <input
                                    value={searchQuery}
                                    onChange={e => {
                                        setSearchQuery(e.target.value);
                                        const q = e.target.value.toLowerCase();
                                        const zone = zones.find(z => z.name.toLowerCase().includes(q));
                                        if (zone) setFocusLocation({ lat: zone.center_lat, lng: zone.center_lng });
                                    }}
                                    placeholder="Search zones..."
                                    style={{ width: '100%', padding: '10px 14px 10px 34px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '0 4px 12px rgba(27,29,42,0.08)', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600, outline: 'none', color: C.text }}
                                />
                            </div>

                            {/* Color Picker for Geofencing */}
                            <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '0 4px 12px rgba(27,29,42,0.08)', padding: '10px 14px' }}>
                                <p style={{ margin: '0 0 8px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Draw Zone</p>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[
                                        { color: C.safe, label: 'Safe' },
                                        { color: C.moderate, label: 'Moderate' },
                                        { color: C.high, label: 'High' },
                                        { color: C.restricted, label: 'Restricted' }
                                    ].map(c => (
                                        <button
                                            key={c.color}
                                            onClick={() => setDrawColor(c.color)}
                                            title={c.label}
                                            style={{
                                                width: 28, height: 28, borderRadius: '50%', background: c.color, cursor: 'pointer',
                                                border: drawColor === c.color ? '3px solid #FFFFFF' : '2px solid transparent',
                                                boxShadow: drawColor === c.color ? `0 0 0 2px ${c.color}, 0 4px 8px rgba(0,0,0,0.15)` : '0 2px 6px rgba(0,0,0,0.1)',
                                                transition: 'all 0.15s'
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {filteredUser && (
                                <button onClick={() => { setFilteredUser(null); setFocusLocation(null); }} style={{ background: 'linear-gradient(135deg, #F87171, #EF4444)', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '8px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer', boxShadow: '0 4px 12px rgba(248,113,113,0.3)' }}>
                                    Clear User Filter ✕
                                </button>
                            )}
                        </div>
                        {/* Legend */}
                        <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 400, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '0 4px 12px rgba(27,29,42,0.08)', padding: '10px 16px' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, color: C.textMuted }}>Map Legend</div>
                            {[{ color: C.safe, label: 'Safe Zone' }, { color: C.moderate, label: 'Moderate Zone' }, { color: C.high, label: 'High Risk' }, { color: C.restricted, label: 'Restricted Zone' }].map((l, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, color: C.text }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, boxShadow: `0 0 4px ${l.color}60` }} />
                                    {l.label}
                                </div>
                            ))}
                            {/* User pin legend */}
                            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 6, paddingTop: 6 }}>
                                {[{ color: C.primary, label: 'Tourist' }, { color: C.safe, label: 'Resident' }, { color: C.moderate, label: 'Business' }].map((l, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.72rem', fontWeight: 600, marginBottom: 3, color: C.text }}>
                                        <MapPin size={10} color={l.color} />
                                        {l.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Daily Check-Ins Section */}
                <div style={{ padding: '20px 28px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 4, height: 24, borderRadius: 4, background: 'linear-gradient(180deg, #34D399, #2DD4BF)', display: 'inline-block' }} />
                            {t('dailyCheckins')}
                            {checkins.length > 0 && <span style={{ padding: '3px 10px', background: 'linear-gradient(135deg, #34D399, #2DD4BF)', color: '#FFFFFF', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', borderRadius: 20 }}>{checkins.length} {t('checkinToday')}</span>}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: C.textMuted }}>{t('touristCheckins24h')}</p>
                    </div>
                    <div style={{ ...clayCard, overflow: 'hidden', padding: 0 }}>
                        {checkins.length === 0 ? (
                            <div style={{ padding: 28, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <CheckCircle2 size={24} color={C.textMuted} />
                                <p style={{ fontSize: '0.78rem', fontWeight: 700, color: C.textMuted }}>{t('noCheckins24h')}</p>
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 0 }}>
                                {checkins.slice(0, 12).map((ci, idx) => (
                                    <div
                                        key={ci._id || idx}
                                        onClick={() => ci.reporter?._id && navigate(`/authority/user/${ci.reporter._id}`)}
                                        style={{
                                            padding: '14px 18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            borderBottom: `1px solid ${C.border}`,
                                            borderRight: `1px solid ${C.border}`,
                                            cursor: ci.reporter?._id ? 'pointer' : 'default',
                                            transition: 'background 0.15s',
                                            background: 'transparent',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.04)'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                                    >
                                        <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #34D399, #2DD4BF)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#FFFFFF', flexShrink: 0 }}>
                                            {ci.reporter?.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 700, color: C.text, margin: 0, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ci.reporter?.full_name || 'Unknown User'}
                                            </p>
                                            <p style={{ fontSize: '0.68rem', color: C.textMuted, margin: '2px 0 0', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {ci.description || ci.zone?.name || 'Location check-in'}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.68rem', color: C.textMuted, fontWeight: 600 }}>
                                                <Clock size={11} />
                                                {new Date(ci.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div style={{ marginTop: 2, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.safe }} />
                                                <span style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', color: C.safe }}>{t('checkedInStatus')}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Alert Feed */}
                <div style={{ padding: '20px 28px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 4, height: 24, borderRadius: 4, background: 'linear-gradient(180deg, #EF4444, #F87171)', display: 'inline-block' }} />
                            {t('liveAlertFeed')}
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: C.textMuted }}>{t('clickRowToIsolate')}</p>
                    </div>
                    <div style={{ ...clayCard, overflow: 'hidden', padding: 0 }}>
                        {loading && incidents.length === 0 ? (
                            <div style={{ padding: 40, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                                <Loader2 size={28} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
                                <p style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted }}>{t('connectingToFeed')}</p>
                            </div>
                        ) : (
                            <table className="geo-table">
                                <thead>
                                    <tr>
                                        <th>{t('severityCol')}</th><th>{t('titleZone')}</th><th>{t('reporter')}</th><th>{t('status')}</th><th style={{ textAlign: 'right' }}>{t('actions')}</th>
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
                                                    if (isFiltered) { setFilteredUser(null); setFocusLocation(null); }
                                                    else {
                                                        setFilteredUser(reporterId);
                                                        const loc = userLocations[reporterId];
                                                        if (loc) setFocusLocation({ lat: loc.lat, lng: loc.lng });
                                                        else setNotice({ type: 'error', message: "Reporter's live location is currently unavailable." });
                                                    }
                                                }}
                                                style={{
                                                    cursor: reporterId ? 'pointer' : 'default',
                                                    background: isFiltered ? 'rgba(108,99,255,0.06)' : 'transparent',
                                                    borderLeft: isFiltered ? `4px solid ${C.primary}` : '4px solid transparent',
                                                    transition: 'all 0.15s'
                                                }}
                                            >
                                                <td>
                                                    <span style={{ ...getSeverityStyle(incident.severity), padding: '4px 12px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'inline-block' }}>
                                                        {incident.severity}
                                                    </span>
                                                </td>
                                                <td>
                                                    <p style={{ fontWeight: 700, color: C.text, margin: 0, fontSize: '0.88rem' }}>{incident.title}</p>
                                                    <p style={{ fontSize: '0.72rem', color: C.textMuted, margin: 0, fontWeight: 500 }}>{incident.zone?.name || t('unknownLocation')}</p>
                                                </td>
                                                <td onClick={e => { e.stopPropagation(); if (incident.reporter?._id) navigate(`/authority/user/${incident.reporter._id}`); }} style={{ cursor: incident.reporter?._id ? 'pointer' : 'default' }}>
                                                    <p style={{ fontWeight: 600, color: incident.reporter?._id ? C.primary : C.text, margin: 0, fontSize: '0.85rem', textDecoration: incident.reporter?._id ? 'underline' : 'none' }}>{incident.reporter?.full_name || t('system')}</p>
                                                    <p style={{ fontSize: '0.7rem', color: C.primary, margin: 0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{incident.reporter?.blockchain_id || 'LOCAL-AI'}</p>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 12px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', borderRadius: 20,
                                                        background: incident.status === 'resolved' ? 'rgba(52,211,153,0.12)' : incident.status === 'acknowledged' ? 'rgba(108,99,255,0.08)' : C.surfaceAlt,
                                                        color: incident.status === 'resolved' ? '#059669' : incident.status === 'acknowledged' ? C.primary : C.textSecondary,
                                                        border: `1px solid ${incident.status === 'resolved' ? '#34D39930' : incident.status === 'acknowledged' ? '#6C63FF20' : C.border}`
                                                    }}>
                                                        {incident.status}
                                                    </span>
                                                </td>
                                                <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                                                    {incident.status !== 'resolved' && (
                                                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                                            {incident.status !== 'acknowledged' && (
                                                                <button onClick={() => handleUpdateIncident(incident._id, 'acknowledged')} style={{ background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '6px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(108,99,255,0.25)' }}>
                                                                    {t('acknowledge')}
                                                                </button>
                                                            )}
                                                            <button onClick={() => handleUpdateIncident(incident._id, 'resolved')} style={{ background: 'linear-gradient(135deg, #34D399, #2DD4BF)', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '6px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(52,211,153,0.25)' }}>
                                                                {t('resolve')}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {incident.status === 'resolved' && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.safe }}>{t('done')}</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {incidents.length === 0 && (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: 28, color: C.textMuted, fontWeight: 600 }}>{t('noActiveIncidents')}</td></tr>
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
