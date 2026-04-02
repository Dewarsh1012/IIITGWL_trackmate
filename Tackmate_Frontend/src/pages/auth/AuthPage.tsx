import { useState, type ReactElement } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
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
import { Loader2, Copy, Check, Fingerprint, ArrowRight, Shield, Map, Users, Building2 } from 'lucide-react';

const NB = {
    black: '#0A0A0A', yellow: '#FFE500', red: '#FF3B3B',
    blue: '#2B6FFF', mint: '#00D084', cream: '#FFFBF0', white: '#FFFFFF',
};

type RegisterFormFields = {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    phone: string;
    ward_id?: string;
    id_type?: 'aadhaar' | 'passport' | 'voter_id' | 'driving_license';
    id_number?: string;
    destination_region?: string;
    trip_start_date?: string;
    trip_end_date?: string;
    business_name?: string;
    category?: 'accommodation' | 'food_beverage' | 'transport' | 'medical' | 'retail' | 'tour_operator' | 'other';
    address?: string;
    designation?: string;
    department?: string;
    authority_code?: string;
};

const roles: Array<{ id: RegisterRole; label: string; sub: string; bg: string; icon: ReactElement }> = [
    { id: 'tourist', label: 'Tourist', sub: 'Visitor', bg: NB.yellow, icon: <Map size={22} color={NB.black} /> },
    { id: 'resident', label: 'Resident', sub: 'Local', bg: NB.blue, icon: <Users size={22} color={NB.white} /> },
    { id: 'business', label: 'Business', sub: 'Service', bg: NB.mint, icon: <Building2 size={22} color={NB.black} /> },
    { id: 'authority', label: 'Authority', sub: 'Gov Agency', bg: 'skyblue', icon: <Shield size={22} color={NB.white} /> },
];

const ROLE_IDS: RegisterRole[] = ['tourist', 'resident', 'business', 'authority'];

