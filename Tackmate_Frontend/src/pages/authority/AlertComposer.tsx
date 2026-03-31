import { useState, useEffect } from 'react';
import { Send, Loader2, Bell } from 'lucide-react';
import api from '../../lib/api';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';

const NB = { black: '#0A0A0A', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#FFFBF0', white: '#FFFFFF' };

const ALERT_TYPES = [
    { value: 'emergency', label: '🚨 Emergency', color: NB.red },
    { value: 'safety_warning', label: '⚠️ Safety Warning', color: NB.orange },
    { value: 'weather', label: '🌩️ Weather Advisory', color: '#6366F1' },
    { value: 'traffic', label: '🚗 Traffic Update', color: NB.blue },
    { value: 'zone_update', label: '📍 Zone Update', color: NB.mint },
    { value: 'curfew', label: '🔒 Curfew', color: '#8B5CF6' },
    { value: 'evacuation', label: '🏃 Evacuation', color: NB.red },
    { value: 'general', label: '📢 General Info', color: '#6B7280' },
];

const PRIORITIES = [
    { value: 'low', label: 'LOW', color: '#94A3B8' },
    { value: 'medium', label: 'MEDIUM', color: NB.yellow },
    { value: 'high', label: 'HIGH', color: NB.orange },
    { value: 'critical', label: 'CRITICAL', color: NB.red },
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
        return { background: pObj?.color || '#ccc', color: p === 'low' ? NB.black : NB.white, border: `2px solid ${NB.black}`, padding: '2px 10px', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' as const, letterSpacing: '0.08em' };
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0 }}>
                {/* Header */}
                <div style={{ background: NB.white, borderBottom: `3px solid ${NB.black}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 3px 0 ${NB.black}` }}>
                    <div>
                        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NB.black, margin: 0 }}>Alert Broadcaster</h1>
                        <p style={{ fontSize: '0.75rem', color: '#6B6B6B', margin: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Compose & Send Real-Time Alerts</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bell size={18} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: '0.85rem' }}>{alertHistory.length} sent</span>
                    </div>
                </div>

                <div className="responsive-grid responsive-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '24px 28px', flex: 1 }}>
                    {/* ── Compose Panel ── */}
                    <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, borderBottom: `3px solid ${NB.black}`, paddingBottom: 12 }}>
                            📢 Compose Alert
                        </h2>

                        {successMsg && (
                            <div style={{ background: NB.mint, border: `3px solid ${NB.black}`, padding: '12px 16px', fontWeight: 700, fontSize: '0.85rem' }}>
                                ✅ {successMsg}
                            </div>
                        )}

                        {errorMsg && (
                            <div style={{ background: '#FFF0F0', border: `3px solid ${NB.red}`, padding: '12px 16px', fontWeight: 700, fontSize: '0.85rem', color: NB.red }}>
                                ⚠️ {errorMsg}
                            </div>
                        )}

                        {/* Title */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Alert Title</label>
                            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80} placeholder="e.g. Flash Flood Warning — Old City Area"
                                style={{ width: '100%', padding: '10px 14px', border: `3px solid ${NB.black}`, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.88rem', background: NB.cream, outline: 'none', boxSizing: 'border-box' }} />
                            <span style={{ fontSize: '0.65rem', color: '#999', fontWeight: 600 }}>{title.length}/80</span>
                        </div>

                        {/* Message */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Message</label>
                            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={500} rows={4} placeholder="Provide detailed alert instructions..."
                                style={{ width: '100%', padding: '10px 14px', border: `3px solid ${NB.black}`, fontFamily: 'inherit', fontWeight: 500, fontSize: '0.85rem', background: NB.cream, outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
                            <span style={{ fontSize: '0.65rem', color: '#999', fontWeight: 600 }}>{message.length}/500</span>
                        </div>

                        {/* Alert Type */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Alert Type</label>
                            <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                {ALERT_TYPES.map(t => (
                                    <button key={t.value} onClick={() => setAlertType(t.value)}
                                        style={{ padding: '8px 12px', border: `2px solid ${alertType === t.value ? NB.black : '#ddd'}`, background: alertType === t.value ? t.color : NB.white, color: alertType === t.value ? NB.white : NB.black, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', boxShadow: alertType === t.value ? `2px 2px 0 ${NB.black}` : 'none', transition: 'all 0.15s' }}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Priority */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Priority</label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {PRIORITIES.map(p => (
                                    <button key={p.value} onClick={() => setPriority(p.value)}
                                        style={{ flex: 1, padding: '10px', border: `3px solid ${priority === p.value ? NB.black : '#ddd'}`, background: priority === p.value ? p.color : NB.white, color: priority === p.value ? (p.value === 'low' || p.value === 'medium' ? NB.black : NB.white) : NB.black, fontFamily: 'inherit', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', boxShadow: priority === p.value ? `3px 3px 0 ${NB.black}` : 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Target Audience */}
                        <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Target Audience</label>
                            <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)}
                                style={{ width: '100%', padding: '10px 14px', border: `3px solid ${NB.black}`, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', background: NB.cream, cursor: 'pointer', appearance: 'none' }}>
                                {TARGET_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                            </select>
                        </div>

                        {targetGroup === 'user' && (
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>User ID</label>
                                <input value={targetUserId} onChange={e => setTargetUserId(e.target.value)} placeholder="Enter user ID..."
                                    style={{ width: '100%', padding: '10px 14px', border: `3px solid ${NB.black}`, fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: '0.8rem', background: NB.cream, outline: 'none', boxSizing: 'border-box' }} />
                            </div>
                        )}

                        {targetGroup === 'zone' && (
                            <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>Zone</label>
                                <select value={targetZoneId} onChange={e => setTargetZoneId(e.target.value)}
                                    style={{ width: '100%', padding: '10px 14px', border: `3px solid ${NB.black}`, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem', background: NB.cream, cursor: 'pointer' }}>
                                    <option value="">Select Zone...</option>
                                    {zones.map((z: any) => <option key={z._id} value={z._id}>{z.name} ({z.risk_level})</option>)}
                                </select>
                            </div>
                        )}

                        {/* Send Button */}
                        <button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}
                            style={{ background: priority === 'critical' ? NB.red : NB.yellow, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '14px 24px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.9rem', cursor: sending ? 'wait' : 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: priority === 'critical' ? NB.white : NB.black, opacity: sending ? 0.6 : 1, transition: 'all 0.2s' }}>
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {sending ? 'Sending...' : 'Send Alert Now'}
                        </button>
                    </div>

                    {/* ── Alert History ── */}
                    <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '28px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: 'calc(100vh - 140px)', overflow: 'hidden' }}>
                        <h2 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, borderBottom: `3px solid ${NB.black}`, paddingBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            📜 Alert History
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', color: '#999' }}>{alertHistory.length} total</span>
                        </h2>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {loading ? (
                                <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={24} className="animate-spin" /></div>
                            ) : alertHistory.length === 0 ? (
                                <p style={{ color: '#999', fontWeight: 600, textAlign: 'center', padding: 40 }}>No alerts sent yet</p>
                            ) : (
                                alertHistory.map((a: any) => {
                                    const typeObj = ALERT_TYPES.find(t => t.value === a.alert_type);
                                    return (
                                        <div key={a._id} style={{ border: `2px solid ${NB.black}`, padding: '14px 16px', background: NB.cream }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{a.title}</span>
                                                <span style={getPriorityStyle(a.priority)}>{a.priority}</span>
                                            </div>
                                            <p style={{ fontSize: '0.78rem', color: '#555', margin: '0 0 8px', lineHeight: 1.4, fontWeight: 500 }}>{a.message}</p>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#888', fontWeight: 600 }}>
                                                <span>{typeObj?.label || a.alert_type} · {a.target_group}</span>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <span>👁 {a.readCount || 0}/{a.recipientCount || 0} read</span>
                                                    <span>✅ {a.ackCount || 0} ack</span>
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
