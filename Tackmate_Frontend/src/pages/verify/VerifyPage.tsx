import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const C = {
    bg: '#F0EDFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F5FF',
    text: '#1B1D2A',
    textSecondary: '#4A4D68',
    textMuted: '#8B8FA8',
    primary: '#6C63FF',
    primaryLight: '#8B85FF',
    safe: '#34D399',
    moderate: '#FBBF24',
    high: '#F87171',
    critical: '#EF4444',
    border: 'rgba(27,29,42,0.08)',
};

export default function VerifyPage() {
    const { blockchainId } = useParams();
    const [isVerifying, setIsVerifying] = useState(true);
    const [result, setResult] = useState<any>(null);

    useEffect(() => {
        const runVerification = async () => {
            try {
                const res = await api.get(`/verify/${blockchainId}`);
                if (res.data.success) {
                    setResult(res.data.data);
                }
            } catch (err) {
                console.error('Verification error:', err);
                setResult({ valid: false });
            } finally {
                setIsVerifying(false);
            }
        };

        if (blockchainId) runVerification();
    }, [blockchainId]);

    return (
        <div style={{ minHeight: '100vh', background: C.bg, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <div className="responsive-container" style={{ width: '100%', maxWidth: 500 }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 800, color: C.text, textDecoration: 'none', marginBottom: 24, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    <ArrowLeft size={18} style={{ marginRight: 8 }} />
                    Back to Home
                </Link>

                <div style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '10px 10px 24px rgba(27,29,42,0.12), -6px -6px 16px rgba(255,255,255,0.95)', padding: 32, position: 'relative', borderRadius: 24 }}>
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        <div style={{ margin: '0 auto 16px', width: 64, height: 64, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px rgba(108,99,255,0.25)', borderRadius: 18 }}>
                            <Shield size={32} color="#FFFFFF" />
                        </div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: C.text, margin: '0 0 8px', textTransform: 'uppercase' }}>Trackmate ID</h1>
                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Blockchain Identity Lookup</p>
                    </div>

                    {isVerifying ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', borderTop: `1px solid ${C.border}` }}>
                            <Loader2 size={48} color={C.primary} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                            <p style={{ margin: 0, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', fontSize: '0.85rem', color: C.text }}>Verifying Hash...</p>
                        </div>
                    ) : result?.valid ? (
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
                            <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: 24, position: 'relative', borderRadius: 18 }}>
                                <div style={{ position: 'absolute', top: -16, right: -16, background: C.safe, border: `1px solid ${C.border}`, borderRadius: '50%', padding: 6, display: 'flex', boxShadow: '0 6px 12px rgba(52,211,153,0.25)' }}>
                                    <CheckCircle2 size={24} color="#FFFFFF" />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                                    <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', borderRadius: 16 }}>
                                        {result.name?.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: C.text }}>{result.name}</h2>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: C.safe, textTransform: 'uppercase', letterSpacing: '0.05em', background: `${C.safe}22`, padding: '4px 8px', borderRadius: 999 }}>
                                            Verified
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 700 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                                        <span style={{ color: C.textMuted }}>Blockchain ID</span>
                                        <span style={{ color: C.primary }}>{result.blockchain_id}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                                        <span style={{ color: C.textMuted }}>System Role</span>
                                        <span style={{ textTransform: 'uppercase', color: C.text }}>{result.role}</span>
                                    </div>
                                    {result.trip && (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, paddingBottom: 8 }}>
                                                <span style={{ color: C.textMuted }}>Destination</span>
                                                <span style={{ color: C.moderate }}>{result.trip.destination_region}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8 }}>
                                                <span style={{ color: C.textMuted }}>Valid Until</span>
                                                <span style={{ color: C.text }}>{new Date(result.trip.valid_to).toLocaleDateString()}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
                            <div style={{ background: `${C.high}18`, border: `1px solid ${C.high}`, padding: 24, textAlign: 'center', color: C.high, borderRadius: 18 }}>
                                <XCircle size={48} style={{ margin: '0 auto 16px' }} />
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', color: C.high }}>Verification Failed</h2>
                                <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: '0.85rem', color: C.textSecondary }}>ID not found or expired.</p>
                                <div style={{ background: C.surfaceAlt, padding: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 700, color: C.text, borderRadius: 10, border: `1px solid ${C.border}` }}>
                                    ID: {blockchainId || 'Unknown'}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
