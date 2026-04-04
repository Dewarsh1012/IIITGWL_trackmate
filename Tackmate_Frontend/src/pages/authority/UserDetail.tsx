import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Shield, MapPin, AlertTriangle, User, Phone, Mail, CheckCircle, Clock, Navigation, Activity } from 'lucide-react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';
import TouristMap from '../../components/maps/TouristMap';
import type { ZoneData } from '../../components/maps/TouristMap';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard, CLAY_CARD_INNER_STYLE as clayCardInner } from '../../theme/clayTheme';

const roleColors: Record<string, string> = {
    tourist: C.primary,
    resident: C.safe,
    business: C.moderate,
    authority: C.restricted,
};

export default function UserDetail() {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { socket } = useSocket();

    const [profile, setProfile] = useState<any>(null);
    const [locations, setLocations] = useState<any[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [zones, setZones] = useState<ZoneData[]>([]);
    const [loading, setLoading] = useState(true);
    const [liveLat, setLiveLat] = useState<number | null>(null);
    const [liveLng, setLiveLng] = useState<number | null>(null);

    useEffect(() => {
        if (!userId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [profileRes, locRes, incRes, zoneRes] = await Promise.all([
                    api.get(`/profiles/${userId}`),
                    api.get(`/locations/user/${userId}?hours=48`),
                    api.get(`/incidents?reporter=${userId}&limit=10`),
                    api.get('/zones'),
                ]);
                if (profileRes.data.success) setProfile(profileRes.data.data);
                if (locRes.data.success) {
                    const locs = locRes.data.data || [];
                    setLocations(locs);
                    if (locs.length > 0) {
                        setLiveLat(locs[0].latitude);
                        setLiveLng(locs[0].longitude);
                    }
                }
                if (incRes.data.success) setIncidents(incRes.data.data || []);
                if (zoneRes.data.success) setZones(zoneRes.data.data || []);
            } catch (err) {
                console.error('Failed to load user data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    useEffect(() => {
        if (!socket || !userId) return;
        const handleLocationUpdate = (data: any) => {
            if (data.userId === userId) {
                const lat = data.latitude || (data.location?.coordinates && data.location.coordinates[1]);
                const lng = data.longitude || (data.location?.coordinates && data.location.coordinates[0]);
                if (lat && lng) {
                    setLiveLat(lat);
                    setLiveLng(lng);
                }
            }
        };
        socket.on('location:update', handleLocationUpdate);
        return () => {
            socket.off('location:update', handleLocationUpdate);
        };
    }, [socket, userId]);

    const sevColor = (s: string) => {
        switch (s) {
            case 'critical': return C.critical;
            case 'high': return C.high;
            case 'medium': return C.moderate;
            default: return C.primary;
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
                <AuthoritySidebar />
                <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
                </main>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <AuthoritySidebar />
                <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ ...clayCard, padding: 26, textAlign: 'center', minWidth: 320 }}>
                        <AlertTriangle size={36} color={C.high} style={{ marginBottom: 8 }} />
                        <p style={{ margin: '0 0 12px', fontWeight: 700, color: C.text }}>User not found.</p>
                        <button onClick={() => navigate(-1)} style={{ background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '10px 16px', fontWeight: 700, cursor: 'pointer' }}>Go Back</button>
                    </div>
                </main>
            </div>
        );
    }

    const accent = roleColors[profile.role] || C.primary;
    const lastSeen = locations.length > 0 ? new Date(locations[0].recorded_at).toLocaleString() : 'No data';
    const checkins = incidents.filter((i) => i.incident_type === 'checkin');
    const anomalyReports = incidents.filter((i) => i.incident_type !== 'checkin' && i.incident_type !== 'safe_house_request');
    const safeHouseRequests = incidents.filter((i) => i.incident_type === 'safe_house_request');

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="top-header responsive-container" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', boxShadow: '0 2px 12px rgba(27,29,42,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={() => navigate(-1)} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: C.text, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontFamily: 'inherit', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                            <ArrowLeft size={14} /> Back
                        </button>
                        <div>
                            <h1 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: C.text }}>User Profile · {profile.full_name}</h1>
                            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{profile.role} · {profile.blockchain_id || 'NO CHAIN ID'}</p>
                        </div>
                    </div>
                    <span style={{ background: `${accent}20`, border: `1px solid ${accent}55`, color: accent, borderRadius: 999, padding: '5px 12px', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>{profile.role}</span>
                </div>

                <div style={{ padding: '22px 28px', overflowY: 'auto', flex: 1 }}>
                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 18 }}>
                        <div style={{ ...clayCard, padding: 16, borderTop: `4px solid ${accent}` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}20`, color: accent, fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{profile.full_name?.charAt(0) || '?'}</div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.full_name}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: C.textMuted, fontWeight: 700 }}>{profile.designation || profile.role}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 700, color: profile.is_verified ? C.safeDark : C.high }}>
                                {profile.is_verified ? <CheckCircle size={13} /> : <AlertTriangle size={13} />}
                                {profile.is_verified ? 'Verified' : 'Pending Verification'}
                            </div>
                        </div>

                        <div style={{ ...clayCard, padding: 16 }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: C.textMuted }}>Contact</p>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: C.text }}><Mail size={13} color={C.primary} /> {profile.email}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: C.text }}><Phone size={13} color={C.safe} /> {profile.phone || 'Not provided'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: C.text }}><User size={13} color={C.moderate} /> {profile.id_type ? `${profile.id_type} ···${profile.id_last_four || ''}` : 'No ID'}</div>
                            </div>
                        </div>

                        <div style={{ ...clayCard, padding: 16 }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: C.textMuted }}>Safety Score</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ position: 'relative', width: 72, height: 72 }}>
                                    <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                                        <circle cx="36" cy="36" r="28" fill="none" stroke={C.surfaceAlt} strokeWidth="8" />
                                        <circle cx="36" cy="36" r="28" fill="none" stroke={(profile.safety_score || 0) > 70 ? C.safe : C.moderate} strokeWidth="8" strokeDasharray="175.9" strokeDashoffset={175.9 - (175.9 * (profile.safety_score || 0) / 100)} strokeLinecap="round" />
                                    </svg>
                                    <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.88rem', fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{profile.safety_score || 0}</span>
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: (profile.safety_score || 0) > 70 ? C.safeDark : C.moderate }}>{(profile.safety_score || 0) > 70 ? 'Healthy' : 'Watchlist'}</p>
                                    <p style={{ margin: '2px 0 0', fontSize: '0.68rem', color: C.textMuted, fontWeight: 600 }}>Dynamic trust index</p>
                                </div>
                            </div>
                        </div>

                        <div style={{ ...clayCard, padding: 16 }}>
                            <p style={{ margin: '0 0 8px', fontSize: '0.66rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: C.textMuted }}>Live Status</p>
                            <div style={{ display: 'grid', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: C.textSecondary }}><Clock size={12} color={C.primary} /> Last: {lastSeen}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: C.textSecondary }}><Navigation size={12} color={C.safe} /> {liveLat && liveLng ? `${liveLat.toFixed(4)}, ${liveLng.toFixed(4)}` : 'Unavailable'}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: liveLat ? C.safeDark : C.high, fontWeight: 700 }}><Activity size={12} /> {liveLat ? 'ONLINE' : 'OFFLINE'}</div>
                            </div>
                        </div>
                    </div>

                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18 }}>
                        <div style={{ ...clayCard, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} color={C.primary} /> Live Location · {profile.full_name}</h3>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 8px', borderRadius: 999, background: liveLat ? `${C.safe}1f` : `${C.high}1f`, border: `1px solid ${liveLat ? C.safe : C.high}55`, color: liveLat ? C.safeDark : C.high, fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: liveLat ? C.safe : C.high }} />
                                    {liveLat ? 'Tracking' : 'No Signal'}
                                </span>
                            </div>
                            <div style={{ minHeight: 420 }}>
                                <TouristMap lat={liveLat} lng={liveLng} zones={zones} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ ...clayCard, padding: 14, background: 'linear-gradient(135deg, #1B1D2A, #252840)', color: '#FFFFFF' }}>
                                <p style={{ margin: '0 0 6px', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Blockchain Identity</p>
                                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', wordBreak: 'break-all', fontWeight: 700, color: '#FFFFFF' }}>{profile.blockchain_id || 'NOT_MINTED'}</code>
                                {profile.ward && (
                                    <div style={{ marginTop: 8, ...clayCardInner, padding: '8px 10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'none' }}>
                                        <p style={{ margin: 0, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>Assigned Ward</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', fontWeight: 700, color: '#FFFFFF' }}>{profile.ward?.name || profile.ward}</p>
                                    </div>
                                )}
                            </div>

                            <div style={{ ...clayCard, overflow: 'hidden' }}>
                                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={13} color={C.safe} /> Daily Check-Ins</h3>
                                    {checkins.length > 0 && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.safeDark }}>{checkins.length}</span>}
                                </div>
                                <div style={{ padding: 10, maxHeight: 172, overflowY: 'auto', display: 'grid', gap: 6 }}>
                                    {checkins.length > 0 ? checkins.map((ci) => (
                                        <div key={ci._id} style={{ ...clayCardInner, padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <CheckCircle size={13} color={C.safe} />
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ci.title}</p>
                                                <p style={{ margin: '1px 0 0', fontSize: '0.65rem', color: C.textMuted, fontWeight: 600 }}>{new Date(ci.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )) : <p style={{ margin: 0, fontSize: '0.72rem', color: C.textMuted, fontWeight: 600, textAlign: 'center', padding: 12 }}>No check-ins recorded.</p>}
                                </div>
                            </div>

                            <div style={{ ...clayCard, overflow: 'hidden' }}>
                                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
                                    <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: C.text }}>Location Trail (48h)</h3>
                                </div>
                                <div style={{ padding: 10, maxHeight: 152, overflowY: 'auto', display: 'grid', gap: 6 }}>
                                    {locations.length > 0 ? locations.slice(0, 10).map((loc, i) => (
                                        <div key={loc._id || i} style={{ ...clayCardInner, padding: '7px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.68rem', fontFamily: "'JetBrains Mono', monospace", color: C.text, fontWeight: 700 }}>{loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}</span>
                                            <span style={{ fontSize: '0.65rem', color: C.textMuted, fontWeight: 600 }}>{new Date(loc.recorded_at).toLocaleTimeString()}</span>
                                        </div>
                                    )) : <p style={{ margin: 0, fontSize: '0.72rem', color: C.textMuted, fontWeight: 600, textAlign: 'center', padding: 10 }}>No location history available.</p>}
                                </div>
                            </div>

                            <div style={{ ...clayCard, overflow: 'hidden' }}>
                                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={13} color={C.high} /> Incident Reports</h3>
                                    {anomalyReports.length > 0 && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.high }}>{anomalyReports.length}</span>}
                                </div>
                                <div style={{ padding: 10, maxHeight: 190, overflowY: 'auto', display: 'grid', gap: 6 }}>
                                    {anomalyReports.length > 0 ? anomalyReports.map((inc) => (
                                        <div key={inc._id} style={{ ...clayCardInner, padding: '8px 10px', border: `1px solid ${sevColor(inc.severity)}55` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                                                <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: C.text }}>{inc.title}</p>
                                                <span style={{ fontSize: '0.58rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, color: '#FFFFFF', background: sevColor(inc.severity), borderRadius: 8, padding: '2px 6px' }}>{inc.severity}</span>
                                            </div>
                                            <p style={{ margin: '2px 0 0', fontSize: '0.66rem', color: C.textMuted, fontWeight: 600 }}>{inc.incident_type} · {inc.status} · {new Date(inc.created_at).toLocaleDateString()}</p>
                                        </div>
                                    )) : <p style={{ margin: 0, fontSize: '0.72rem', color: C.textMuted, fontWeight: 600, textAlign: 'center', padding: 10 }}>No anomaly reports from this user.</p>}
                                </div>
                            </div>

                            <div style={{ ...clayCard, overflow: 'hidden' }}>
                                <div style={{ padding: '10px 12px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={13} color={C.primary} /> Safe House Requests</h3>
                                    {safeHouseRequests.length > 0 && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: C.primary }}>{safeHouseRequests.length}</span>}
                                </div>
                                <div style={{ padding: 10, maxHeight: 170, overflowY: 'auto', display: 'grid', gap: 6 }}>
                                    {safeHouseRequests.length > 0 ? safeHouseRequests.map((sh) => (
                                        <div key={sh._id} style={{ ...clayCardInner, padding: '8px 10px', border: `1px solid ${C.primary}55`, display: 'flex', gap: 8 }}>
                                            <MapPin size={13} color={C.primary} style={{ flexShrink: 0, marginTop: 2 }} />
                                            <div>
                                                <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: C.text }}>{sh.description || sh.title}</p>
                                                <p style={{ margin: '2px 0 0', fontSize: '0.65rem', color: C.textMuted, fontWeight: 600 }}>{new Date(sh.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    )) : <p style={{ margin: 0, fontSize: '0.72rem', color: C.textMuted, fontWeight: 600, textAlign: 'center', padding: 10 }}>No safe house requests.</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
