import { useState, useRef, useEffect, type ReactElement } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useLanguage, LANGUAGES } from '../../i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { AxiosError } from 'axios';
import { useAuth } from '../../context/AuthContext';
import {
    loginSchema,
    touristRegisterSchema,
    residentRegisterSchema,
    businessRegisterSchema,
    authorityRegisterSchema,
    type LoginInput,
    type RegisterRole,
} from './schemas';
import { Loader2, Copy, Check, Fingerprint, ArrowRight, Shield, Map, Users, Building2, Globe, ChevronDown } from 'lucide-react';

declare global {
    interface Window {
        ethereum?: any;
    }
}

const C = {
  bg: '#F0EDFA', surface: '#FFFFFF', surfaceAlt: '#F7F5FF', dark: '#1B1D2A', text: '#1B1D2A',
  textSecondary: '#4A4D68', textMuted: '#8B8FA8', primary: '#6C63FF', primaryLight: '#8B85FF',
  safe: '#34D399', moderate: '#FBBF24', high: '#F87171', critical: '#EF4444',
  border: 'rgba(27,29,42,0.08)',
};

type RegisterFormFields = {
    full_name: string; email: string; password: string; confirm_password: string; phone: string;
    ward_id?: string; id_type?: 'aadhaar' | 'passport' | 'voter_id' | 'driving_license'; id_number?: string;
    destination_region?: string; trip_start_date?: string; trip_end_date?: string;
    business_name?: string; category?: 'accommodation' | 'food_beverage' | 'transport' | 'medical' | 'retail' | 'tour_operator' | 'other';
    address?: string; designation?: string; department?: string; authority_code?: string;
    wallet_address?: string;
};

const roles: Array<{ id: RegisterRole; label: string; sub: string; color: string; icon: ReactElement }> = [
    { id: 'tourist', label: 'Tourist', sub: 'Visitor', color: C.primary, icon: <Map size={22} color="#FFFFFF" /> },
    { id: 'resident', label: 'Resident', sub: 'Local', color: C.safe, icon: <Users size={22} color="#FFFFFF" /> },
    { id: 'business', label: 'Business', sub: 'Service', color: C.moderate, icon: <Building2 size={22} color="#FFFFFF" /> },
    { id: 'authority', label: 'Authority', sub: 'Gov Agency', color: '#A78BFA', icon: <Shield size={22} color="#FFFFFF" /> },
];

const ROLE_IDS: RegisterRole[] = ['tourist', 'resident', 'business', 'authority'];

type ApiErrorShape = { message?: string };

function isRegisterRole(value: string | null): value is RegisterRole {
    return value !== null && ROLE_IDS.includes(value as RegisterRole);
}

function getApiErrorMessage(error: unknown, fallback: string): string {
    const axiosError = error as AxiosError<ApiErrorShape>;
    return axiosError.response?.data?.message || axiosError.message || fallback;
}

