import { useAuth } from '../../context/AuthContext';
import { CheckCircle, Phone, Languages, Copy, QrCode } from 'lucide-react';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard, CLAY_CARD_INNER_STYLE as clayCardInner } from '../../theme/clayTheme';

export default function TouristProfile() {
    const { user } = useAuth();
    const initials = user?.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'TM';
    const safetyScore = user?.safety_score ?? 85;

    return (
        <div style={{ maxWidth: 1360, margin: '0 auto', padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>
            <div style={{ ...clayCard, padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Traveler Identity</h1>
                    <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: C.textMuted, fontWeight: 600 }}>Manage verified profile, blockchain identity, and safety posture.</p>
                </div>
                <div style={{ background: `${C.safe}1f`, border: `1px solid ${C.safe}55`, borderRadius: 12, padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} color={C.safe} />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: C.safeDark, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Profile</span>
                </div>
            </div>

            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '320px minmax(0, 1fr)', gap: 20, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ ...clayCard, padding: 22 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', color: '#FFFFFF', fontSize: '2.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px rgba(108,99,255,0.28)' }}>
                                {initials}
                            </div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, textAlign: 'center' }}>{user?.full_name || 'TrackMate User'}</h2>
                            <span style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 999, textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800, color: C.primary, letterSpacing: '0.08em' }}>{user?.role || 'tourist'}</span>
                        </div>

                        <div style={{ marginTop: 16, display: 'grid', gap: 8 }}>
                            {[
                                ['Member Since', 'Jan 2026'],
                                ['Trips', '1'],
                                ['Nationality', 'Indian'],
                            ].map(([label, value]) => (
                                <div key={label} style={{ ...clayCardInner, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.7rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{label}</span>
                                    <span style={{ fontSize: '0.84rem', fontWeight: 700, color: C.text }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ ...clayCard, padding: 22 }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800, color: C.text }}>Safety Standing</h3>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                            <div style={{ position: 'relative', width: 120, height: 120 }}>
                                <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                                    <circle cx="60" cy="60" r="48" fill="none" stroke={C.surfaceAlt} strokeWidth="10" />
                                    <circle cx="60" cy="60" r="48" fill="none" stroke={safetyScore >= 85 ? C.safe : safetyScore >= 70 ? C.moderate : C.high} strokeWidth="10" strokeDasharray="301.6" strokeDashoffset={301.6 - (301.6 * safetyScore / 100)} strokeLinecap="round" />
                                </svg>
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 }}>{safetyScore}%</span>
                                    <span style={{ fontSize: '0.62rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase' }}>Score</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {[
                                ['Verified Identity', '+500', C.safe],
                                ['Safety Reports', '+120', C.primary],
                                ['Local Compliance', '+230', C.orange],
                            ].map(([label, value, color]) => (
                                <div key={label} style={{ ...clayCardInner, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', fontWeight: 600 }}>
                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color as string }} />
                                        {label}
                                    </span>
                                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, fontSize: '0.8rem' }}>{value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ ...clayCard, padding: 22 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Blockchain Digital ID</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', color: C.text }}>
                                    <Copy size={14} /> Copy
                                </button>
                                <button style={{ background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', borderRadius: 10, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 700, fontSize: '0.75rem', color: '#FFFFFF', boxShadow: '0 6px 14px rgba(108,99,255,0.25)' }}>
                                    <QrCode size={14} /> Show QR
                                </button>
                            </div>
                        </div>

                        <div style={{ borderRadius: 16, overflow: 'hidden', background: 'linear-gradient(135deg, #1B1D2A, #252840)', padding: 18, color: '#FFFFFF' }}>
                            <p style={{ margin: '0 0 4px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>TrackMate Ledger Identity</p>
                            <h4 style={{ margin: '0 0 14px', fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>{user?.full_name || 'TrackMate User'}</h4>
                            <div style={{ ...clayCardInner, padding: '10px 12px', background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'none' }}>
                                <p style={{ margin: '0 0 4px', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>Blockchain Hash</p>
                                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem', fontWeight: 700, wordBreak: 'break-all', color: '#FFFFFF' }}>{user?.blockchain_id || 'BC-7A3F9E2B1C4D5678'}</code>
                            </div>
                        </div>
                    </div>

                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
                        <div style={{ ...clayCard, padding: 18 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Emergency Contacts</h3>
                                <button style={{ width: 24, height: 24, borderRadius: 8, border: `1px solid ${C.border}`, background: C.surfaceAlt, fontWeight: 800, cursor: 'pointer', color: C.text }}>+</button>
                            </div>
                            <div style={{ display: 'grid', gap: 8 }}>
                                {['Anita Sharma · Primary', 'Dr. R. Patel · Medical'].map((entry) => (
                                    <div key={entry} style={{ ...clayCardInner, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: C.text }}>{entry}</span>
                                        <button style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: `${C.primary}20`, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                            <Phone size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ ...clayCard, padding: 18 }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Language Preferences</h3>
                                <Languages size={16} color={C.primary} />
                            </div>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, fontWeight: 700 }}>Primary Language</label>
                            <select style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}`, padding: '10px 12px', background: C.surfaceAlt, color: C.text, fontFamily: 'inherit', fontWeight: 700, marginBottom: 12 }}>
                                <option>English (US)</option>
                                <option>Hindi (IN)</option>
                                <option>Spanish (ES)</option>
                            </select>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={{ background: `${C.safe}22`, color: C.safeDark, border: `1px solid ${C.safe}55`, borderRadius: 999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>English</span>
                                <span style={{ background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: 999, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700 }}>Hindi</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ ...clayCard, padding: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800 }}>Recent Security Activity</h3>
                            <a href="#" style={{ color: C.primary, fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none' }}>View All</a>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {[
                                ['Identity Verification via Blockchain', 'Guwahati Airport · Mar 01, 09:45 AM', C.safe],
                                ['Emergency Contact Shared', 'Hotel Blue Pine · Mar 02, 06:12 PM', C.orange],
                                ['Safety Score Recalculated', 'System Update · Feb 28, 12:00 AM', C.textMuted],
                            ].map(([title, detail, color]) => (
                                <div key={title} style={{ ...clayCardInner, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: color as string }} />
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: C.text }}>{title}</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
