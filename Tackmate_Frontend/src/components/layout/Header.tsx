import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, Zap, Globe, ChevronDown } from 'lucide-react';
import { useLanguage, LANGUAGES } from '../../i18n';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { t, language, setLanguage, currentLang } = useLanguage();
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

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

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Language Selector */}
                <div ref={langRef} style={{ position: 'relative' }}>
                    <button
                        id="language-selector"
                        onClick={() => setLangOpen(!langOpen)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 12px',
                            background: langOpen ? C.surfaceAlt : 'transparent',
                            border: `1px solid ${C.border}`,
                            borderRadius: 10,
                            cursor: 'pointer',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            color: C.text,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <Globe size={14} color={C.primary} />
                        <span>{currentLang.nativeName}</span>
                        <ChevronDown size={12} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>

                    {langOpen && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 6px)',
                            right: 0,
                            width: 220,
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                            borderRadius: 14,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                            zIndex: 9999,
                            padding: '6px',
                            maxHeight: 340,
                            overflowY: 'auto',
                            animation: 'fadeInDown 0.15s ease',
                        }}>
                            <div style={{ padding: '6px 10px 8px', fontSize: '0.65rem', fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {t('selectLanguage')}
                            </div>
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        width: '100%', padding: '8px 12px',
                                        background: language === lang.code ? 'linear-gradient(135deg, #6C63FF12, #8B85FF12)' : 'transparent',
                                        border: language === lang.code ? '1px solid #6C63FF30' : '1px solid transparent',
                                        borderRadius: 10,
                                        cursor: 'pointer',
                                        fontSize: '0.82rem',
                                        fontWeight: language === lang.code ? 800 : 600,
                                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                                        color: language === lang.code ? C.primary : C.text,
                                        transition: 'all 0.15s ease',
                                        marginBottom: 2,
                                    }}
                                    onMouseEnter={e => { if (language !== lang.code) (e.target as HTMLElement).style.background = C.surfaceAlt; }}
                                    onMouseLeave={e => { if (language !== lang.code) (e.target as HTMLElement).style.background = 'transparent'; }}
                                >
                                    <span>{lang.nativeName}</span>
                                    <span style={{ fontSize: '0.68rem', color: C.textMuted, fontWeight: 600 }}>{lang.name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {user && (
                    <>
                        {user.safety_score !== undefined && (
                            <div className="badge badge-safe" style={{ gap: 6 }}>
                                <Shield size={12} />
                                <span>{t('score')} {user.safety_score}</span>
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
                            title={t('logout')}
                            style={{ padding: '8px 12px' }}
                        >
                            <LogOut size={16} />
                        </button>
                    </>
                )}
            </div>
        </header>
    );
}
