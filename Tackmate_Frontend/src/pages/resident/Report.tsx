import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useLocation } from '../../hooks/use-location';
import { Loader2, Shield, AlertTriangle, Crosshair, MapPin, Search, ServerCrash, Flame, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const C = {
  bg: '#F0EDFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F5FF',
  dark: '#1B1D2A',
  text: '#1B1D2A',
  textSecondary: '#4A4D68',
  textMuted: '#8B8FA8',
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  accent: '#FF6B8A',
  safe: '#34D399',
  moderate: '#FBBF24',
  high: '#F87171',
  restricted: '#A78BFA',
  critical: '#EF4444',
  border: 'rgba(27,29,42,0.08)',
};

const clayCard: React.CSSProperties = {
  background: C.surface,
  borderRadius: 24,
  border: `1px solid ${C.border}`,
  boxShadow: '8px 8px 16px rgba(27,29,42,0.08), -4px -4px 12px rgba(255,255,255,0.9)',
};

const clayInputStyle: React.CSSProperties = { width: '100%', padding: '14px 16px', background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.9rem', fontWeight: 600, outline: 'none', color: C.text, boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.05), inset -2px -2px 4px rgba(255,255,255,0.8)' };
const clayLabelStyle = { display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8, color: C.textMuted };

export default function ResidentReport() {
    const { lat, lng } = useLocation();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const { register, handleSubmit, watch, setValue } = useForm({
        defaultValues: { incident_type: 'crime', title: '', description: '' }
    });

    const incidentType = watch('incident_type');

    const onSubmit = async (data: any) => {
        try {
            setErrorMsg('');
            setIsSubmitting(true);
            await api.post('/incidents', {
                ...data,
                severity: 'medium',
                latitude: lat,
                longitude: lng,
                source: 'resident_report',
                is_public: true,
            });
            navigate('/resident/dashboard');
        } catch (err) {
            console.error(err);
            setErrorMsg('Failed to submit report. Please review your details and try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const types = [
        { id: 'crime', label: 'Crime', icon: <AlertTriangle size={22} />, color: C.high },
        { id: 'accident', label: 'Accident', icon: <ServerCrash size={22} />, color: C.moderate },
        { id: 'medical', label: 'Medical', icon: <Crosshair size={22} />, color: C.accent },
        { id: 'infrastructure', label: 'Infrastructure', icon: <Shield size={22} />, color: C.primary },
        { id: 'missing_person', label: 'Missing Person', icon: <Search size={22} />, color: C.textSecondary },
        { id: 'suspicious', label: 'Suspicious', icon: <AlertTriangle size={22} />, color: C.moderate },
        { id: 'fire', label: 'Fire', icon: <Flame size={22} />, color: C.critical },
    ];

    return (
        <div style={{ flex: 1, padding: '24px', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", overflowY: 'auto', paddingBottom: 100, minHeight: '100vh' }}>
            <div className="responsive-container" style={{ maxWidth: 800, margin: '0 auto' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Report an Incident</h1>
                        <p style={{ margin: 0, fontWeight: 600, color: C.textSecondary, fontSize: '0.9rem' }}>Provide the initial details of the occurrence.</p>
                    </div>
                    <div style={{ background: C.surfaceAlt, color: C.primary, padding: '8px 16px', borderRadius: 12, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', border: `1px solid ${C.border}`, boxShadow: 'inset 2px 2px 4px rgba(27,29,42,0.04)' }}>
                        Step {step} of 3
                    </div>
                </div>

                {errorMsg && (
                    <div style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 16, padding: '14px 20px', marginBottom: 24, color: C.critical, fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <AlertTriangle size={18} /> {errorMsg}
                    </div>
                )}

                {/* Progress Tracker */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
                    {['Details', 'Location', 'Evidence'].map((s, i) => {
                        const isActive = step >= i + 1;
                        return (
                            <div key={s} style={{ flex: 1 }}>
                                <div style={{ height: 8, borderRadius: 4, background: isActive ? 'linear-gradient(135deg, #6C63FF, #8B85FF)' : C.surfaceAlt, border: isActive ? 'none' : `1px solid ${C.border}`, boxShadow: isActive ? '0 2px 8px rgba(108,99,255,0.4)' : 'inset 1px 1px 3px rgba(27,29,42,0.06)' }} />
                                <p style={{ marginTop: 10, margin: '10px 0 0', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: isActive ? C.text : C.textMuted }}>{s}</p>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} style={{ ...clayCard, overflow: 'hidden' }}>
                    <div style={{ padding: '36px 32px' }}>

                        {step === 1 && (
                            <>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: C.text, margin: '0 0 24px' }}>What are you reporting?</h2>
                                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14, marginBottom: 36 }}>
                                    {types.map((type) => {
                                        const selected = incidentType === type.id;
                                        return (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setValue('incident_type', type.id)}
                                                style={{ padding: '16px 12px', background: selected ? type.color : C.surfaceAlt, border: selected ? 'none' : `1px solid ${C.border}`, borderRadius: 16, boxShadow: selected ? `0 6px 16px ${type.color}40` : '4px 4px 10px rgba(27,29,42,0.04), -2px -2px 6px rgba(255,255,255,0.8)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'all 0.2s', transform: selected ? 'translateY(-2px)' : 'none' }}
                                            >
                                                <div style={{ color: selected ? '#FFFFFF' : type.color, background: selected ? 'rgba(255,255,255,0.2)' : 'transparent', padding: 8, borderRadius: 12 }}>{type.icon}</div>
                                                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: selected ? '#FFFFFF' : C.text, textAlign: 'center' }}>{type.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                    <div>
                                        <label style={clayLabelStyle}>Incident Title</label>
                                        <input {...register('title', { required: true })} style={clayInputStyle} placeholder="Brief summary of the incident" type="text" />
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <label style={clayLabelStyle}>Detailed Description</label>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, background: 'rgba(108,99,255,0.1)', color: C.primary, padding: '4px 8px', borderRadius: 8, marginBottom: 8 }}>MIN 20 CHARS</span>
                                        </div>
                                        <textarea {...register('description', { required: true })} style={{ ...clayInputStyle, minHeight: 140, resize: 'vertical' }} placeholder="Please provide as much detail as possible about what happened..." />
                                    </div>
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div style={{ padding: '40px 0', textAlign: 'center' }}>
                                <div style={{ width: 90, height: 90, background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(45,212,191,0.15))', border: `2px solid rgba(52,211,153,0.3)`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(52,211,153,0.2)', position: 'relative' }}>
                                    <div style={{ position: 'absolute', inset: -15, border: `1px solid rgba(52,211,153,0.2)`, borderRadius: '50%', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                                    <MapPin size={40} color={C.safe} />
                                </div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, margin: '0 0 12px' }}>Auto-Capturing GPS Location</h2>
                                <p style={{ fontWeight: 600, color: C.textSecondary, margin: '0 0 28px', fontSize: '0.95rem' }}>Tagging incident with current device location.</p>
                                <div style={{ background: C.surfaceAlt, color: C.primary, padding: '14px 28px', display: 'inline-flex', alignItems: 'center', gap: 10, borderRadius: 16, border: `1px solid ${C.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', fontWeight: 800, boxShadow: 'inset 2px 2px 5px rgba(27,29,42,0.03)' }}>
                                    {lat && lng ? <><span style={{ width: 8, height: 8, borderRadius: '50%', background: C.safe }} /> LAT: {lat.toFixed(6)} | LNG: {lng.toFixed(6)}</> : <><Loader2 size={16} className="animate-spin" /> Scanning Satellites...</>}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div style={{ padding: '40px 0' }}>
                                <div style={{ background: C.surfaceAlt, border: `2px dashed ${C.border}`, borderRadius: 20, padding: '54px 24px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', ...clayInputStyle, height: 'auto', boxShadow: 'none' }}>
                                    <div style={{ width: 64, height: 64, background: 'rgba(108,99,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <ArrowRight size={28} color={C.primary} style={{ transform: 'rotate(-90deg)' }} />
                                    </div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 12px', color: C.text }}>Upload Evidence</h3>
                                    <p style={{ fontWeight: 600, color: C.textSecondary, margin: '0 0 28px', fontSize: '0.9rem' }}>Photos, videos, or audio (Optional)</p>
                                    <span style={{ background: C.surface, color: C.text, padding: '12px 24px', borderRadius: 12, fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid ${C.border}`, boxShadow: '0 4px 12px rgba(27,29,42,0.05)' }}>Browse Files</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ background: C.bg, borderTop: `1px solid ${C.border}`, padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {step > 1 ? (
                            <button type="button" onClick={() => setStep(step - 1)} style={{ padding: '14px 24px', background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 14, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(27,29,42,0.05)', transition: 'all 0.2s' }}>
                                <ArrowLeft size={16} /> Back
                            </button>
                        ) : (
                            <button type="button" onClick={() => navigate('/resident/dashboard')} style={{ padding: '14px 24px', background: 'transparent', border: 'none', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', color: C.textMuted, transition: 'all 0.2s' }}>
                                Cancel
                            </button>
                        )}

                        {step < 3 ? (
                            <button type="button" onClick={() => setStep(step + 1)} style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', color: '#FFFFFF', border: 'none', borderRadius: 14, boxShadow: '0 6px 16px rgba(108,99,255,0.3)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                                Next <ArrowRight size={16} />
                            </button>
                        ) : (
                            <button type="submit" disabled={isSubmitting} style={{ padding: '14px 28px', background: 'linear-gradient(135deg, #34D399, #2DD4BF)', color: '#FFFFFF', border: 'none', borderRadius: 14, boxShadow: '0 6px 16px rgba(52,211,153,0.3)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}>
                                {isSubmitting ? <><Loader2 size={16} className="animate-spin" /> Submitting</> : 'Submit to Grid'}
                            </button>
                        )}
                    </div>
                </form>

                <div style={{ textAlign: 'center', marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.textMuted }}>
                    <Shield size={16} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure & Encrypted</span>
                </div>
            </div>
        </div>
    );
}
