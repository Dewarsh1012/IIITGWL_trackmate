import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../lib/api';
import AlertPanel from '../../components/alerts/AlertPanel';
import TouristMap, { type ZoneData } from '../../components/maps/TouristMap';
import { enqueueOfflineSos, flushOfflineSosQueue, getOfflineSosQueueCount } from '../../lib/offlineSos';
import {
    Activity,
    AlertTriangle,
    Bell,
    Building2,
    Check,
    CheckCircle2,
    Clock3,
    ExternalLink,
    Fingerprint,
    Loader2,
    MapPin,
    Navigation,
    Radio,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    Users,
} from 'lucide-react';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard } from '../../theme/clayTheme';

type BusinessData = Record<string, any> | null;
type AnalyticsData = Record<string, any> | null;
type IncidentData = Record<string, any>;
type AdvisoryData = Record<string, any>;
type GuardianDispatch = Record<string, any>;

function toFinite(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function getWardId(input: unknown): string | null {
    if (!input) return null;
    if (typeof input === 'string') return input;
    if (typeof input === 'object' && (input as Record<string, unknown>)._id) {
        return String((input as Record<string, unknown>)._id);
    }
    return null;
}

function severityStyles(severity: string): { border: string; bg: string; text: string } {
    if (severity === 'critical') {
        return {
            border: '#EF4444',
            bg: 'rgba(239,68,68,0.08)',
            text: '#DC2626',
        };
    }
    if (severity === 'high') {
        return {
            border: '#F87171',
            bg: 'rgba(248,113,113,0.08)',
            text: '#DC2626',
        };
    }
    if (severity === 'medium') {
        return {
            border: '#FBBF24',
            bg: 'rgba(251,191,36,0.09)',
            text: '#B45309',
        };
    }
    return {
        border: C.primary,
        bg: 'rgba(108,99,255,0.08)',
        text: C.primary,
    };
}

async function getFreshBrowserLocation(): Promise<{ latitude: number; longitude: number } | null> {
    if (!('geolocation' in navigator)) return null;

    try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            })
        );

        return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        };
    } catch {
        return null;
    }
}

