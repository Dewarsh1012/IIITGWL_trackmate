import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, Zap } from 'lucide-react';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const C = {
        surface: '#FFFFFF',
        surfaceAlt: '#F7F5FF',
        text: '#1B1D2A',
        textMuted: '#8B8FA8',
        primary: '#6C63FF',
        border: 'rgba(27,29,42,0.08)',
    };

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    return (
        <header className="top-header">
            {/* Brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                    border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '4px 4px 10px rgba(108,99,255,0.25)',
                    borderRadius: 12,
                }}>
                    <Zap size={18} color="#FFFFFF" fill="#FFFFFF" />
                </div>
                <h2 style={{ fontSize: '1.15rem', margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '0.04em', color: C.text }}>
                    TRACK<span style={{ color: C.primary }}>MATE</span>
                </h2>
            </div>

            {user && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    {user.safety_score !== undefined && (
                        <div className="badge badge-safe" style={{ gap: 6 }}>
                            <Shield size={12} />
                            <span>Score {user.safety_score}</span>
                        </div>
                    )}

                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        paddingLeft: 16,
                        borderLeft: `1px solid ${C.border}`,
                    }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>
                                {user.full_name}
                            </div>
                            <div style={{ fontSize: '0.62rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                                {user.role}
                            </div>
                        </div>
                        {user.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt="Profile"
                                style={{ width: 36, height: 36, objectFit: 'cover', border: `1px solid ${C.border}`, boxShadow: '4px 4px 10px rgba(27,29,42,0.08)', borderRadius: 12 }}
                            />
                        ) : (
                            <div style={{
                                width: 36, height: 36,
                                background: C.surfaceAlt,
                                border: `1px solid ${C.border}`,
                                boxShadow: '4px 4px 10px rgba(27,29,42,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: '1rem', fontFamily: "'Plus Jakarta Sans', sans-serif",
                                color: C.text,
                                borderRadius: 12,
                            }}>
                                {user.full_name.charAt(0)}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleLogout}
                        className="geo-btn geo-btn-sm"
                        title="Log Out"
                        style={{ padding: '8px 12px' }}
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            )}
        </header>
    );
}
