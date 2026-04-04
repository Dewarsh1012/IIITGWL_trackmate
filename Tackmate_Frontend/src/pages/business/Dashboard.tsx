import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Loader2, Shield, TrendingUp, MapPin, Users, Bell, AlertTriangle, Search, Check, Fingerprint, PlusCircle, Info, Globe, ShieldAlert } from 'lucide-react';
import AlertPanel from '../../components/alerts/AlertPanel';

const C = {
    bg: '#F0EDFA', surface: '#FFFFFF', surfaceAlt: '#F7F5FF', dark: '#1B1D2A', text: '#1B1D2A',
    textSecondary: '#4A4D68', textMuted: '#8B8FA8', primary: '#6C63FF', primaryLight: '#8B85FF',
    safe: '#34D399', moderate: '#FBBF24', high: '#F87171', critical: '#EF4444', orange: '#FF7A00',
    border: 'rgba(27,29,42,0.08)',
};

const clayCard: React.CSSProperties = { background: C.surface, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: '6px 6px 14px rgba(27,29,42,0.10), -3px -3px 10px rgba(255,255,255,0.9)' };
const clayInput: React.CSSProperties = { width: '100%', padding: '12px 14px 12px 38px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: C.text, outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)' };

export default function BusinessDashboard() {
    const { user } = useAuth();
    const [verificationId, setVerificationId] = useState('');
    const [verificationResult, setVerificationResult] = useState<any>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [advisories, setAdvisories] = useState<any[]>([]);
    const [sosLoading, setSosLoading] = useState(false);
    const [sosSuccess, setSosSuccess] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const sosIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        fetchBusinessData();
        const interval = setInterval(fetchBusinessData, 60000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (countdown === 0 && sosIntervalRef.current) {
            clearInterval(sosIntervalRef.current);
            sosIntervalRef.current = null;
            triggerSOS();
        }
    }, [countdown]);

    useEffect(() => {
        return () => {
            if (sosIntervalRef.current) {
                clearInterval(sosIntervalRef.current);
                sosIntervalRef.current = null;
            }
        };
    }, []);

    const fetchBusinessData = async () => {
        try {
            const ward = user?.ward;
            const zoneId = ward ? (typeof ward === 'object' ? (ward as any)._id : ward) : 'general';
            const [analyticsRes, advisoriesRes] = await Promise.all([
                api.get(`/analytics/ward/${zoneId}`),
                api.get('/alerts/my'),
            ]);
            if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
            if (advisoriesRes.data.success) setAdvisories((advisoriesRes.data.data || []).slice(0, 3));
        } catch { } finally { setLoading(false); }
    };

    const handleVerify = async () => {
        if (!verificationId) return;
        setIsVerifying(true); setVerificationResult(null);
        try {
            const res = await api.get(`/businesses/verify-tourist/${encodeURIComponent(verificationId)}`);
            if (res.data.success) {
                setVerificationResult(res.data.data);
            } else {
                setVerificationResult({ error: 'Identity proof not found in blockchain ledger.' });
            }
        } catch {
            setVerificationResult({ error: 'Verification service temporarily unavailable.' });
        } finally { setIsVerifying(false); }
    };

    const handleSOSStart = () => {
        if (sosIntervalRef.current) clearInterval(sosIntervalRef.current);
        setCountdown(3);
        sosIntervalRef.current = window.setInterval(() => {
            setCountdown((prev) => prev - 1);
        }, 1000);
    };

    const handleSOSEnd = () => {
        if (sosIntervalRef.current) {
            clearInterval(sosIntervalRef.current);
            sosIntervalRef.current = null;
        }
        setCountdown(0);
    };

    const triggerSOS = async () => {
        setSosLoading(true);
        try {
            const pos = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject)).catch(() => null);
            await api.post('/incidents', {
                title: 'BUSINESS EMERGENCY SOS TRIGGERED',
                incident_type: 'sos_emergency',
                severity: 'critical',
                source: 'sos_panic',
                latitude: pos?.coords.latitude,
                longitude: pos?.coords.longitude,
                is_public: true,
                metadata: {
                    triggered_by_role: 'business',
                    triggered_by_name: user?.full_name || 'Business User',
                    business_name: (user as any)?.business_name || null,
                },
            });
            setSosSuccess(true);
            setTimeout(() => setSosSuccess(false), 5000);
        } catch {
            alert('SOS transmission failed!');
        } finally {
            setSosLoading(false);
        }
    };

    if (loading && !analytics) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: C.bg, flexDirection: 'column', gap: 12 }}>
            <Loader2 size={32} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
            <p style={{ fontSize: '0.78rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Loading business data...</p>
        </div>
    );

    return (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 24px', fontFamily: "'Plus Jakarta Sans', sans-serif", background: C.bg, minHeight: '100vh', color: C.text }}>
            {/* Alert Panel */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <AlertPanel />
            </div>

            {/* SOS Trigger */}
            <section style={{ marginBottom: 24 }}>
                {countdown > 0 ? (
                    <div style={{ background: 'linear-gradient(135deg, #EF4444, #B91C1C)', padding: '22px', borderRadius: 20, color: '#FFFFFF', textAlign: 'center', boxShadow: '0 10px 30px rgba(185,28,28,0.35)', animation: 'nb-pulse 1s infinite' }}>
                        <h2 style={{ fontSize: '3rem', margin: 0, fontWeight: 900 }}>{countdown}</h2>
                        <p style={{ margin: '6px 0 0', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Release to cancel SOS</p>
                    </div>
                ) : sosSuccess ? (
                    <div style={{ background: 'linear-gradient(135deg, #1B1D2A, #252840)', padding: '20px', borderRadius: 20, color: C.safe, textAlign: 'center', boxShadow: '6px 6px 14px rgba(27,29,42,0.10), -3px -3px 10px rgba(255,255,255,0.9)' }}>
                        <Check size={30} style={{ margin: '0 auto 10px' }} />
                        <h3 style={{ fontSize: '1.15rem', margin: '0 0 4px', fontWeight: 800 }}>SOS DISPATCHED TO AUTHORITIES</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Authority panel received this emergency trigger in real time.</p>
                    </div>
                ) : (
                    <button
                        onMouseDown={handleSOSStart}
                        onMouseUp={handleSOSEnd}
                        onMouseLeave={handleSOSEnd}
                        onTouchStart={handleSOSStart}
                        onTouchEnd={handleSOSEnd}
                        disabled={sosLoading}
                        style={{ width: '100%', padding: '20px', background: 'linear-gradient(135deg, #F87171, #EF4444)', border: 'none', borderRadius: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: sosLoading ? 0.7 : 1, boxShadow: '0 8px 24px rgba(239,68,68,0.3)', transition: 'all 0.15s' }}
                    >
                        <ShieldAlert size={28} color="#FFFFFF" />
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hold for Business Emergency SOS</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.05em' }}>Hold for 3 seconds to trigger authority red alarm</span>
                    </button>
                )}
            </section>

            {/* Safety + Traffic cards */}
            <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                {/* Safety Score */}
                <div style={{ ...clayCard, padding: '24px', borderTop: `4px solid ${C.primary}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                            <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, margin: 0 }}>Zone Safety Status</p>
                            <h3 style={{ fontWeight: 800, color: C.text, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.1rem' }}>
                                <MapPin size={16} color={C.primary} /> {user?.business_name || 'Business Zone'}
                            </h3>
                        </div>
                        <span style={{ background: 'rgba(52,211,153,0.12)', color: '#059669', fontSize: '0.65rem', fontWeight: 700, padding: '4px 12px', textTransform: 'uppercase', borderRadius: 20 }}>Safe</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: '3rem', fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{analytics?.safety_score || 98}</span>
                        <div style={{ marginBottom: 4 }}>
                            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: C.safe, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}><TrendingUp size={12} /> +2.5%</p>
                            <p style={{ fontSize: '0.62rem', color: C.textMuted, margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>Dynamic Score</p>
                        </div>
                    </div>
                    <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
                        <defs><linearGradient id="sparkGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor={C.primary} stopOpacity="0.3" /><stop offset="100%" stopColor={C.primary} stopOpacity="0.05" /></linearGradient></defs>
                        <path d="M0,70 Q80,65 140,50 T240,30 T320,18 T400,5" fill="none" stroke={C.primary} strokeWidth="3" strokeLinecap="round" />
                        <path d="M0,70 Q80,65 140,50 T240,30 T320,18 T400,5 V80 H0 Z" fill="url(#sparkGrad)" />
                    </svg>
                </div>

                {/* Traffic */}
                <div style={{ ...clayCard, padding: '24px', borderTop: `4px solid ${C.moderate}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                            <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, margin: 0 }}>Footfall Overview</p>
                            <h3 style={{ fontWeight: 800, color: C.text, margin: '4px 0 0', fontSize: '1.1rem' }}>Real-time Traffic</h3>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: C.text }}>{analytics?.tourist_count || 305}</span>
                            <p style={{ fontSize: '0.62rem', color: C.textMuted, margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>Active Visitors</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, gap: 6, paddingTop: 8 }}>
                        {[60, 45, 75, 90, 55, 100, 80].map((h, i) => (
                            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                <div style={{ width: '100%', background: `linear-gradient(180deg, ${C.moderate}, rgba(251,191,36,0.3))`, borderRadius: '6px 6px 0 0', height: `${h}%` }} />
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.textMuted }}>{'MTWTFSS'[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
                {/* Nearby tourists */}
                <div style={{ ...clayCard, overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '20px 20px 0 0' }}>
                        <h3 style={{ fontWeight: 800, color: C.text, margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={15} color={C.primary} /> Nearby Tourists</h3>
                        <span style={{ background: 'rgba(108,99,255,0.08)', color: C.primary, fontSize: '0.6rem', fontWeight: 700, padding: '3px 10px', borderRadius: 10 }}>200m Radius</span>
                    </div>
                    <div style={{ position: 'relative', height: 200, background: C.surfaceAlt }}>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 80, height: 80, border: `2px solid rgba(108,99,255,0.2)`, borderRadius: '50%', background: 'rgba(108,99,255,0.04)' }} />
                            <div style={{ position: 'absolute', width: 14, height: 14, background: C.primary, borderRadius: '50%', boxShadow: '0 0 8px rgba(108,99,255,0.4)' }} />
                        </div>
                        {[{ x: '38%', y: '28%' }, { x: '62%', y: '58%' }, { x: '28%', y: '48%' }].map((pos, i) => (
                            <div key={i} style={{ position: 'absolute', width: 10, height: 10, background: C.safe, borderRadius: '50%', left: pos.x, top: pos.y, boxShadow: '0 0 4px rgba(52,211,153,0.4)' }} />
                        ))}
                        <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '8px 12px', fontSize: '0.72rem', fontWeight: 700, color: C.text, boxShadow: '0 2px 8px rgba(27,29,42,0.06)' }}>12 verified tourists in vicinity</div>
                    </div>
                </div>

                {/* Advisories */}
                <div style={{ ...clayCard, overflow: 'hidden', padding: 0 }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '20px 20px 0 0' }}>
                        <h3 style={{ fontWeight: 800, color: C.text, margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={15} color={C.moderate} /> Safety Advisories</h3>
                        <button style={{ background: 'linear-gradient(135deg, #FBBF24, #F59E0B)', border: 'none', borderRadius: 12, padding: '8px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(251,191,36,0.25)' }}>
                            <PlusCircle size={13} /> Post Advisory
                        </button>
                    </div>
                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {advisories.length > 0 ? advisories.map((adv: any) => {
                            const alertData = adv.alert || adv;
                            return (
                                <div key={adv._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)' }}>
                                    <div style={{ width: 38, height: 38, background: 'rgba(251,191,36,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AlertTriangle size={18} color={C.moderate} /></div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontWeight: 700, color: C.text, margin: 0, fontSize: '0.88rem' }}>{alertData.title}</h4>
                                        <p style={{ fontSize: '0.75rem', color: C.textMuted, margin: 0 }}>{alertData.message || 'No advisory details provided.'}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ background: 'rgba(52,211,153,0.12)', color: '#059669', fontSize: '0.6rem', fontWeight: 700, padding: '3px 8px', textTransform: 'uppercase', borderRadius: 8 }}>Active</span>
                                        <p style={{ fontSize: '0.68rem', color: C.textMuted, margin: '4px 0 0' }}>{new Date(adv.delivered_at || alertData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ padding: '28px', textAlign: 'center', border: `2px dashed ${C.border}`, borderRadius: 14 }}>
                                <Info size={20} style={{ margin: '0 auto 8px', color: C.textMuted }} />
                                <p style={{ fontSize: '0.82rem', color: C.textMuted, fontWeight: 600 }}>No active advisories in your sector.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Identity Verification */}
            <section className="responsive-flex-col" style={{ ...clayCard, background: 'linear-gradient(135deg, #1B1D2A, #252840)', padding: '28px', display: 'flex', gap: 32, alignItems: 'flex-start', borderRadius: 20, border: 'none' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(108,99,255,0.3)' }}><Fingerprint size={22} color="#FFFFFF" /></div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Blockchain Identity Proof</h3>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', fontWeight: 400 }}>Validate traveler credentials against the Trackmate ledger.</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)' }} />
                            <input value={verificationId} onChange={e => setVerificationId(e.target.value)} style={{ width: '100%', paddingLeft: 38, padding: '12px 14px 12px 38px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.88rem', color: '#FFFFFF', outline: 'none' }} placeholder="ST-ID-XXXXXXXXXX" />
                        </div>
                        <button onClick={handleVerify} disabled={isVerifying || !verificationId} style={{ background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', borderRadius: 14, padding: '0 24px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'uppercase', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: 8, opacity: (isVerifying || !verificationId) ? 0.5 : 1, boxShadow: '0 4px 12px rgba(108,99,255,0.25)' }}>
                            {isVerifying ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Check size={16} />} Verify
                        </button>
                    </div>
                </div>

                {verificationResult && (
                    <div style={{ width: 320, background: C.surface, border: `1px solid rgba(108,99,255,0.2)`, borderRadius: 20, boxShadow: '0 12px 40px rgba(0,0,0,0.2)', padding: '20px', flexShrink: 0 }}>
                        {verificationResult.error || verificationResult.valid === false ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: C.critical }}>
                                <AlertTriangle size={18} />
                                <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{verificationResult.error || 'Identity proof not found in blockchain ledger.'}</p>
                            </div>
                        ) : (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                    <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, margin: 0 }}>Ledger Verified</p>
                                    <span style={{ background: 'rgba(52,211,153,0.12)', color: '#059669', fontSize: '0.6rem', fontWeight: 700, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 4, borderRadius: 8 }}><Check size={10} /> Auth Valid</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 52, height: 52, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(108,99,255,0.25)' }}><Users size={28} color="#FFFFFF" /></div>
                                    <div>
                                        <h4 style={{ fontWeight: 800, color: C.text, margin: 0 }}>{verificationResult.name}</h4>
                                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: C.primary, margin: '4px 0 0', wordBreak: 'break-all' }}>{verificationResult.blockchain_id}</p>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: C.safe, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={10} /> Security Clearance Verified</p>
                                    </div>
                                </div>
                                <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 14, paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ background: C.surfaceAlt, padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.border}` }}>
                                        <p style={{ fontSize: '0.58rem', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Verification</p>
                                        <p style={{ fontWeight: 700, color: C.text, margin: '4px 0 0', fontSize: '0.82rem' }}>{verificationResult.is_verified ? 'Identity Proofed' : 'Pending'}</p>
                                    </div>
                                    <div style={{ background: C.surfaceAlt, padding: '10px 12px', borderRadius: 12, border: `1px solid ${C.border}` }}>
                                        <p style={{ fontSize: '0.58rem', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>Role</p>
                                        <p style={{ fontWeight: 800, color: C.primary, margin: '4px 0 0', fontSize: '0.82rem', textTransform: 'uppercase' }}>{verificationResult.role}</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