type ApiErrorShape = {
    message?: string;
};

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
    const [hoveredRole, setHoveredRole] = useState<string | null>(null);
    const [blockchainId, setBlockchainId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const { login, register: authRegister } = useAuth();
    const navigate = useNavigate();

    const handleCopy = () => {
        if (blockchainId) {
            navigator.clipboard.writeText(blockchainId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const onLogin = async (data: LoginInput) => {
        try { setErrorMsg(''); const user = await login(data.email, data.password); navigate(`/${user.role}/dashboard`); }
        catch (error: unknown) { setErrorMsg(getApiErrorMessage(error, 'Login failed')); }
    };

    const onRegister = async (data: RegisterFormFields) => {
        try {
            setErrorMsg('');
            const payload: Record<string, unknown> = { ...data, role };
            if (role === 'tourist') {
                payload.start_date = data.trip_start_date;
                payload.end_date = data.trip_end_date;
                delete payload.trip_start_date;
                delete payload.trip_end_date;
            }
            delete payload.confirm_password;
            const { blockchainId: newBcId } = await authRegister(payload);
            setBlockchainId(newBcId);
        } catch (error: unknown) { setErrorMsg(getApiErrorMessage(error, 'Registration failed')); }
    };

    // ── Blockchain ID success screen ──
    if (blockchainId) {
        return (
            <div style={{ minHeight: '100vh', background: NB.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Space Grotesk', sans-serif", backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                <div style={{ width: '100%', maxWidth: 480 }}>
                    {/* Header tag */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: NB.mint, border: `2px solid ${NB.black}`, padding: '4px 14px', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: NB.black, marginBottom: 20 }}>
                        <Check size={13} /> Identity Issued
                    </div>

                    <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `6px 6px 0 ${NB.black}`, padding: 32 }}>
                        <div style={{ width: 64, height: 64, background: NB.yellow, border: `3px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                            <Fingerprint size={32} color={NB.black} />
                        </div>
                        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: NB.black, marginBottom: 10 }}>Digital Identity Issued</h2>
                        <p style={{ color: '#3A3A3A', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 24, fontWeight: 500 }}>
                            Your cryptographic blockchain identifier has been generated. Keep this safe — authorities use it to verify your identity.
                        </p>

                        {/* ID display */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: NB.cream, border: `3px solid ${NB.black}`, padding: '14px 16px', marginBottom: 24, boxShadow: `3px 3px 0 ${NB.black}` }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', color: NB.blue, fontWeight: 700, wordBreak: 'break-all' }}>{blockchainId}</span>
                            <button onClick={handleCopy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: NB.black, padding: '4px 8px', marginLeft: 8 }}>
                                {copied ? <Check size={18} color={NB.mint} /> : <Copy size={18} />}
                            </button>
                        </div>

                        <button
                            onClick={() => navigate(`/${role}/dashboard`)}
                            style={{ width: '100%', background: NB.yellow, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '14px 0', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.1s' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 ${NB.black}`; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = `4px 4px 0 ${NB.black}`; }}
                        >
                            Enter Dashboard <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif", backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>

            {/* Nav */}
            <header style={{ background: NB.black, borderBottom: `4px solid ${NB.black}`, padding: '0 5%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                    <div style={{ width: 32, height: 32, background: NB.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={18} color={NB.black} />
                    </div>
                    <span style={{ color: NB.white, fontWeight: 800, fontSize: '1rem', letterSpacing: '0.04em' }}>
                        TRACK<span style={{ color: NB.yellow }}>MATE</span>
                    </span>
                </Link>
                <Link to="/" style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', textDecoration: 'none' }}>
                    ← Back
                </Link>
            </header>

            <main style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '48px 20px', minHeight: 'calc(100vh - 60px)' }}>
                <div style={{ width: '100%', maxWidth: 680 }}>
                    {/* Mode toggle tabs */}
                    <div style={{ display: 'flex', border: `3px solid ${NB.black}`, marginBottom: 0, background: NB.white, boxShadow: `5px 5px 0 ${NB.black}` }}>
                        {(['register', 'login'] as const).map(m => (
                            <button key={m} onClick={() => setMode(m)} style={{
                                flex: 1, padding: '14px', background: mode === m ? NB.yellow : NB.white,
                                color: NB.black, border: 'none', borderRight: m === 'register' ? `3px solid ${NB.black}` : 'none',
                                fontFamily: 'inherit', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
                                textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.1s',
                            }}>
                                {m === 'register' ? 'Register' : 'Sign In'}
                            </button>
                        ))}
                    </div>

                    {/* Main card */}
                    <div style={{ background: NB.white, border: `3px solid ${NB.black}`, borderTop: 'none', padding: '32px 32px 40px', boxShadow: `5px 5px 0 ${NB.black}` }}>
                        {errorMsg && (
                            <div style={{ background: '#FFF0F0', border: `2px solid ${NB.red}`, padding: '10px 16px', marginBottom: 24, color: NB.red, fontSize: '0.88rem', fontWeight: 700, boxShadow: `3px 3px 0 ${NB.red}` }}>
                                {errorMsg}
                            </div>
                        )}

                        {mode === 'login' ? (
                            <LoginForm onSubmit={onLogin} />
                        ) : (
                            <>
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: NB.black, marginBottom: 14, borderBottom: `3px solid ${NB.black}`, paddingBottom: 8 }}>Select Your Role</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                                        {roles.map(r => (
                                            <button 
                                                key={r.id} 
                                                onClick={() => setRole(r.id)} 
                                                onMouseEnter={() => setHoveredRole(r.id)}
                                                onMouseLeave={() => setHoveredRole(null)}
                                                type="button" 
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px',
                                                    background: role === r.id ? r.bg : (hoveredRole === r.id && r.id === 'authority' ? 'skyblue' : NB.cream),
                                                    border: role === r.id ? `3px solid ${NB.black}` : `2px solid ${NB.black}`,
                                                    boxShadow: role === r.id ? `3px 3px 0 ${NB.black}` : 'none',
                                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 0.1s, transform 0.1s, box-shadow 0.1s',
                                            }}>
                                                <div style={{ width: 36, height: 36, background: role === r.id ? 'rgba(0,0,0,0.15)' : NB.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {r.icon}
                                                </div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: NB.black }}>{r.label}</span>
                                                <span style={{ fontSize: '0.62rem', color: '#5A5A5A', fontWeight: 600 }}>{r.sub}</span>
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
    background: '#FFFFFF', border: '3px solid #0A0A0A',
    borderRadius: 0, color: '#0A0A0A',
    fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.9rem', fontWeight: 500,
    outline: 'none', boxShadow: '3px 3px 0 #0A0A0A',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0A0A0A', marginBottom: 5, display: 'block',
};

const errStyle: React.CSSProperties = { fontSize: '0.75rem', color: '#FF3B3B', fontWeight: 600, marginTop: 4 };

const sectionBoxStyle: React.CSSProperties = {
    background: '#FFFBF0', border: '2px solid #0A0A0A', padding: '20px', marginTop: 8, marginBottom: 8,
};

const submitBtnStyle: React.CSSProperties = {
    width: '100%', background: '#FFE500', border: '3px solid #0A0A0A', boxShadow: '4px 4px 0 #0A0A0A',
    padding: '14px 0', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.9rem',
    cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.1s', marginTop: 24, color: '#0A0A0A',
};

function LoginForm({ onSubmit }: { onSubmit: (data: LoginInput) => void }) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div><label style={labelStyle}>Email Address</label><input {...register('email')} type="email" style={inputStyle} placeholder="you@example.com" />{errors.email && <p style={errStyle}>{errors.email.message as string}</p>}</div>
            <div><label style={labelStyle}>Password</label><input {...register('password')} type="password" style={inputStyle} placeholder="••••••••" />{errors.password && <p style={errStyle}>{errors.password.message as string}</p>}</div>
            <button type="submit" disabled={isSubmitting} style={submitBtnStyle} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #0A0A0A'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #0A0A0A'; }}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Authenticate</span><ArrowRight size={16} /></>}
            </button>
        </form>
    );
}

function RegisterForm({ role, onSubmit }: { role: RegisterRole; onSubmit: (data: RegisterFormFields) => void }) {
    const schemaByRole = {
        tourist: touristRegisterSchema,
        resident: residentRegisterSchema,
        business: businessRegisterSchema,
        authority: authorityRegisterSchema,
    } as const;
    const schema = schemaByRole[role];
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormFields>({ resolver: zodResolver(schema as never) });

    return (
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={labelStyle}>Full Name</label><input {...register('full_name')} style={inputStyle} placeholder="Legal Name" />{errors.full_name && <p style={errStyle}>{errors.full_name.message as string}</p>}</div>
                <div><label style={labelStyle}>Phone</label><input {...register('phone')} style={inputStyle} placeholder="+91 ..." />{errors.phone && <p style={errStyle}>{errors.phone.message as string}</p>}</div>
            </div>
            <div><label style={labelStyle}>Email Address</label><input {...register('email')} type="email" style={inputStyle} placeholder="you@example.com" />{errors.email && <p style={errStyle}>{errors.email.message as string}</p>}</div>

            {role === 'tourist' && (
                <div style={sectionBoxStyle}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14, color: '#2B6FFF' }}>Tourist Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={labelStyle}>ID Type</label><select {...register('id_type')} style={inputStyle}><option value="aadhaar">Aadhaar</option><option value="passport">Passport</option><option value="voter_id">Voter ID</option><option value="driving_license">Driving License</option></select></div>
                        <div><label style={labelStyle}>ID Number</label><input {...register('id_number')} style={inputStyle} placeholder="For verification" />{errors.id_number && <p style={errStyle}>{errors.id_number.message as string}</p>}</div>
                    </div>
                    <div style={{ marginTop: 12 }}><label style={labelStyle}>Destination Region</label><input {...register('destination_region')} style={inputStyle} placeholder="e.g. Tawang District" />{errors.destination_region && <p style={errStyle}>{errors.destination_region.message as string}</p>}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <div><label style={labelStyle}>Trip Start</label><input {...register('trip_start_date')} type="date" style={inputStyle} />{errors.trip_start_date && <p style={errStyle}>{errors.trip_start_date.message as string}</p>}</div>
                        <div><label style={labelStyle}>Trip End</label><input {...register('trip_end_date')} type="date" style={inputStyle} />{errors.trip_end_date && <p style={errStyle}>{errors.trip_end_date.message as string}</p>}</div>
                    </div>
                </div>
            )}

            {role === 'resident' && (
                <div style={sectionBoxStyle}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: '#00D084' }}>Resident Details</div>
                    <div><label style={labelStyle}>Ward ID</label><input {...register('ward_id')} style={inputStyle} placeholder="Enter your Ward ID" /><p style={{ fontSize: '0.75rem', color: '#6B6B6B', marginTop: 4, fontWeight: 500 }}>Links you to neighbourhood alerts.</p>{errors.ward_id && <p style={errStyle}>{errors.ward_id.message as string}</p>}</div>
                </div>
            )}

            {role === 'business' && (
                <div style={sectionBoxStyle}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: '#FF7A00' }}>Business Details</div>
                    <div><label style={labelStyle}>Business Name</label><input {...register('business_name')} style={inputStyle} placeholder="Official Name" />{errors.business_name && <p style={errStyle}>{errors.business_name.message as string}</p>}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <div><label style={labelStyle}>Category</label><select {...register('category')} style={inputStyle}><option value="accommodation">Accommodation</option><option value="food_beverage">Food & Beverage</option><option value="tour_operator">Tour Operator</option></select></div>
                        <div><label style={labelStyle}>Ward ID</label><input {...register('ward_id')} style={inputStyle} placeholder="24-char ID" />{errors.ward_id && <p style={errStyle}>{errors.ward_id.message as string}</p>}</div>
                    </div>
                    <div style={{ marginTop: 12 }}><label style={labelStyle}>Business Address</label><input {...register('address')} style={inputStyle} />{errors.address && <p style={errStyle}>{errors.address.message as string}</p>}</div>
                </div>
            )}

            {role === 'authority' && (
                <div style={sectionBoxStyle}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, color: '#8B5CF6' }}>Authority Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div><label style={labelStyle}>Department</label><input {...register('department')} style={inputStyle} placeholder="e.g. Police" />{errors.department && <p style={errStyle}>{errors.department.message as string}</p>}</div>
                        <div><label style={labelStyle}>Designation</label><input {...register('designation')} style={inputStyle} placeholder="e.g. Inspector" />{errors.designation && <p style={errStyle}>{errors.designation.message as string}</p>}</div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <label style={labelStyle}>Authority Code</label>
                        <input {...register('authority_code')} type="password" style={inputStyle} placeholder="Enter secure authority onboarding code" />
                        {errors.authority_code && <p style={errStyle}>{errors.authority_code.message as string}</p>}
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div><label style={labelStyle}>Password</label><input {...register('password')} type="password" style={inputStyle} placeholder="••••••••" />{errors.password && <p style={errStyle}>{errors.password.message as string}</p>}</div>
                <div><label style={labelStyle}>Confirm Password</label><input {...register('confirm_password')} type="password" style={inputStyle} placeholder="••••••••" />{errors.confirm_password && <p style={errStyle}>{errors.confirm_password.message as string}</p>}</div>
            </div>

            <button type="submit" disabled={isSubmitting} style={submitBtnStyle} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #0A0A0A'; }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #0A0A0A'; }}>
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><span>Create Account</span><ArrowRight size={16} /></>}
            </button>
        </form>
    );
}
