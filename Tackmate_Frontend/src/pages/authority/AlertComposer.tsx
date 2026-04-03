import { useState, useEffect } from 'react';
import { Send, Loader2, Bell } from 'lucide-react';
import api from '../../lib/api';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';

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
  borderRadius: 20,
  border: `1px solid ${C.border}`,
  boxShadow: '6px 6px 14px rgba(27,29,42,0.10), -3px -3px 10px rgba(255,255,255,0.9)',
};

const clayInputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', background: '#F7F5FF', border: '1px solid rgba(27,29,42,0.08)', borderRadius: 14, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '0.88rem', fontWeight: 500, outline: 'none', color: '#1B1D2A', boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)' };

const ALERT_TYPES = [
    { value: 'emergency', label: '🚨 Emergency', color: C.critical },
    { value: 'safety_warning', label: '⚠️ Safety Warning', color: C.moderate },
    { value: 'weather', label: '🌩️ Weather Advisory', color: C.primary },
    { value: 'traffic', label: '🚗 Traffic Update', color: C.safe },
    { value: 'zone_update', label: '📍 Zone Update', color: C.safe },
    { value: 'curfew', label: '🔒 Curfew', color: C.restricted },
    { value: 'evacuation', label: '🏃 Evacuation', color: C.critical },
    { value: 'general', label: '📢 General Info', color: C.textSecondary },
];

const PRIORITIES = [
    { value: 'low', label: 'LOW', color: C.textMuted },
    { value: 'medium', label: 'MEDIUM', color: C.moderate },
    { value: 'high', label: 'HIGH', color: C.high },
    { value: 'critical', label: 'CRITICAL', color: C.critical },
];

const TARGET_GROUPS = [
    { value: 'all', label: 'All Users' },
    { value: 'tourists', label: 'All Tourists' },
    { value: 'residents', label: 'All Residents' },
    { value: 'businesses', label: 'All Businesses' },
    { value: 'user', label: 'Specific User' },
    { value: 'zone', label: 'Users in Zone' },
];

