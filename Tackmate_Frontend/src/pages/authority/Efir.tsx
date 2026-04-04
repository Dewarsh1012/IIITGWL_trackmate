import { useState, useEffect, useRef } from 'react';
import { Trash2, Upload, Eye, Send, Save, MapPin, Calendar, FileText, Loader2, Fingerprint, Users, Mail, Phone, Info, AlertTriangle, Mic, StopCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useSearchParams } from 'react-router-dom';
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

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: C.surfaceAlt, border: `1px solid ${C.border}`,
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.88rem', fontWeight: 500, outline: 'none',
    boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)',
    color: C.text, borderRadius: 12,
};

const labelS: React.CSSProperties = {
    fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, display: 'block', marginBottom: 6,
};

export default function AuthorityEfir() {
    const { } = useAuth();
    const [params] = useSearchParams();
    const incidentId = params.get('incidentId');

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState('draft');
    const [witnesses, setWitnesses] = useState<any[]>([]);
    const [subject, setSubject] = useState<any>(null);
    const [searchId, setSearchId] = useState('');
    const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [incidentType, setIncidentType] = useState('Theft/Larceny');
    const [location, setLocation] = useState('');
    const [incidentTime, setIncidentTime] = useState('');
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [voiceGenerating, setVoiceGenerating] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (incidentId) { fetchIncident(incidentId); } else { setLoading(false); }
    }, [incidentId]);

    useEffect(() => {
        return () => {
            if (recognitionRef.current && typeof recognitionRef.current.stop === 'function') {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const fetchIncident = async (id: string) => {
        try {
            const res = await api.get(`/incidents/${id}`);
            if (res.data.success) {
                const inc = res.data.data;
                setTitle(`eFIR: ${inc.title}`);
                setDescription(inc.description || '');
                setIncidentType(inc.incident_type || 'General');
                setLocation(`${inc.latitude}, ${inc.longitude}`);
                setIncidentTime(new Date(inc.created_at).toISOString().slice(0, 16));
                if (inc.reporter) setSubject(inc.reporter);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const findSubject = async () => {
        if (!searchId) {
            setNotice({ type: 'error', message: 'Enter a blockchain ID or email to search.' });
            return;
        }
        try {
            setNotice(null);
            const res = await api.get(`/profiles?search=${searchId}`);
            if (res.data.success && res.data.data.length > 0) { setSubject(res.data.data[0]); }
            else { setNotice({ type: 'error', message: 'Subject not found with that ID or email.' }); }
        } catch {
            setNotice({ type: 'error', message: 'Error searching for subject.' });
        }
    };

    const addWitness = () => setWitnesses([...witnesses, { name: '', contact: '', statement: '' }]);
    const updateWitness = (i: number, field: string, value: string) => { const w = [...witnesses]; w[i][field] = value; setWitnesses(w); };
    const removeWitness = (i: number) => setWitnesses(witnesses.filter((_, idx) => idx !== i));

    const startVoiceCapture = () => {
        const SpeechRecognitionImpl = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognitionImpl) {
            setNotice({ type: 'error', message: 'Voice input is not supported in this browser.' });
            return;
        }

        const recognition = recognitionRef.current || new SpeechRecognitionImpl();
        recognition.lang = 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results || [])
                .map((result: any) => result?.[0]?.transcript || '')
                .join(' ')
                .trim();
            setVoiceTranscript(transcript);
        };

        recognition.onerror = () => {
            setIsListening(false);
            setNotice({ type: 'error', message: 'Voice capture failed. Check microphone permissions.' });
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setNotice(null);
    };

    const stopVoiceCapture = () => {
        if (recognitionRef.current && typeof recognitionRef.current.stop === 'function') {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const generateVoiceDraft = async () => {
        if (!voiceTranscript || voiceTranscript.trim().length < 25) {
            setNotice({ type: 'error', message: 'Record at least 25 characters of voice transcript before drafting.' });
            return;
        }

        try {
            setNotice(null);
            setVoiceGenerating(true);
            const res = await api.post('/efirs/voice-draft', {
                transcript: voiceTranscript,
                incident_hint: incidentType,
            });

            if (res.data.success) {
                const draft = res.data.data || {};
                if (draft.title) setTitle(draft.title);
                if (draft.description) setDescription(draft.description);
                if (draft.incident_type) setIncidentType(draft.incident_type);
                if (draft.incident_location) setLocation(draft.incident_location);
                if (draft.incident_time) {
                    const parsed = new Date(draft.incident_time);
                    if (!Number.isNaN(parsed.getTime())) setIncidentTime(parsed.toISOString().slice(0, 16));
                }
                if (Array.isArray(draft.witness_statements) && draft.witness_statements.length > 0) {
                    setWitnesses(draft.witness_statements.map((w: any) => ({
                        name: w.name || '',
                        contact: w.contact || '',
                        statement: w.statement || '',
                    })));
                }

                setNotice({
                    type: 'success',
                    message: `Voice draft generated (${draft.source || 'heuristic'} mode). Review before submit.`,
                });
            }
        } catch {
            setNotice({ type: 'error', message: 'Unable to generate voice draft. Try again.' });
        } finally {
            setVoiceGenerating(false);
        }
    };

    const handleSubmit = async (_submitStatus: string) => {
        if (!subject) { setNotice({ type: 'error', message: 'Please select a subject first.' }); return; }
        if (!title || title.length < 5) { setNotice({ type: 'error', message: 'Title is required and must be at least 5 characters.' }); return; }
        if (!description || description.length < 20) { setNotice({ type: 'error', message: 'Description is required and must be at least 20 characters.' }); return; }
        try {
            setNotice(null);
            setIsSubmitting(true);
            const payload: Record<string, any> = { user: subject._id, title, description, incident_type: incidentType };
            if (location) payload.incident_location = location;
            if (incidentTime) payload.incident_time = incidentTime;
            if (incidentId) payload.incident = incidentId;
            const validWitnesses = witnesses.filter(w => w.name && w.statement && w.statement.length >= 10);
            if (validWitnesses.length > 0) payload.witness_statements = validWitnesses;
            if (evidenceUrls.length > 0) payload.evidence_urls = evidenceUrls;
            const res = await api.post('/efirs', payload);
            if (res.data.success) {
                setNotice({ type: 'success', message: _submitStatus === 'submitted' ? 'eFIR submitted successfully.' : 'eFIR saved as draft successfully.' });
                setStatus(_submitStatus);
            }
        } catch (err: any) {
            let msg = err.response?.data?.message || err.message || 'Submission failed.';
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                msg += '\n' + err.response.data.errors.map((e: any) => `${e.field || e.path}: ${e.message}`).join('\n');
            }
            setNotice({ type: 'error', message: `Submission Error: ${msg}` });
        } finally { setIsSubmitting(false); }
    };

    const steps = ['draft', 'submitted', 'review', 'resolved', 'closed'];

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg }}>
            <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite' }} />
        </div>
    );

    const canSubmit = !!subject && !!title && !!description;

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1 }}>
                {/* Header */}
                <div style={{ background: 'linear-gradient(135deg, #1B1D2A, #2F3252)', borderBottom: `1px solid ${C.border}`, padding: '18px 28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, boxShadow: '0 6px 12px rgba(108,99,255,0.3)' }}>
                            <FileText size={18} color="#FFFFFF" />
                        </div>
                        <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Electronic FIR Filing</h1>
                    </div>
                    {/* Progress steps */}
                    <div style={{ display: 'flex', gap: 8 }}>
                        {steps.map((s) => (
                            <div key={s} style={{ flex: 1 }}>
                                <div style={{ height: 4, background: s === status ? C.primary : 'rgba(255,255,255,0.2)', marginBottom: 4 }} />
                                <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: s === status ? '#FFFFFF' : 'rgba(255,255,255,0.5)', margin: 0 }}>{s}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="responsive-grid" style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
                    {notice && (
                        <div style={{ gridColumn: '1 / -1', background: notice.type === 'success' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)', border: `1px solid ${notice.type === 'success' ? C.safe : C.high}40`, boxShadow: '4px 4px 10px rgba(27,29,42,0.08), -2px -2px 6px rgba(255,255,255,0.85)', padding: '10px 14px', fontSize: '0.82rem', fontWeight: 700, color: notice.type === 'success' ? C.text : C.high, borderRadius: 14 }}>
                            {notice.type === 'success' ? '✅' : '⚠️'} {notice.message}
                        </div>
                    )}

                    {/* Left column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Subject */}
                        <div style={{ ...clayCard }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '20px 20px 0 0' }}>
                                <h3 style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: C.text }}><Users size={16} /> Subject Information</h3>
                                {!subject && (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="Blockchain ID or Email" style={{ ...inputStyle, width: 220, padding: '6px 10px', fontSize: '0.8rem' }} />
                                        <button onClick={findSubject} style={{ background: C.primary, color: '#FFFFFF', border: 'none', padding: '6px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase', borderRadius: 10, boxShadow: '0 6px 12px rgba(108,99,255,0.25)' }}>Search</button>
                                    </div>
                                )}
                            </div>
                            <div style={{ padding: '20px' }}>
                                {subject ? (
                                    <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                        <div><label style={labelS}>Full Name</label><p style={{ fontWeight: 700, color: C.text, margin: 0 }}>{subject.full_name}</p></div>
                                        <div><label style={labelS}>Blockchain Hash ID</label><code style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: C.primary, fontWeight: 700 }}>{subject.blockchain_id || 'NOT_ASSIGNED'}</code></div>
                                        <div>
                                            <label style={labelS}>Contact</label>
                                            <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: C.text }}><Mail size={12} /> {subject.email}</p>
                                            <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: C.textMuted }}><Phone size={12} /> {subject.phone || '—'}</p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                            <button onClick={() => setSubject(null)} style={{ background: 'none', border: 'none', color: C.high, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>Change Subject</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ padding: '28px', textAlign: 'center', border: `2px dashed ${C.border}`, color: C.textMuted, borderRadius: 14 }}>
                                        <Fingerprint size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                                        <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No subject selected. Use search to find a verified user.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Incident details */}
                        <div style={{ ...clayCard }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '20px 20px 0 0' }}>
                                <h3 style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: C.text }}><Mic size={16} /> Voice-to-eFIR Draft</h3>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {!isListening ? (
                                        <button onClick={startVoiceCapture} style={{ background: C.primary, color: '#FFFFFF', border: 'none', padding: '6px 12px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', textTransform: 'uppercase', borderRadius: 10, boxShadow: '0 6px 12px rgba(108,99,255,0.25)' }}>
                                            Start Listening
                                        </button>
                                    ) : (
                                        <button onClick={stopVoiceCapture} style={{ background: C.high, color: '#FFFFFF', border: 'none', padding: '6px 12px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', textTransform: 'uppercase', borderRadius: 10 }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><StopCircle size={12} /> Stop</span>
                                        </button>
                                    )}
                                    <button onClick={generateVoiceDraft} disabled={voiceGenerating} style={{ background: C.safe, color: '#0B3B2A', border: 'none', padding: '6px 12px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.7rem', cursor: voiceGenerating ? 'not-allowed' : 'pointer', textTransform: 'uppercase', borderRadius: 10, opacity: voiceGenerating ? 0.7 : 1 }}>
                                        {voiceGenerating ? 'Generating...' : 'Generate Draft'}
                                    </button>
                                </div>
                            </div>
                            <div style={{ padding: '20px' }}>
                                <label style={labelS}>Captured Transcript</label>
                                <textarea value={voiceTranscript} onChange={e => setVoiceTranscript(e.target.value)} style={{ ...inputStyle, minHeight: 88, resize: 'vertical' }} placeholder="Speak incident details or paste transcript here..." />
                                <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: isListening ? C.high : C.textMuted, fontWeight: 700 }}>
                                    {isListening ? 'Listening live. Speak clearly and include location/time cues.' : 'Tip: mention place, time, and what happened for better draft quality.'}
                                </p>
                            </div>
                        </div>

                        {/* Incident details */}
                        <div style={{ ...clayCard }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', alignItems: 'center', gap: 8, borderRadius: '20px 20px 0 0' }}>
                                <AlertTriangle size={16} color={C.high} /><h3 style={{ fontWeight: 800, margin: 0, fontSize: '0.9rem', color: C.text }}>Incident Details</h3>
                            </div>
                            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div><label style={labelS}>FIR Title</label><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Theft at North Gate" /></div>
                                    <div><label style={labelS}>Incident Category</label>
                                        <select value={incidentType} onChange={e => setIncidentType(e.target.value)} style={inputStyle}>
                                            <option>Theft/Larceny</option><option>Assault</option><option>Harassment</option><option>Accident</option><option>General Safety</option>
                                        </select>
                                    </div>
                                </div>
                                <div><label style={labelS}>Detailed Narrative</label><textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} placeholder="Type narrative here..." /></div>
                                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div><label style={labelS}><MapPin size={10} style={{ display: 'inline' }} /> Location Ref</label><input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} placeholder="Coordinates or Zone name" /></div>
                                    <div><label style={labelS}><Calendar size={10} style={{ display: 'inline' }} /> Incident Time</label><input type="datetime-local" value={incidentTime} onChange={e => setIncidentTime(e.target.value)} style={inputStyle} /></div>
                                </div>
                            </div>
                        </div>

                        {/* Witnesses */}
                        <div style={{ ...clayCard }}>
                            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '20px 20px 0 0' }}>
                                <h3 style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', color: C.text }}><Info size={16} /> Witness Evidence</h3>
                                <button onClick={addWitness} style={{ background: C.safe, border: 'none', padding: '6px 12px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer', textTransform: 'uppercase', borderRadius: 10, boxShadow: '0 6px 12px rgba(52,211,153,0.25)', color: '#0B3B2A' }}>+ Add Member</button>
                            </div>
                            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {witnesses.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: C.textMuted, fontWeight: 600, fontSize: '0.85rem', padding: '16px' }}>No witness statements captured yet.</p>
                                ) : witnesses.map((w, i) => (
                                    <div key={i} style={{ padding: '14px', background: C.surfaceAlt, border: `1px solid ${C.border}`, position: 'relative', borderRadius: 12 }}>
                                        <button onClick={() => removeWitness(i)} style={{ position: 'absolute', top: 8, right: 8, background: C.high, border: 'none', color: '#FFFFFF', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6 }}>
                                            <Trash2 size={12} />
                                        </button>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                                            <input value={w.name} onChange={e => updateWitness(i, 'name', e.target.value)} placeholder="Witness Name" style={{ ...inputStyle, padding: '7px 10px' }} />
                                            <input value={w.contact} onChange={e => updateWitness(i, 'contact', e.target.value)} placeholder="Contact" style={{ ...inputStyle, padding: '7px 10px' }} />
                                        </div>
                                        <textarea value={w.statement} onChange={e => updateWitness(i, 'statement', e.target.value)} placeholder="Brief statement..." style={{ ...inputStyle, resize: 'none', minHeight: 60 }} rows={2} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Submission control */}
                        <div style={{ ...clayCard, padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <h3 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.textMuted, margin: '0 0 4px' }}>Submission Control</h3>
                            <button onClick={() => canSubmit ? handleSubmit('submitted') : setNotice({ type: 'error', message: !subject ? 'Select a subject.' : !title ? 'Enter a title.' : 'Enter a description.' })} style={{ background: canSubmit ? 'linear-gradient(135deg, #6C63FF, #8B85FF)' : 'rgba(108,99,255,0.2)', border: 'none', padding: '14px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.88rem', cursor: canSubmit ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, boxShadow: canSubmit ? '0 10px 18px rgba(108,99,255,0.25)' : 'none' }}>
                                {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />} Submit & Anchor FIR
                            </button>
                            <button onClick={() => canSubmit ? handleSubmit('draft') : setNotice({ type: 'error', message: 'Fill required fields first.' })} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: '10px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12 }}>
                                <Save size={14} /> Save Work Draft
                            </button>

                            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 4 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                    <Fingerprint size={14} color={C.safe} />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted }}>Digital Integrity Log</span>
                                </div>
                                <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: C.primary, wordBreak: 'break-all', lineHeight: 1.7, borderRadius: 12 }}>
                                    [LEDGER_PENDING]: SHA-256 anchoring on submission. Status: UNTRUSTED_DRAFT.
                                </div>
                            </div>
                        </div>

                        {/* Evidence vault */}
                        <div style={{ ...clayCard }}>
                            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', alignItems: 'center', gap: 8, borderRadius: '20px 20px 0 0' }}>
                                <Upload size={14} /><h4 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, color: C.text }}>Evidence Vault</h4>
                            </div>
                            <div style={{ padding: '16px' }}>
                                <label style={{ display: 'block', border: `2px dashed ${C.border}`, padding: '24px', textAlign: 'center', cursor: 'pointer', borderRadius: 14, background: C.surfaceAlt }}>
                                    <input type="file" style={{ display: 'none' }} multiple accept="image/*,video/*,application/pdf" onChange={e => { const files = Array.from(e.target.files || []); setEvidenceUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]); }} />
                                    <Eye size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: C.textMuted, margin: 0 }}>Upload Scene Photos</p>
                                </label>
                                {evidenceUrls.length > 0 && (
                                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        {evidenceUrls.map((_, i) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surfaceAlt, border: `1px solid ${C.border}`, padding: '6px 10px', borderRadius: 10 }}>
                                                <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: C.text }}>Evidence_File_{i + 1}.img</span>
                                                <button onClick={() => setEvidenceUrls(p => p.filter((_, idx) => idx !== i))} style={{ background: C.high, border: 'none', color: '#FFFFFF', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 6 }}>
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