export default function AuthPage() {
    const [params] = useSearchParams();
    const requestedRole = params.get('role');
    const initRole: RegisterRole = isRegisterRole(requestedRole) ? requestedRole : 'tourist';

    const [mode, setMode] = useState<'login' | 'register'>('register');
    const [role, setRole] = useState<RegisterRole>(initRole);
    const [blockchainId, setBlockchainId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const { login, register: authRegister } = useAuth();
    const navigate = useNavigate();
    const { t, language, setLanguage, currentLang } = useLanguage();
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) {
                setLangOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCopy = () => {
        if (blockchainId) { navigator.clipboard.writeText(blockchainId); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    };

    const onLogin = async (data: LoginInput) => {
        try { setErrorMsg(''); const user = await login(data.email, data.password); navigate(`/${user.role}/dashboard`); }
        catch (error: unknown) { setErrorMsg(getApiErrorMessage(error, 'Login failed')); }
    };

    const onRegister = async (data: RegisterFormFields) => {
        try {
            setErrorMsg('');
            const payload: Record<string, unknown> = { ...data, role };
            if (role === 'tourist') { payload.start_date = data.trip_start_date; payload.end_date = data.trip_end_date; delete payload.trip_start_date; delete payload.trip_end_date; }
            delete payload.confirm_password;
            const { blockchainId: newBcId } = await authRegister(payload);
            setBlockchainId(newBcId);
        } catch (error: unknown) { setErrorMsg(getApiErrorMessage(error, 'Registration failed')); }
    };

    // Blockchain ID success screen
    if (blockchainId) {
        return (
            <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <div style={{ width: '100%', maxWidth: 480 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.12)', padding: '6px 16px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#059669', marginBottom: 20, borderRadius: 20 }}>
                        <Check size={13} /> Identity Issued
                    </div>
                    <div style={{ background: C.surface, borderRadius: 24, boxShadow: '10px 10px 20px rgba(27,29,42,0.12), -5px -5px 15px rgba(255,255,255,0.95)', padding: 32, border: `1px solid ${C.border}` }}>
                        <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 8px 20px rgba(108,99,255,0.3)' }}>
                            <Fingerprint size={32} color="#FFFFFF" />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: C.text, marginBottom: 10 }}>{t('digitalIdIssued')}</h2>
                        <p style={{ color: C.textSecondary, fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 24, fontWeight: 500 }}>
                            {t('digitalIdDesc')}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px 16px', marginBottom: 24, boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)' }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', color: C.primary, fontWeight: 600, wordBreak: 'break-all' }}>{blockchainId}</span>
                            <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text, padding: '4px 8px', marginLeft: 8 }}>
                                {copied ? <Check size={18} color={C.safe} /> : <Copy size={18} />}
                            </button>
                        </div>
                        <button
                            onClick={() => navigate(`/${role}/dashboard`)}
                            style={{ width: '100%', background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', borderRadius: 16, padding: '14px 0', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#FFFFFF', boxShadow: '0 8px 20px rgba(108,99,255,0.3)', transition: 'all 0.15s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(108,99,255,0.4)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(108,99,255,0.3)'; }}
                        >
                            {t('enterDashboard')} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {/* Nav */}
            <header style={{ background: 'linear-gradient(135deg, #1B1D2A, #252840)', padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <img src="/trackmate-logo.png" alt="TrackMate Logo" style={{ width: 32, height: 32, borderRadius: 10, objectFit: 'cover', boxShadow: '0 4px 10px rgba(108,99,255,0.3)' }} />
                    <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1rem', letterSpacing: '0.04em' }}>
                        TRACK<span style={{ color: '#8B85FF' }}>MATE</span>
                    </span>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div ref={langRef} style={{ position: 'relative' }}>
                        <button
                            onClick={() => setLangOpen(!langOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
                                background: langOpen ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 10, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700,
                                fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#FFFFFF', transition: 'all 0.2s ease',
                            }}
                        >
                            <Globe size={14} color="#FFFFFF" />
                            <span>{currentLang.nativeName}</span>
                            <ChevronDown size={12} style={{ transform: langOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>

                        {langOpen && (
                            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 200, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 9999, padding: '6px' }}>
                                {LANGUAGES.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '8px 12px', background: language === lang.code ? 'linear-gradient(135deg, #6C63FF12, #8B85FF12)' : 'transparent', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: '0.8rem', fontWeight: language === lang.code ? 800 : 600, color: language === lang.code ? C.primary : C.text, transition: 'all 0.15s ease' }}
                                        onMouseEnter={e => { if (language !== lang.code) (e.target as HTMLElement).style.background = C.surfaceAlt; }}
                                        onMouseLeave={e => { if (language !== lang.code) (e.target as HTMLElement).style.background = 'transparent'; }}
                                    >
                                        <span>{lang.nativeName}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <Link to="/" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none' }}>
                        ← Back
                    </Link>
                </div>
            </header>

            <main style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px', minHeight: 'calc(100vh - 60px)' }}>
                <div style={{ width: '100%', maxWidth: 680 }}>
                    {/* Mode toggle tabs */}
                    <div style={{ display: 'flex', background: C.surfaceAlt, borderRadius: '20px 20px 0 0', padding: 4, boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)' }}>
                        {(['register', 'login'] as const).map(m => (
                            <button key={m} onClick={() => setMode(m)} style={{
                                flex: 1, padding: '14px', background: mode === m ? C.surface : 'transparent',
                                color: mode === m ? C.primary : C.textMuted, border: 'none',
                                fontFamily: 'inherit', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                                textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s',
                                borderRadius: 16, boxShadow: mode === m ? '4px 4px 8px rgba(27,29,42,0.08), -2px -2px 6px rgba(255,255,255,0.9)' : 'none',
                            }}>
                                {m === 'register' ? t('getStarted') : t('login')}
                            </button>
                        ))}
                    </div>

                    {/* Main card */}
                    <div style={{ background: C.surface, borderRadius: '0 0 24px 24px', padding: '32px 32px 40px', boxShadow: '10px 10px 20px rgba(27,29,42,0.12), -5px -5px 15px rgba(255,255,255,0.95)', border: `1px solid ${C.border}`, borderTop: 'none' }}>
                        {errorMsg && (
                            <div style={{ background: 'rgba(248,113,113,0.08)', border: `1px solid rgba(248,113,113,0.2)`, borderRadius: 14, padding: '10px 16px', marginBottom: 24, color: C.critical, fontSize: '0.88rem', fontWeight: 700 }}>
                                {errorMsg}
                            </div>
                        )}

                        {mode === 'login' ? (
                            <LoginForm onSubmit={onLogin} />
                        ) : (
                            <>
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, marginBottom: 14, paddingBottom: 8, borderBottom: `1px solid ${C.border}` }}>Select Your Role</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                        {roles.map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => setRole(r.id)}
                                                type="button"
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px',
                                                    background: role === r.id ? `${r.color}12` : C.surfaceAlt,
                                                    border: role === r.id ? `2px solid ${r.color}40` : `1px solid ${C.border}`,
                                                    borderRadius: 16,
                                                    boxShadow: role === r.id ? `0 4px 12px ${r.color}25` : '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)',
                                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                                                }}
                                            >
                                                <div style={{ width: 36, height: 36, background: role === r.id ? r.color : C.dark, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: role === r.id ? `0 4px 8px ${r.color}30` : 'none' }}>
                                                    {r.icon}
                                                </div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: C.text }}>{r.label}</span>
                                                <span style={{ fontSize: '0.62rem', color: C.textMuted, fontWeight: 600 }}>{r.sub}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <RegisterForm key={role} role={role} onSubmit={onRegister} />
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    background: '#F7F5FF', border: '1px solid rgba(27,29,42,0.08)',
    borderRadius: 14, color: '#1B1D2A',
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.9rem', fontWeight: 500,
    outline: 'none', boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#4A4D68', marginBottom: 5, display: 'block',
};

const errStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#EF4444', fontWeight: 600, marginTop: 4 };

const sectionBoxStyle: React.CSSProperties = {
    background: '#F7F5FF', border: '1px solid rgba(27,29,42,0.08)', borderRadius: 16, padding: '20px', marginTop: 8, marginBottom: 8,
};

const submitBtnStyle: React.CSSProperties = {
    width: '100%', background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', borderRadius: 16,
    boxShadow: '0 8px 20px rgba(108,99,255,0.3)',
    padding: '14px 0', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '0.9rem',
    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', marginTop: 24, color: '#FFFFFF',
};

function LoginForm({ onSubmit }: { onSubmit: (data: LoginInput) => void }) {
    const { t } = useLanguage();
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={labelStyle}>{t('emailAddress')}</label><input {...register('email')} type="email" style={inputStyle} placeholder="you@example.com" />{errors.email && <p style={errStyle}>{errors.email.message as string}</p>}</div>
            <div><label style={labelStyle}>{t('password')}</label><input {...register('password')} type="password" style={inputStyle} placeholder="••••••••" />{errors.password && <p style={errStyle}>{errors.password.message as string}</p>}</div>
            <button type="submit" disabled={isSubmitting} style={submitBtnStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(108,99,255,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(108,99,255,0.3)'; }}
            >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><span>{t('authenticate')}</span><ArrowRight size={16} /></>}
            </button>
        </form>
    );
}