export default function BusinessDashboard() {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [business, setBusiness] = useState<BusinessData>(null);
    const [analytics, setAnalytics] = useState<AnalyticsData>(null);
    const [incidents, setIncidents] = useState<IncidentData[]>([]);
    const [advisories, setAdvisories] = useState<AdvisoryData[]>([]);
    const [zones, setZones] = useState<ZoneData[]>([]);

    const [liveLatitude, setLiveLatitude] = useState<number | null>(null);
    const [liveLongitude, setLiveLongitude] = useState<number | null>(null);
    const [highlightZoneId, setHighlightZoneId] = useState<string | null>(null);

    const [guardianDispatches, setGuardianDispatches] = useState<GuardianDispatch[]>([]);
    const [notice, setNotice] = useState<string | null>(null);

    const [verificationId, setVerificationId] = useState('');
    const [verificationResult, setVerificationResult] = useState<Record<string, any> | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);

    const [sosLoading, setSosLoading] = useState(false);
    const [sosSuccess, setSosSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const sosIntervalRef = useRef<number | null>(null);

    const businessLatitude = toFinite(business?.latitude);
    const businessLongitude = toFinite(business?.longitude);
    const effectiveLatitude = liveLatitude ?? businessLatitude;
    const effectiveLongitude = liveLongitude ?? businessLongitude;

    const refreshDashboard = useCallback(async (showLoader: boolean) => {
        if (showLoader) setLoading(true);
        else setRefreshing(true);

        try {
            const [businessRes, zonesRes, advisoriesRes] = await Promise.allSettled([
                api.get('/businesses/me'),
                api.get('/zones'),
                api.get('/alerts/my'),
            ]);

            const businessPayload =
                businessRes.status === 'fulfilled' && businessRes.value.data?.success
                    ? businessRes.value.data.data
                    : null;
            const zonesPayload =
                zonesRes.status === 'fulfilled' && zonesRes.value.data?.success
                    ? zonesRes.value.data.data
                    : [];
            const advisoriesPayload =
                advisoriesRes.status === 'fulfilled' && advisoriesRes.value.data?.success
                    ? advisoriesRes.value.data.data
                    : [];

            setBusiness(businessPayload);
            setZones((zonesPayload || []) as ZoneData[]);
            setAdvisories((advisoriesPayload || []).slice(0, 14));

            const wardId =
                getWardId((businessPayload as Record<string, unknown> | null)?.ward) ||
                getWardId(user?.ward);

            const [incidentsRes, analyticsRes] = await Promise.allSettled([
                api.get(wardId ? `/incidents?ward=${encodeURIComponent(wardId)}&limit=14` : '/incidents?limit=14'),
                wardId ? api.get(`/analytics/ward/${encodeURIComponent(wardId)}`) : Promise.resolve({ data: { success: false } }),
            ]);

            if (incidentsRes.status === 'fulfilled' && incidentsRes.value.data?.success) {
                setIncidents(incidentsRes.value.data.data || []);
            }

            if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data?.success) {
                setAnalytics(analyticsRes.value.data.data || null);
            } else {
                setAnalytics(null);
            }

            const latFromBusiness = toFinite((businessPayload as Record<string, unknown> | null)?.latitude);
            const lngFromBusiness = toFinite((businessPayload as Record<string, unknown> | null)?.longitude);
            if (latFromBusiness != null && liveLatitude == null) setLiveLatitude(latFromBusiness);
            if (lngFromBusiness != null && liveLongitude == null) setLiveLongitude(lngFromBusiness);
        } catch {
            setNotice('Unable to refresh business command data right now.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [liveLatitude, liveLongitude, user?.ward]);

    useEffect(() => {
        void refreshDashboard(true);
        const interval = window.setInterval(() => {
            void refreshDashboard(false);
        }, 45000);
        return () => window.clearInterval(interval);
    }, [refreshDashboard]);

    useEffect(() => {
        if (!('geolocation' in navigator)) return;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLiveLatitude(position.coords.latitude);
                setLiveLongitude(position.coords.longitude);
            },
            () => {
                // Ignore geolocation watcher errors and keep last known coordinates.
            },
            { enableHighAccuracy: true, maximumAge: 12000, timeout: 15000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    useEffect(() => {
        if (!socket || !user || effectiveLatitude == null || effectiveLongitude == null) return;

        const interval = window.setInterval(() => {
            socket.emit('location_update', {
                userId: user.id,
                latitude: effectiveLatitude,
                longitude: effectiveLongitude,
                role: 'business',
                name: user.full_name,
            });
        }, 5000);

        return () => window.clearInterval(interval);
    }, [socket, user, effectiveLatitude, effectiveLongitude]);

    useEffect(() => {
        if (!socket) return;

        const onIncidentCreated = (incoming: IncidentData) => {
            const id = String(incoming?._id || '');
            if (!id) return;
            setIncidents((prev) => [incoming, ...prev.filter((item) => String(item?._id || '') !== id)].slice(0, 14));
        };

        const onIncidentUpdated = (incoming: IncidentData) => {
            const id = String(incoming?._id || '');
            if (!id) return;
            setIncidents((prev) => {
                const exists = prev.some((item) => String(item?._id || '') === id);
                if (!exists) return [incoming, ...prev].slice(0, 14);
                return prev.map((item) => (String(item?._id || '') === id ? { ...item, ...incoming } : item));
            });
        };

        const onAlert = (alertPayload: AdvisoryData) => {
            const wrapped = {
                _id: `socket-${String(alertPayload?._id || Date.now())}`,
                delivered_at: new Date().toISOString(),
                alert: alertPayload,
            };
            setAdvisories((prev) => [wrapped, ...prev].slice(0, 14));
        };

        const onGuardianDispatch = (dispatch: GuardianDispatch) => {
            setGuardianDispatches((prev) => [dispatch, ...prev].slice(0, 8));
            setNotice('Guardian assist request assigned near your business.');
        };

        socket.on('new-incident', onIncidentCreated);
        socket.on('incident:new', onIncidentCreated);
        socket.on('incident-updated', onIncidentUpdated);
        socket.on('new_alert', onAlert);
        socket.on('guardian:dispatch', onGuardianDispatch);

        return () => {
            socket.off('new-incident', onIncidentCreated);
            socket.off('incident:new', onIncidentCreated);
            socket.off('incident-updated', onIncidentUpdated);
            socket.off('new_alert', onAlert);
            socket.off('guardian:dispatch', onGuardianDispatch);
        };
    }, [socket]);

    useEffect(() => {
        const flushQueuedSos = async () => {
            if (!navigator.onLine) return;
            const result = await flushOfflineSosQueue();
            if (result.sent > 0) {
                setNotice(`${result.sent} offline SOS alert(s) sent.`);
            }
        };

        void flushQueuedSos();
        const onOnline = () => {
            void flushQueuedSos();
        };

        window.addEventListener('online', onOnline);
        return () => window.removeEventListener('online', onOnline);
    }, []);

    useEffect(() => {
        if (!notice) return;
        const timer = window.setTimeout(() => setNotice(null), 4200);
        return () => window.clearTimeout(timer);
    }, [notice]);

    useEffect(() => {
        if (countdown !== 0 || sosIntervalRef.current == null) return;
        window.clearInterval(sosIntervalRef.current);
        sosIntervalRef.current = null;
        void triggerSOS();
    }, [countdown]);

    useEffect(() => {
        return () => {
            if (sosIntervalRef.current != null) {
                window.clearInterval(sosIntervalRef.current);
                sosIntervalRef.current = null;
            }
        };
    }, []);

    const handleSOSStart = () => {
        if (sosLoading || countdown > 0) return;
        if (sosIntervalRef.current != null) {
            window.clearInterval(sosIntervalRef.current);
        }
        setCountdown(3);
        sosIntervalRef.current = window.setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
    };

    const handleSOSEnd = () => {
        if (sosIntervalRef.current != null) {
            window.clearInterval(sosIntervalRef.current);
            sosIntervalRef.current = null;
        }
        setCountdown(0);
    };

    const triggerSOS = async () => {
        setSosLoading(true);

        try {
            const fresh = await getFreshBrowserLocation();
            const latitude = fresh?.latitude ?? effectiveLatitude ?? 27.5855;
            const longitude = fresh?.longitude ?? effectiveLongitude ?? 91.8594;

            setLiveLatitude(latitude);
            setLiveLongitude(longitude);

            const payload: Record<string, any> = {
                title: 'BUSINESS EMERGENCY SOS TRIGGERED',
                incident_type: 'sos_emergency',
                severity: 'critical',
                source: 'sos_panic',
                latitude,
                longitude,
                is_public: true,
                metadata: {
                    triggered_by_role: 'business',
                    triggered_by_name: user?.full_name || 'Business User',
                    business_name: user?.business_name || business?.business_name || 'Business Unit',
                },
            };

            if (!navigator.onLine) {
                enqueueOfflineSos(payload, 'business');
                setNotice(`No network. SOS saved offline (${getOfflineSosQueueCount()} queued).`);
                return;
            }

            await api.post('/incidents', payload);
            setSosSuccess(true);
            setNotice('SOS dispatched. Authority phones are being notified with your location and directions link.');
            window.setTimeout(() => setSosSuccess(false), 6000);
            void refreshDashboard(false);
        } catch {
            const fallbackPayload: Record<string, any> = {
                title: 'BUSINESS EMERGENCY SOS TRIGGERED',
                incident_type: 'sos_emergency',
                severity: 'critical',
                source: 'sos_panic',
                latitude: effectiveLatitude ?? 27.5855,
                longitude: effectiveLongitude ?? 91.8594,
                is_public: true,
                metadata: {
                    triggered_by_role: 'business',
                    triggered_by_name: user?.full_name || 'Business User',
                    business_name: user?.business_name || business?.business_name || 'Business Unit',
                },
            };
            enqueueOfflineSos(fallbackPayload, 'business');
            setNotice(`Network unstable. SOS cached safely (${getOfflineSosQueueCount()} queued).`);
        } finally {
            setSosLoading(false);
        }
    };

    const handleVerify = async () => {
        if (!verificationId.trim()) return;

        setIsVerifying(true);
        setVerificationResult(null);

        try {
            const response = await api.get(`/businesses/verify-tourist/${encodeURIComponent(verificationId.trim())}`);
            if (response.data?.success) {
                setVerificationResult(response.data.data || null);
            } else {
                setVerificationResult({ valid: false, message: 'Identity proof not found.' });
            }
        } catch {
            setVerificationResult({ valid: false, message: 'Verification service temporarily unavailable.' });
        } finally {
            setIsVerifying(false);
        }
    };

    const activeIncidentCount = analytics?.open_incidents ?? incidents.filter((entry) => {
        const status = String(entry?.status || '');
        return status === 'active' || status === 'acknowledged' || status === 'assigned' || status === 'escalated';
    }).length;
    const safetyScore = analytics?.safety_score ?? Math.max(32, 100 - activeIncidentCount * 7);
    const liveVisitors = analytics?.tourist_count ?? 0;
    const liveResidents = analytics?.resident_count ?? 0;
    const unreadAdvisories = advisories.filter((entry) => !entry?.is_read).length;

    const zoneIntel = useMemo(() => {
        if (effectiveLatitude == null || effectiveLongitude == null) return [];

        return zones
            .map((zone) => {
                const centerDistance = haversineMeters(effectiveLatitude, effectiveLongitude, zone.center_lat, zone.center_lng);
                const edgeDistance = Math.max(0, centerDistance - (zone.radius_meters || 0));
                return {
                    ...zone,
                    centerDistance,
                    edgeDistance,
                    inside: edgeDistance === 0,
                };
            })
            .sort((a, b) => a.edgeDistance - b.edgeDistance)
            .slice(0, 6);
    }, [zones, effectiveLatitude, effectiveLongitude]);

    const directionsUrl =
        effectiveLatitude != null && effectiveLongitude != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${effectiveLatitude},${effectiveLongitude}`)}&travelmode=driving`
            : null;

    if (loading && !business && incidents.length === 0) {
        return (
            <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <Loader2 size={34} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.textMuted }}>
                    Loading business command center...
                </p>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div style={{ maxWidth: 1380, margin: '0 auto', padding: '26px 20px 110px' }}>
                <div className="top-header" style={{ ...clayCard, padding: '18px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 14, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 14px rgba(108,99,255,0.28)' }}>
                            <Building2 size={20} color="#FFFFFF" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <h1 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {business?.business_name || user?.business_name || 'Business Command Center'}
                            </h1>
                            <p style={{ margin: '3px 0 0', color: C.textMuted, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                {(business?.category || 'general').toString().replaceAll('_', ' ')} · realtime safety operations
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '6px 12px', background: isConnected ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.12)', color: isConnected ? '#059669' : '#DC2626', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            <Radio size={12} />
                            {isConnected ? 'Live Connected' : 'Realtime Offline'}
                        </span>
                        <button
                            onClick={() => void refreshDashboard(false)}
                            style={{ border: `1px solid ${C.border}`, borderRadius: 12, background: C.surface, cursor: 'pointer', padding: '8px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.74rem', color: C.text }}
                        >
                            <RefreshCw size={14} style={refreshing ? { animation: 'spin-slow 1s linear infinite' } : undefined} />
                            Refresh
                        </button>
                        <AlertPanel />
                        <Link to="/business/profile" style={{ textDecoration: 'none', borderRadius: 12, padding: '8px 12px', background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', color: '#FFFFFF', fontSize: '0.73rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 5px 14px rgba(108,99,255,0.27)' }}>
                            Profile
                            <ExternalLink size={13} />
                        </Link>
                    </div>
                </div>

                {notice && (
                    <div style={{ marginBottom: 14, border: `1px solid rgba(108,99,255,0.25)`, borderRadius: 14, background: 'rgba(108,99,255,0.09)', padding: '10px 14px', fontWeight: 700, color: C.primary, fontSize: '0.78rem' }}>
                        {notice}
                    </div>
                )}

                <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14, marginBottom: 16 }}>
                    {[
                        {
                            title: 'Safety Score',
                            value: `${safetyScore}`,
                            icon: <Shield size={16} color={C.safe} />,
                            detail: 'Ward-adjusted stability index',
                            accent: 'rgba(52,211,153,0.12)',
                        },
                        {
                            title: 'Open Incidents',
                            value: `${activeIncidentCount}`,
                            icon: <Activity size={16} color={C.critical} />,
                            detail: 'Needs active response',
                            accent: 'rgba(239,68,68,0.1)',
                        },
                        {
                            title: 'Live Footfall',
                            value: `${liveVisitors + liveResidents}`,
                            icon: <Users size={16} color={C.primary} />,
                            detail: `${liveVisitors} tourists, ${liveResidents} residents`,
                            accent: 'rgba(108,99,255,0.1)',
                        },
                        {
                            title: 'Unread Advisories',
                            value: `${unreadAdvisories}`,
                            icon: <Bell size={16} color={C.moderate} />,
                            detail: 'Targeted authority updates',
                            accent: 'rgba(251,191,36,0.12)',
                        },
                    ].map((card) => (
                        <div key={card.title} style={{ ...clayCard, padding: '16px 16px 14px', borderTop: `3px solid ${C.border}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <p style={{ margin: 0, fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, fontWeight: 700 }}>
                                    {card.title}
                                </p>
                                <div style={{ width: 30, height: 30, borderRadius: 10, background: card.accent, display: 'grid', placeItems: 'center' }}>
                                    {card.icon}
                                </div>
                            </div>
                            <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '1.65rem', color: C.text }}>
                                {card.value}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: C.textMuted, fontWeight: 600 }}>
                                {card.detail}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)', gap: 16, marginBottom: 16 }}>
                    <div style={{ ...clayCard, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: C.text }}>Business Geo Safety View</h3>
                                <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: C.textMuted, fontWeight: 600 }}>
                                    Live location, nearby zone risk, and route intelligence
                                </p>
                            </div>
                            {effectiveLatitude != null && effectiveLongitude != null ? (
                                <button
                                    onClick={() => {
                                        const nearest = zoneIntel[0];
                                        if (!nearest) return;
                                        setHighlightZoneId(nearest._id);
                                        window.setTimeout(() => setHighlightZoneId(null), 7000);
                                    }}
                                    style={{ border: `1px solid ${C.border}`, borderRadius: 10, background: C.surface, cursor: 'pointer', padding: '7px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.72rem', color: C.text }}
                                >
                                    <Navigation size={13} />
                                    Focus Nearest Zone
                                </button>
                            ) : null}
                        </div>

                        <div style={{ minHeight: 420, height: 420 }}>
                            <TouristMap lat={effectiveLatitude} lng={effectiveLongitude} zones={zones} highlightZoneId={highlightZoneId} />
                        </div>

                        <div style={{ borderTop: `1px solid ${C.border}`, padding: 12, background: C.surfaceAlt, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {zoneIntel.length > 0 ? (
                                zoneIntel.slice(0, 5).map((zone) => {
                                    const riskColor =
                                        zone.risk_level === 'safe'
                                            ? C.safe
                                            : zone.risk_level === 'moderate'
                                                ? C.moderate
                                                : zone.risk_level === 'high'
                                                    ? C.high
                                                    : C.restricted;
                                    return (
                                        <button
                                            key={zone._id}
                                            onClick={() => {
                                                setHighlightZoneId(zone._id);
                                                window.setTimeout(() => setHighlightZoneId(null), 7000);
                                            }}
                                            style={{ border: `1px solid ${C.border}`, borderRadius: 11, background: C.surface, padding: '6px 9px', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                                        >
                                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor }} />
                                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: C.text }}>
                                                {zone.name}
                                            </span>
                                            <span style={{ fontSize: '0.64rem', color: C.textMuted, fontWeight: 700 }}>
                                                {zone.inside ? 'inside zone' : `${Math.round(zone.edgeDistance)}m`}
                                            </span>
                                        </button>
                                    );
                                })
                            ) : (
                                <p style={{ margin: 0, fontSize: '0.72rem', color: C.textMuted, fontWeight: 600 }}>
                                    Allow location access to render nearby zone intelligence.
                                </p>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ ...clayCard, padding: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.87rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text }}>
                                    SOS Command Trigger
                                </h3>
                                <span style={{ fontSize: '0.64rem', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase' }}>
                                    Hold for 3 seconds
                                </span>
                            </div>

                            {countdown > 0 ? (
                                <div style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)', borderRadius: 16, padding: '16px 12px', textAlign: 'center', color: '#FFFFFF', boxShadow: '0 8px 22px rgba(239,68,68,0.3)', animation: 'nb-pulse 1s infinite' }}>
                                    <p style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, lineHeight: 1 }}>{countdown}</p>
                                    <p style={{ margin: '6px 0 0', fontWeight: 800, fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Release to cancel emergency
                                    </p>
                                </div>
                            ) : sosSuccess ? (
                                <div style={{ background: 'linear-gradient(135deg, #1B1D2A, #252840)', borderRadius: 16, padding: '14px 12px', textAlign: 'center', color: C.safe }}>
                                    <Check size={24} style={{ margin: '0 auto 6px' }} />
                                    <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800 }}>SOS dispatched successfully</p>
                                    <p style={{ margin: '5px 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
                                        Authority dashboard and phone SMS alert were triggered.
                                    </p>
                                </div>
                            ) : (
                                <button
                                    onMouseDown={handleSOSStart}
                                    onMouseUp={handleSOSEnd}
                                    onMouseLeave={handleSOSEnd}
                                    onTouchStart={handleSOSStart}
                                    onTouchEnd={handleSOSEnd}
                                    disabled={sosLoading}
                                    style={{ width: '100%', border: 'none', borderRadius: 16, background: 'linear-gradient(135deg, #F87171, #EF4444)', color: '#FFFFFF', padding: '15px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, boxShadow: '0 8px 20px rgba(239,68,68,0.32)', opacity: sosLoading ? 0.7 : 1 }}
                                >
                                    {sosLoading ? <Loader2 size={24} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <ShieldAlert size={24} />}
                                    <span style={{ fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Trigger Emergency SOS
                                    </span>
                                    <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(255,255,255,0.74)' }}>
                                        Includes name, coordinates, and Google Maps directions in authority SMS
                                    </span>
                                </button>
                            )}

                            <div style={{ marginTop: 10, border: `1px solid ${C.border}`, borderRadius: 12, padding: '9px 10px', background: C.surfaceAlt }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <MapPin size={13} color={C.primary} />
                                    <span style={{ fontSize: '0.69rem', fontWeight: 700, color: C.text }}>
                                        {effectiveLatitude != null && effectiveLongitude != null
                                            ? `${effectiveLatitude.toFixed(6)}, ${effectiveLongitude.toFixed(6)}`
                                            : 'Location not available yet'}
                                    </span>
                                </div>
                                {directionsUrl ? (
                                    <a href={directionsUrl} target="_blank" rel="noreferrer" style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
                                        <Navigation size={12} /> Open directions link
                                    </a>
                                ) : null}
                            </div>
                        </div>

                        <div style={{ ...clayCard, padding: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.86rem', color: C.text }}>Guardian Dispatch Queue</h3>
                                <span style={{ fontSize: '0.64rem', color: C.textMuted, fontWeight: 700 }}>
                                    {guardianDispatches.length} live
                                </span>
                            </div>

                            {guardianDispatches.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                                    {guardianDispatches.map((dispatch, index) => (
                                        <div key={`${dispatch?.incident_id || 'guardian'}-${index}`} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 11, padding: '10px 10px 9px' }}>
                                            <p style={{ margin: 0, fontSize: '0.76rem', fontWeight: 700, color: C.text }}>
                                                {dispatch?.incident_title || 'Emergency assistance request'}
                                            </p>
                                            <p style={{ margin: '3px 0 0', fontSize: '0.68rem', color: C.textMuted, fontWeight: 600 }}>
                                                {dispatch?.message || 'Nearby support required by command center'}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ margin: 0, fontSize: '0.74rem', color: C.textMuted, fontWeight: 600 }}>
                                    No pending guardian dispatch tasks.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)', gap: 16 }}>
                    <div style={{ ...clayCard, overflow: 'hidden', padding: 0 }}>
                        <div style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: C.text }}>
                                Live Incident Feed
                            </h3>
                            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.textMuted }}>
                                {incidents.length} tracked
                            </span>
                        </div>
                        <div style={{ maxHeight: 390, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {incidents.length > 0 ? (
                                incidents.slice(0, 12).map((incident) => {
                                    const style = severityStyles(String(incident?.severity || 'low'));
                                    return (
                                        <div key={String(incident?._id || Math.random())} style={{ borderRadius: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${style.border}`, background: style.bg, padding: '10px 11px' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                                <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: '0.79rem' }}>
                                                    {incident?.title || 'Incident'}
                                                </p>
                                                <span style={{ fontSize: '0.58rem', fontWeight: 800, padding: '3px 8px', borderRadius: 99, textTransform: 'uppercase', background: style.border, color: '#FFFFFF' }}>
                                                    {String(incident?.severity || 'low')}
                                                </span>
                                            </div>
                                            <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: C.textMuted, fontWeight: 600 }}>
                                                {incident?.description || 'No additional description available.'}
                                            </p>
                                            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: '0.64rem', color: style.text, fontWeight: 700, textTransform: 'uppercase' }}>
                                                    {String(incident?.status || 'active')}
                                                </span>
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.63rem', color: C.textMuted, fontWeight: 700 }}>
                                                    <Clock3 size={10} />
                                                    {new Date(incident?.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {incident?.latitude && incident?.longitude ? (
                                                    <a
                                                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${incident.latitude},${incident.longitude}`)}&travelmode=driving`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        style={{ fontSize: '0.63rem', color: C.primary, fontWeight: 700, textDecoration: 'none' }}
                                                    >
                                                        Open route
                                                    </a>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div style={{ borderRadius: 13, border: `2px dashed ${C.border}`, padding: '18px 14px', textAlign: 'center' }}>
                                    <AlertTriangle size={18} style={{ margin: '0 auto 7px', color: C.textMuted }} />
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: C.textMuted, fontWeight: 600 }}>
                                        No active incidents in your monitored area.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ ...clayCard, overflow: 'hidden', padding: 0 }}>
                            <div style={{ padding: '13px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '0.88rem', color: C.text }}>
                                    Safety Advisories
                                </h3>
                                <span style={{ fontSize: '0.64rem', color: C.textMuted, fontWeight: 700 }}>
                                    {advisories.length} entries
                                </span>
                            </div>
                            <div style={{ maxHeight: 220, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                                {advisories.length > 0 ? (
                                    advisories.slice(0, 8).map((entry, index) => {
                                        const payload = entry?.alert || entry;
                                        return (
                                            <div key={String(entry?._id || payload?._id || index)} style={{ borderRadius: 11, border: `1px solid ${C.border}`, background: C.surfaceAlt, padding: '9px 10px' }}>
                                                <p style={{ margin: 0, fontSize: '0.76rem', fontWeight: 700, color: C.text }}>
                                                    {payload?.title || 'Safety Advisory'}
                                                </p>
                                                <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: C.textMuted, fontWeight: 600 }}>
                                                    {payload?.message || 'No advisory details provided.'}
                                                </p>
                                                <span style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.62rem', color: C.textMuted, fontWeight: 700 }}>
                                                    <Bell size={10} />
                                                    {new Date(entry?.delivered_at || payload?.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p style={{ margin: 0, fontSize: '0.73rem', color: C.textMuted, fontWeight: 600 }}>
                                        No advisories received yet.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div style={{ ...clayCard, padding: 14, background: 'linear-gradient(135deg, #1B1D2A, #252840)', border: 'none' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', display: 'grid', placeItems: 'center' }}>
                                    <Fingerprint size={18} color="#FFFFFF" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 800 }}>Blockchain Identity Check</h3>
                                    <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.56)', fontSize: '0.69rem', fontWeight: 600 }}>
                                        Verify tourist identity against TrackMate registry
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                                <div style={{ flex: 1, position: 'relative' }}>
                                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.38)' }} />
                                    <input
                                        value={verificationId}
                                        onChange={(event) => setVerificationId(event.target.value)}
                                        placeholder="Enter blockchain ID"
                                        style={{ width: '100%', border: '1px solid rgba(108,99,255,0.35)', background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', borderRadius: 12, padding: '10px 11px 10px 30px', fontSize: '0.78rem', fontWeight: 600, outline: 'none' }}
                                    />
                                </div>
                                <button
                                    onClick={() => void handleVerify()}
                                    disabled={isVerifying || !verificationId.trim()}
                                    style={{ border: 'none', borderRadius: 12, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', color: '#FFFFFF', fontWeight: 800, fontSize: '0.71rem', textTransform: 'uppercase', padding: '0 14px', cursor: isVerifying || !verificationId.trim() ? 'default' : 'pointer', opacity: isVerifying || !verificationId.trim() ? 0.6 : 1, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                >
                                    {isVerifying ? <Loader2 size={14} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Check size={14} />}
                                    Verify
                                </button>
                            </div>

                            {verificationResult ? (
                                <div style={{ marginTop: 9, borderRadius: 11, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.07)', padding: '9px 10px' }}>
                                    {verificationResult.valid === false ? (
                                        <p style={{ margin: 0, color: '#FCA5A5', fontSize: '0.72rem', fontWeight: 700 }}>
                                            {verificationResult.message || 'Identity proof not found.'}
                                        </p>
                                    ) : (
                                        <>
                                            <p style={{ margin: 0, color: '#FFFFFF', fontSize: '0.78rem', fontWeight: 800 }}>
                                                {verificationResult.name || 'Verified tourist'}
                                            </p>
                                            <p style={{ margin: '2px 0 0', color: 'rgba(255,255,255,0.62)', fontSize: '0.69rem', fontWeight: 600 }}>
                                                {verificationResult.blockchain_id || verificationResult.id || 'Blockchain entry found'}
                                            </p>
                                            <span style={{ marginTop: 5, display: 'inline-flex', alignItems: 'center', gap: 4, color: '#34D399', fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase' }}>
                                                <CheckCircle2 size={11} /> Valid identity proof
                                            </span>
                                        </>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
