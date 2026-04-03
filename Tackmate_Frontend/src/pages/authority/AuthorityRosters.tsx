import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useLocation } from 'react-router-dom';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';

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

export default function AuthorityRosters() {
    const { } = useAuth();
    const location = useLocation();
    const pathPart = location.pathname.split('/').pop() || 'tourists';
    const roleMap: Record<string, string> = { tourists: 'tourist', residents: 'resident', businesses: 'business' };
    const role = roleMap[pathPart] || 'tourist';

    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchProfiles(); }, [role]);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/profiles?role=${role}`);
            if (res.data.success) setProfiles(res.data.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const filteredProfiles = profiles.filter(p => {
        if (!search) return true;
        const t = search.toLowerCase();
        return p.full_name?.toLowerCase().includes(t) || p.blockchain_id?.toLowerCase().includes(t) || p.email?.toLowerCase().includes(t);
    });

    const roleTitle = { tourist: 'Tourist Roster', resident: 'Resident Directory', business: 'Registered Businesses' }[role] || 'User Roster';
    const roleAccent = { tourist: C.primary, resident: C.safe, business: C.moderate }[role] || C.primaryLight;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
            <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite' }} />
        </div>
    );

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1 }}>
                {/* Header */}
                <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 4px 10px rgba(27,29,42,0.06)', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 6, height: 32, background: roleAccent, borderRadius: 6 }} />
                        <div>
                            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, margin: 0 }}>{roleTitle}</h1>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: C.textMuted, fontWeight: 600 }}>{profiles.length} registered accounts</p>
                        </div>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, ID..." style={{ paddingLeft: 32, padding: '10px 14px 10px 32px', background: C.surfaceAlt, border: `1px solid ${C.border}`, boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 500, outline: 'none', width: 260, borderRadius: 12, color: C.text }} />
                    </div>
                </div>

                <div style={{ padding: '24px 28px' }}>
                    <div style={{ ...clayCard, overflowX: 'auto' }}>
                        <table className="geo-table">
                            <thead>
                                <tr>
                                    <th>User Identity</th><th>Contact Info</th><th>Blockchain ID</th><th>Safety Score</th><th style={{ textAlign: 'right' }}>Verification</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProfiles.length === 0 ? (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: C.textMuted, fontWeight: 600 }}>No {role} accounts found in the database.</td></tr>
                                ) : filteredProfiles.map(p => (
                                    <tr key={p._id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ width: 36, height: 36, background: `${roleAccent}22`, border: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', color: C.text, borderRadius: 12 }}>
                                                    {p.full_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p style={{ fontWeight: 700, color: C.text, margin: 0, fontSize: '0.9rem' }}>{p.full_name}</p>
                                                    <p style={{ fontSize: '0.65rem', color: C.textMuted, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{p.id_type || role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: C.text, fontWeight: 500 }}>{p.email}</p>
                                            <p style={{ margin: 0, fontSize: '0.78rem', color: C.textMuted, fontWeight: 500 }}>{p.phone || '—'}</p>
                                        </td>
                                        <td>
                                            <code style={{ fontSize: '0.72rem', background: C.surfaceAlt, padding: '4px 8px', border: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono', monospace", color: C.primary, fontWeight: 700, display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', borderRadius: 8 }}>
                                                {p.blockchain_id || 'NOT_MINTED'}
                                            </code>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{ width: 64, height: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999 }}>
                                                    <div style={{ height: '100%', background: C.safe, width: `${p.safety_score || 0}%`, borderRadius: 999 }} />
                                                </div>
                                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{p.safety_score || 0}%</span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            {p.is_verified ? (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: `${C.safe}22`, color: C.safe, border: `1px solid ${C.safe}`, padding: '3px 10px', borderRadius: 999 }}>
                                                    <CheckCircle size={11} /> Confirmed
                                                </span>
                                            ) : (
                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: `${C.moderate}22`, color: C.moderate, border: `1px solid ${C.moderate}`, padding: '3px 10px', borderRadius: 999 }}>
                                                    <AlertTriangle size={11} /> Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
