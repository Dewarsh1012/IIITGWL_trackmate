import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useLanguage } from '../../i18n';
import { Link } from 'react-router-dom';
import { Shield, AlertTriangle, TrendingUp, Plus, Layers, Activity, Loader2, Users, Check, ShieldAlert } from 'lucide-react';
import AlertPanel from '../../components/alerts/AlertPanel';
import TouristMap, { type ZoneData } from '../../components/maps/TouristMap';
import { enqueueOfflineSos, flushOfflineSosQueue, getOfflineSosQueueCount } from '../../lib/offlineSos';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard } from '../../theme/clayTheme';

export default function ResidentDashboard() {
    const { user } = useAuth();
    const { t } = useLanguage();
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
    const [guardianDispatches, setGuardianDispatches] = useState<any[]>([]);
    const [notice, setNotice] = useState<string | null>(null);

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

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(null), 4200);
        return () => window.clearTimeout(timer);
    }, [notice]);

    const handleSOSStart = () => { if (sosIntervalRef.current) clearInterval(sosIntervalRef.current); setCountdown(3); sosIntervalRef.current = window.setInterval(() => { setCountdown((prev) => prev - 1); }, 1000); };
    const handleSOSEnd = () => { if (sosIntervalRef.current) { clearInterval(sosIntervalRef.current); sosIntervalRef.current = null; } setCountdown(0); };

    useEffect(() => { if (countdown === 0 && sosIntervalRef.current) { clearInterval(sosIntervalRef.current); sosIntervalRef.current = null; triggerSOS(); } }, [countdown]);

    const triggerSOS = async () => {
        setSosLoading(true);
        const payload: Record<string, any> = {
            title: 'EMERGENCY SOS TRIGGERED',
            incident_type: 'sos_emergency',
            severity: 'critical',
            source: 'sos_panic',
            latitude: userLat || 27.5855,
            longitude: userLng || 91.8594,
            is_public: true,
            metadata: {
                triggered_by_role: 'resident',
                triggered_by_name: user?.full_name || 'Resident User',
            },
        };

        try {
            const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej)).catch(() => null);
            payload.latitude = pos?.coords.latitude || payload.latitude;
            payload.longitude = pos?.coords.longitude || payload.longitude;

            if (!navigator.onLine) {
                enqueueOfflineSos(payload, 'resident');
                setNotice(`No network. SOS saved offline (${getOfflineSosQueueCount()} queued).`);
                return;
            }

            await api.post('/incidents', payload);
            setSosSuccess(true); setTimeout(() => setSosSuccess(false), 5000);
        } catch {
            enqueueOfflineSos(payload, 'resident');
            setNotice(`Network unstable. SOS cached safely (${getOfflineSosQueueCount()} queued).`);
        } finally { setSosLoading(false); }
    };

    useEffect(() => {
        if (user?.ward) {
            fetchWardData();
            const interval = setInterval(fetchWardData, 60000);
            if (socket) {
                const wardId = typeof user.ward === 'object' ? user.ward._id : user.ward;
                const onNewIncident = (incident: any) => {
                    const incWardId = typeof incident.ward === 'object' ? incident.ward?._id : incident.ward;
                    if (incWardId === wardId) setIncidents(prev => [incident, ...prev.slice(0, 9)]);
                };
                const onGuardianDispatch = (dispatch: any) => {
                    setGuardianDispatches((prev) => [dispatch, ...prev].slice(0, 5));
                    setNotice('Guardian assist request received nearby.');
                };

                socket.on('new-incident', onNewIncident);
                socket.on('guardian:dispatch', onGuardianDispatch);

                return () => {
                    clearInterval(interval);
                    socket.off('new-incident', onNewIncident);
                    socket.off('guardian:dispatch', onGuardianDispatch);
                };
            }
            return () => { clearInterval(interval); };
        } else { fetchGeneralData(); }
    }, [user, socket]);

    useEffect(() => {
        const flushQueuedSos = async () => {
            if (!navigator.onLine) return;
            const result = await flushOfflineSosQueue();
            if (result.sent > 0) {
                setNotice(`${result.sent} offline SOS alert(s) sent.`);
            }
        };

        void flushQueuedSos();
        const onOnline = () => void flushQueuedSos();

        window.addEventListener('online', onOnline);
        return () => {
            window.removeEventListener('online', onOnline);
        };
    }, []);

    const fetchGeneralData = async () => {
        try {
            const [incidentsRes, zonesRes] = await Promise.all([api.get('/incidents?limit=5'), api.get('/zones')]);
            if (incidentsRes.data.success) setIncidents(incidentsRes.data.data || []);
            if (zonesRes.data.success) setZones(zonesRes.data.data || []);
        } catch { } finally { setLoading(false); }
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
        } catch { } finally { setLoading(false); }
    };

    const sevColor = (s: string) => ({ critical: C.critical, high: C.high }[s] || C.primary);
    const sevBg = (s: string) => ({ critical: 'rgba(239,68,68,0.08)', high: 'rgba(248,113,113,0.08)' }[s] || 'rgba(108,99,255,0.06)');

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={32} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('loadingWardData')}</p>
        </div>
    );

    const score = analytics?.safety_score || 85;

    return (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 100 }}>
            {/* No-ward banner */}
            {!user?.ward && (
                <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 16, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', fontWeight: 600, color: '#92400E' }}>
                    <AlertTriangle size={16} color={C.moderate} />
                    No ward assigned to your account. Showing general area data. Contact local authority to get assigned.
                </div>
            )}

            {notice && (
                <div style={{ background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 14, padding: '10px 14px', marginBottom: 16, fontSize: '0.78rem', fontWeight: 700, color: C.primary }}>
                    {notice}
                </div>
            )}

            {/* Ward Header */}
            <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 16, marginBottom: 20 }}>
                <div style={{ ...clayCard, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, margin: 0 }}>{wardData?.name || t('yourArea')}</h2>
                        <p style={{ margin: '4px 0 0', color: C.textMuted, fontSize: '0.8rem', fontWeight: 500 }}>
                            {wardData ? `Live Monitoring · ${wardData.district}, ${wardData.state}` : 'General Monitoring · All Areas'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                        <AlertPanel />
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted, margin: 0 }}>Score</p>
                            <p style={{ color: score > 80 ? C.safe : C.moderate, fontWeight: 700, margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                                <TrendingUp size={12} /> Healthy
                            </p>
                        </div>
                        <div style={{ position: 'relative', width: 64, height: 64 }}>
                            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="32" cy="32" r="26" fill="none" stroke={C.border} strokeWidth="6" />
                                <circle cx="32" cy="32" r="26" fill="none" stroke={score > 80 ? C.safe : C.moderate} strokeWidth="6" strokeDasharray="163.4" strokeDashoffset={163.4 - (163.4 * score / 100)} strokeLinecap="round" />
                            </svg>
                            <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontWeight: 800, fontSize: '0.88rem', color: C.text }}>{score}</span>
                        </div>
                    </div>
                </div>
                <div style={{ background: 'linear-gradient(135deg, #1B1D2A, #252840)', borderRadius: 20, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '6px 6px 14px rgba(27,29,42,0.10), -3px -3px 10px rgba(255,255,255,0.9)' }}>
                    <Users size={24} color={C.primary} />
                    <p style={{ fontSize: '1.8rem', fontWeight: 800, color: '#FFFFFF', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>{analytics?.resident_count || 42}</p>
                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>Active Circle</p>
                </div>
            </section>

            {/* SOS Section */}
            <section style={{ marginBottom: 20 }}>
                {countdown > 0 ? (
                    <div style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', padding: '20px', borderRadius: 20, color: '#FFFFFF', textAlign: 'center', boxShadow: '0 8px 30px rgba(239,68,68,0.3)', animation: 'nb-pulse 1s infinite' }}>
                        <h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 900 }}>{countdown}</h2>
                        <p style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Release to Cancel SOS</p>
                    </div>
                ) : sosSuccess ? (
                    <div style={{ background: 'linear-gradient(135deg, #1B1D2A, #252840)', padding: '20px', borderRadius: 20, color: C.safe, textAlign: 'center', boxShadow: '6px 6px 14px rgba(27,29,42,0.10), -3px -3px 10px rgba(255,255,255,0.9)' }}>
                        <Check size={32} style={{ margin: '0 auto 10px' }} />
                        <h3 style={{ fontSize: '1.2rem', margin: '0 0 4px', fontWeight: 800 }}>{t('helpDispatched')}</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Authorities notified and mapped to your live location.</p>
                    </div>
                ) : (
                    <button
                        onMouseDown={handleSOSStart} onMouseUp={handleSOSEnd} onMouseLeave={handleSOSEnd}
                        onTouchStart={handleSOSStart} onTouchEnd={handleSOSEnd}
                        disabled={sosLoading}
                        style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #F87171, #EF4444)', border: 'none', borderRadius: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: sosLoading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(239,68,68,0.3)', transition: 'all 0.15s' }}
                    >
                        <ShieldAlert size={28} color="#FFFFFF" />
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('holdForEmergency')}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>{t('holdFor3Seconds')}</span>
                    </button>
                )}
            </section>

            {/* Map Section */}
            <section style={{ ...clayCard, height: 400, position: 'relative', overflow: 'hidden', marginBottom: 20, display: 'flex', flexDirection: 'column', padding: 0 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <TouristMap lat={userLat || wardData?.latitude} lng={userLng || wardData?.longitude} zones={zones} />
                </div>
                <div style={{ background: C.surfaceAlt, borderTop: `1px solid ${C.border}`, padding: '10px 14px', display: 'flex', gap: 10, overflowX: 'auto', borderRadius: '0 0 20px 20px' }}>
                    {[{ label: 'Safe', color: C.safe }, { label: 'Moderate', color: C.moderate }, { label: 'Restricted', color: C.high }].map(l => (
                        <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.65rem', fontWeight: 700, padding: '4px 10px', background: C.surface, color: C.text, borderRadius: 10, border: `1px solid ${C.border}` }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />{l.label}
                        </div>
                    ))}
                </div>
            </section>

            {guardianDispatches.length > 0 && (
                <section style={{ ...clayCard, padding: '14px 16px', marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <h3 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: C.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Guardian Dispatch Queue
                        </h3>
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.textMuted }}>
                            {guardianDispatches.length} live
                        </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {guardianDispatches.map((dispatch, index) => (
                            <div key={`${dispatch.incident_id || 'dispatch'}-${index}`} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {dispatch.incident_title || 'Emergency Nearby'}
                                    </p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: C.textMuted, fontWeight: 600 }}>
                                        {dispatch.message || 'Local guardian assistance requested.'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setGuardianDispatches((prev) => prev.filter((_, i) => i !== index))}
                                    style={{ background: 'linear-gradient(135deg, #34D399, #2DD4BF)', color: '#FFFFFF', border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', cursor: 'pointer' }}
                                >
                                    On Way
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Bottom row */}
            <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ fontWeight: 800, color: C.text, margin: 0 }}>{t('recentIncidents')}</h3>
                        <Link to="/resident/incidents" style={{ fontSize: '0.72rem', fontWeight: 700, color: C.primary, textDecoration: 'none', textTransform: 'uppercase' }}>View Map</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {incidents.length > 0 ? incidents.map(inc => (
                            <div key={inc._id} style={{ ...clayCard, padding: '14px', display: 'flex', gap: 10, borderLeft: `4px solid ${sevColor(inc.severity)}`, background: sevBg(inc.severity) }}>
                                <AlertTriangle size={16} color={sevColor(inc.severity)} style={{ flexShrink: 0, marginTop: 2 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <h4 style={{ fontWeight: 700, color: C.text, margin: 0, fontSize: '0.85rem' }}>{inc.title}</h4>
                                        <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', background: sevColor(inc.severity), color: '#FFFFFF', padding: '3px 8px', borderRadius: 8 }}>{inc.severity}</span>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', color: C.textMuted, margin: '3px 0 0' }}>{inc.description || 'No description.'}</p>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: '24px', textAlign: 'center', border: `2px dashed rgba(52,211,153,0.3)`, borderRadius: 16, background: 'rgba(52,211,153,0.04)' }}>
                                <Shield size={20} color={C.safe} style={{ margin: '0 auto 8px' }} />
                                <p style={{ fontSize: '0.82rem', color: C.textMuted, fontWeight: 600 }}>Ward is currently clear.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 style={{ fontWeight: 800, color: C.text, margin: '0 0 12px' }}>{t('communityVitals')}</h3>
                    <div style={{ ...clayCard, padding: 0, overflow: 'hidden' }}>
                        {[
                            { icon: <Activity size={18} color={C.primary} />, label: 'Police Patrol Frequency', sub: 'Community verified', value: 'High', trend: '+12%', tc: C.safe },
                            { icon: <Layers size={18} color={C.moderate} />, label: 'Street Light Coverage', sub: 'Status: Operational', value: '94%', trend: 'Check-in due', tc: C.textMuted },
                        ].map((item, i) => (
                            <div key={i} style={{ padding: '16px 18px', display: 'flex', justifyContent: 'space-between', borderBottom: i === 0 ? `1px solid ${C.border}` : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 38, height: 38, background: C.surfaceAlt, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '2px 2px 4px rgba(27,29,42,0.06), -1px -1px 3px rgba(255,255,255,0.8)' }}>{item.icon}</div>
                                    <div>
                                        <p style={{ fontWeight: 700, color: C.text, margin: 0, fontSize: '0.85rem' }}>{item.label}</p>
                                        <p style={{ fontSize: '0.7rem', color: C.textMuted, margin: 0 }}>{item.sub}</p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontWeight: 800, color: C.text, margin: 0 }}>{item.value}</p>
                                    <p style={{ fontSize: '0.65rem', color: item.tc, fontWeight: 700, margin: 0 }}>{item.trend}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Report FAB */}
            <Link to="/resident/report" style={{ position: 'fixed', bottom: 80, right: 24, background: 'linear-gradient(135deg, #F87171, #EF4444)', borderRadius: '50%', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#FFFFFF', zIndex: 30, boxShadow: '0 8px 24px rgba(248,113,113,0.3)' }}>
                <Plus size={24} />
            </Link>
        </div>
    );
}