export default function AlertComposer() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [alertType, setAlertType] = useState('general');
    const [priority, setPriority] = useState('medium');
    const [targetGroup, setTargetGroup] = useState('all');
    const [targetUserId, setTargetUserId] = useState('');
    const [targetZoneId, setTargetZoneId] = useState('');
    const [sending, setSending] = useState(false);
    const [alertHistory, setAlertHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState<any[]>([]);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => { fetchAlerts(); fetchZones(); }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const res = await api.get('/alerts?limit=30');
            if (res.data.success) setAlertHistory(res.data.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchZones = async () => {
        try {
            const res = await api.get('/zones');
            if (res.data.success) setZones(res.data.data);
        } catch (err) { console.error(err); }
    };

    const handleSend = async () => {
        if (!title.trim() || !message.trim()) {
            setErrorMsg('Title and message are required.');
            return;
        }
        setErrorMsg('');
        setSending(true);
        try {
            const payload: any = { title, message, alert_type: alertType, priority, target_group: targetGroup };
            if (targetGroup === 'user' && targetUserId) payload.target_user_id = targetUserId;
            if (targetGroup === 'zone' && targetZoneId) payload.target_zone_id = targetZoneId;

            const res = await api.post('/alerts', payload);
            if (res.data.success) {
                setErrorMsg('');
                setSuccessMsg(`Alert sent to ${res.data.recipientCount} users!`);
                setTimeout(() => setSuccessMsg(''), 4000);
                setTitle(''); setMessage(''); setPriority('medium'); setAlertType('general'); setTargetGroup('all');
                fetchAlerts();
            }
        } catch (err: any) {
            setErrorMsg(`Failed: ${err.response?.data?.message || err.message}`);
        } finally { setSending(false); }
    };

    const getPriorityStyle = (p: string) => {
        const pObj = PRIORITIES.find(pr => pr.value === p);
        return { background: pObj?.color || '#ccc', color: '#FFFFFF', borderRadius: 10, padding: '4px 10px', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em', boxShadow: `0 2px 6px ${(pObj?.color || '#ccc')}40` };
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0 }}>
                {/* Header */}
                <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: C.text, margin: 0 }}>Alert Broadcaster</h1>
                        <p style={{ fontSize: '0.75rem', color: C.textMuted, margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Compose & Send Real-Time Alerts</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surfaceAlt, padding: '8px 14px', borderRadius: 12, border: `1px solid ${C.border}` }}>
                        <Bell size={18} color={C.primary} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.85rem', color: C.text }}>{alertHistory.length} sent</span>
                    </div>
                </div>

                <div className="responsive-grid responsive-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '24px 28px', flex: 1 }}>
                    {/* ── Compose Panel ── */}
                    <div style={{ ...clayCard, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, color: C.text }}>
                            📢 Compose Alert
                        </h2>

                        {successMsg && (
                            <div style={{ background: 'rgba(52,211,153,0.1)', border: `1px solid rgba(52,211,153,0.3)`, borderRadius: 12, padding: '12px 16px', fontWeight: 700, fontSize: '0.85rem', color: C.safe }}>
                                ✅ {successMsg}
                            </div>
                        )}

                        {errorMsg && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.3)`, borderRadius: 12, padding: '12px 16px', fontWeight: 700, fontSize: '0.85rem', color: C.critical }}>
                                ⚠️ {errorMsg}
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6, color: C.textMuted }}>Alert Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Flash Flood Warning — Old City Area"
                                style={{ ...clayInputStyle, boxSizing: 'border-box' }} />
                            <span style={{ fontSize: '0.65rem', color: C.textMuted, fontWeight: 600, display: 'block', marginTop: 4 }}>{title.length}/80</span>
                        </div>

                        {/* Message */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6, color: C.textMuted }}>Message</label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={500} rows={4} placeholder="Provide detailed alert instructions..."
                                style={{ ...clayInputStyle, resize: 'vertical' as const, minHeight: 80, boxSizing: 'border-box' }} />
                            <span style={{ fontSize: '0.65rem', color: C.textMuted, fontWeight: 600, display: 'block', marginTop: 4 }}>{message.length}/500</span>
                        </div>

                        {/* Alert Type */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6, color: C.textMuted }}>Alert Type</label>
                            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                {ALERT_TYPES.map(t => (
                                    <button key={t.value} onClick={() => setAlertType(t.value)}
                                        style={{ padding: '10px 12px', border: alertType === t.value ? 'none' : `1px solid ${C.border}`, borderRadius: 12, background: alertType === t.value ? t.color : C.surfaceAlt, color: alertType === t.value ? '#FFFFFF' : C.text, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: alertType === t.value ? `0 4px 12px ${t.color}40` : '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)', transition: 'all 0.15s' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6, color: C.textMuted }}>Priority</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {PRIORITIES.map(p => (
                                    <button key={p.value} onClick={() => setPriority(p.value)}
                                        style={{ flex: 1, padding: '10px', border: priority === p.value ? 'none' : `1px solid ${C.border}`, borderRadius: 12, background: priority === p.value ? p.color : C.surfaceAlt, color: priority === p.value ? '#FFFFFF' : C.text, fontFamily: 'inherit', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', boxShadow: priority === p.value ? `0 4px 12px ${p.color}40` : '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.15s' }}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Audience */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6, color: C.textMuted }}>Target Audience</label>
                            <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)}
                                style={{ ...clayInputStyle, cursor: 'pointer' }}>
                                {TARGET_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                        </div>

                        {targetGroup === 'user' && (
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6, color: C.textMuted }}>User ID</label>
                                <input value={targetUserId} onChange={e => setTargetUserId(e.target.value)} placeholder="Enter user ID..."
                                    style={{ ...clayInputStyle, fontFamily: "'JetBrains Mono', monospace", boxSizing: 'border-box' }} />
                            </div>
                        )}

                        {targetGroup === 'zone' && (
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6, color: C.textMuted }}>Zone</label>
                                <select value={targetZoneId} onChange={e => setTargetZoneId(e.target.value)}
                                    style={{ ...clayInputStyle, cursor: 'pointer' }}>
                                    <option value="">Select Zone...</option>
                                    {zones.map((z: any) => <option key={z._id} value={z._id}>{z.name} ({z.risk_level})</option>)}
                                </select>
                            </div>
                        )}

                        {/* Send Button */}
                        <button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}
                            style={{ background: priority === 'critical' ? 'linear-gradient(135deg, #F87171, #EF4444)' : 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', borderRadius: 14, boxShadow: priority === 'critical' ? '0 4px 14px rgba(239,68,68,0.4)' : '0 4px 14px rgba(108,99,255,0.4)', padding: '16px 24px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.9rem', cursor: sending ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#FFFFFF', opacity: sending ? 0.6 : 1, transition: 'all 0.2s', marginTop: 8 }}>
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {sending ? 'Sending...' : 'Send Alert Now'}
                        </button>
                    </div>

                    {/* ── Alert History ── */}
                    <div style={{ ...clayCard, padding: '28px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 140px)', overflow: 'hidden' }}>
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, borderBottom: `1px solid ${C.border}`, paddingBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: C.text }}>
                            📜 Alert History
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: C.textMuted }}>{alertHistory.length} total</span>
                        </h2>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" color={C.primary} /></div>
                            ) : alertHistory.length === 0 ? (
                                <p style={{ color: C.textMuted, fontWeight: 600, textAlign: 'center', padding: 40 }}>No alerts sent yet</p>
                            ) : (
                                alertHistory.map((a: any) => {
                                    const typeObj = ALERT_TYPES.find(t => t.value === a.alert_type);
                                    return (
                                        <div key={a._id} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: '16px 20px', background: C.surfaceAlt, boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.02), inset -2px -2px 4px rgba(255,255,255,0.5)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: C.text }}>{a.title}</span>
                                                <span style={getPriorityStyle(a.priority)}>{a.priority}</span>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: C.textSecondary, margin: '0 0 10px', lineHeight: 1.4, fontWeight: 500 }}>{a.message}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: C.textMuted, fontWeight: 600 }}>
                                                <span style={{ background: 'rgba(27,29,42,0.05)', padding: '4px 8px', borderRadius: 8 }}>{typeObj?.label || a.alert_type} · {a.target_group}</span>
                                                <div style={{ display: 'flex', gap: 12 }}>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>👁 {a.readCount || 0}/{a.recipientCount || 0} read</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>✅ {a.ackCount || 0} ack</span>
                                                    <span>{new Date(a.created_at).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