function RegisterForm({ role, onSubmit }: { role: RegisterRole; onSubmit: (data: RegisterFormFields) => void }) {
    const { t } = useLanguage();
    const schemaByRole = { tourist: touristRegisterSchema, resident: residentRegisterSchema, business: businessRegisterSchema, authority: authorityRegisterSchema } as const;
    const schema = schemaByRole[role];
    const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegisterFormFields>({ resolver: zodResolver(schema as never) });
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setWalletAddress(accounts[0]);
                setValue('wallet_address', accounts[0]);
            } catch (error) {
                console.error("User rejected request", error);
            }
        } else {
            alert("MetaMask is not installed. Please install it to use Web3 features.");
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={labelStyle}>{t('fullName')}</label><input {...register('full_name')} style={inputStyle} placeholder="Legal Name" />{errors.full_name && <p style={errStyle}>{errors.full_name.message as string}</p>}</div>
                <div><label style={labelStyle}>{t('phone')}</label><input {...register('phone')} style={inputStyle} placeholder="+91 ..." />{errors.phone && <p style={errStyle}>{errors.phone.message as string}</p>}</div>
            </div>
            <div><label style={labelStyle}>{t('emailAddress')}</label><input {...register('email')} type="email" style={inputStyle} placeholder="you@example.com" />{errors.email && <p style={errStyle}>{errors.email.message as string}</p>}</div>

            {role === 'tourist' && (
                <div style={sectionBoxStyle}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, color: '#6C63FF' }}>{t('touristDetails')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={labelStyle}>{t('idType')}</label><select {...register('id_type')} style={inputStyle}><option value="aadhaar">Aadhaar</option><option value="passport">Passport</option><option value="voter_id">Voter ID</option><option value="driving_license">Driving License</option></select></div>
                        <div><label style={labelStyle}>{t('idNumber')}</label><input {...register('id_number')} style={inputStyle} />{errors.id_number && <p style={errStyle}>{errors.id_number.message as string}</p>}</div>
                    </div>
                    <div style={{ marginTop: 12 }}><label style={labelStyle}>{t('destinationRegionKey')}</label><input {...register('destination_region')} style={inputStyle} placeholder="e.g. Tawang District" />{errors.destination_region && <p style={errStyle}>{errors.destination_region.message as string}</p>}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <div><label style={labelStyle}>{t('tripStart')}</label><input {...register('trip_start_date')} type="date" style={inputStyle} />{errors.trip_start_date && <p style={errStyle}>{errors.trip_start_date.message as string}</p>}</div>
                        <div><label style={labelStyle}>{t('tripEnd')}</label><input {...register('trip_end_date')} type="date" style={inputStyle} />{errors.trip_end_date && <p style={errStyle}>{errors.trip_end_date.message as string}</p>}</div>
                    </div>
                </div>
            )}

            {role === 'resident' && (
                <div style={sectionBoxStyle}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: '#34D399' }}>{t('residentDetails')}</div>
                    <div><label style={labelStyle}>{t('wardId')}</label><input {...register('ward_id')} style={inputStyle} />{errors.ward_id && <p style={errStyle}>{errors.ward_id.message as string}</p>}</div>
                </div>
            )}

            {role === 'business' && (
                <div style={sectionBoxStyle}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: '#FBBF24' }}>{t('businessDetails')}</div>
                    <div><label style={labelStyle}>{t('businessName')}</label><input {...register('business_name')} style={inputStyle} />{errors.business_name && <p style={errStyle}>{errors.business_name.message as string}</p>}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <div><label style={labelStyle}>{t('category')}</label><select {...register('category')} style={inputStyle}><option value="accommodation">Accommodation</option><option value="food_beverage">Food & Beverage</option><option value="tour_operator">Tour Operator</option></select></div>
                        <div><label style={labelStyle}>{t('wardId')}</label><input {...register('ward_id')} style={inputStyle} />{errors.ward_id && <p style={errStyle}>{errors.ward_id.message as string}</p>}</div>
                    </div>
                    <div style={{ marginTop: 12 }}><label style={labelStyle}>{t('businessAddress')}</label><input {...register('address')} style={inputStyle} />{errors.address && <p style={errStyle}>{errors.address.message as string}</p>}</div>
                </div>
            )}

            {role === 'authority' && (
                <div style={sectionBoxStyle}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: '#A78BFA' }}>{t('authDetails')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={labelStyle}>{t('department')}</label><input {...register('department')} style={inputStyle} placeholder="e.g. Police" />{errors.department && <p style={errStyle}>{errors.department.message as string}</p>}</div>
                        <div><label style={labelStyle}>{t('designation')}</label><input {...register('designation')} style={inputStyle} placeholder="e.g. Inspector" />{errors.designation && <p style={errStyle}>{errors.designation.message as string}</p>}</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <label style={labelStyle}>{t('authorityCode')}</label>
                        <input {...register('authority_code')} type="password" style={inputStyle} placeholder="Enter secure authority onboarding code" />
                        {errors.authority_code && <p style={errStyle}>{errors.authority_code.message as string}</p>}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={labelStyle}>{t('password')}</label><input {...register('password')} type="password" style={inputStyle} placeholder="••••••••" />{errors.password && <p style={errStyle}>{errors.password.message as string}</p>}</div>
                <div><label style={labelStyle}>{t('confirmPassword')}</label><input {...register('confirm_password')} type="password" style={inputStyle} placeholder="••••••••" />{errors.confirm_password && <p style={errStyle}>{errors.confirm_password.message as string}</p>}</div>
            </div>

            <div style={sectionBoxStyle}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: C.primary }}>{t('web3Identity')}</div>
                {walletAddress ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(52,211,153,0.1)', padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(52,211,153,0.2)' }}>
                        <Check size={16} color={C.safe} />
                        <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: C.safe, fontWeight: 600 }}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                        <input type="hidden" {...register('wallet_address')} />
                    </div>
                ) : (
                    <button type="button" onClick={connectWallet} style={{ width: '100%', padding: '12px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.15s' }}>
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" style={{ width: 18, height: 18 }} />
                        {t('connectWallet')}
                    </button>
                )}
            </div>

            <button type="submit" disabled={isSubmitting} style={submitBtnStyle}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(108,99,255,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(108,99,255,0.3)'; }}
            >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><span>{t('createAccount')}</span><ArrowRight size={16} /></>}
            </button>
        </form>
    );
}
