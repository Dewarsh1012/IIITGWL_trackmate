import { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Volume2, Eye } from 'lucide-react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

const C = {
    bg: '#F0EDFA',
    surface: '#FFFFFF',
    surfaceAlt: '#F7F5FF',
    text: '#1B1D2A',
    textSecondary: '#4A4D68',
    textMuted: '#8B8FA8',
    primary: '#6C63FF',
    safe: '#34D399',
    moderate: '#FBBF24',
    high: '#F87171',
    critical: '#EF4444',
    border: 'rgba(27,29,42,0.08)',
};

const PRIORITY_COLORS: Record<string, string> = {
    critical: C.critical,
    high: C.high,
    medium: C.moderate,
    low: '#94A3B8',
};

interface UserAlertData {
    _id: string;
    alert: {
        _id: string;
        title: string;
        message: string;
        alert_type: string;
        priority: string;
        created_at: string;
    };
    is_read: boolean;
    is_acknowledged: boolean;
    delivered_at: string;
}

export default function AlertPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [alerts, setAlerts] = useState<UserAlertData[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [criticalAlert, setCriticalAlert] = useState<UserAlertData | null>(null);
    const { socket } = useSocket();

    const fetchAlerts = useCallback(async () => {
        try {
            const [alertsRes, countRes] = await Promise.all([
                api.get('/alerts/my'),
                api.get('/alerts/my/unread-count'),
            ]);
            if (alertsRes.data.success) setAlerts(alertsRes.data.data);
            if (countRes.data.success) setUnreadCount(countRes.data.data.count);
        } catch (err) { console.error('Failed to fetch alerts:', err); }
    }, []);

    useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

    // Listen for real-time alerts via socket
    useEffect(() => {
        if (!socket) return;
        const handleNewAlert = (alertData: any) => {
            fetchAlerts();
            // If critical, show forced modal
            if (alertData.priority === 'critical') {
                setCriticalAlert({
                    _id: 'temp',
                    alert: alertData,
                    is_read: false,
                    is_acknowledged: false,
                    delivered_at: new Date().toISOString(),
                });
            }
        };
        socket.on('new_alert', handleNewAlert);
        return () => { socket.off('new_alert', handleNewAlert); };
    }, [socket, fetchAlerts]);

    const markRead = async (alertId: string) => {
        try {
            await api.patch(`/alerts/my/${alertId}/read`);
            setAlerts(prev => prev.map(a => a.alert._id === alertId ? { ...a, is_read: true } : a));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    const acknowledge = async (alertId: string) => {
        try {
            await api.patch(`/alerts/my/${alertId}/acknowledge`);
            setAlerts(prev => prev.map(a => a.alert._id === alertId ? { ...a, is_acknowledged: true, is_read: true } : a));
            setUnreadCount(prev => Math.max(0, prev - 1));
            setCriticalAlert(null);
        } catch (err) { console.error(err); }
    };

    return (
        <>
            {/* Bell Button */}
            <button onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchAlerts(); }} style={{ position: 'relative', background: C.surfaceAlt, border: `1px solid ${C.border}`, boxShadow: '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)', cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
                <Bell size={20} color={C.text} />
                {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 2, right: 2, background: C.critical, color: '#FFFFFF', fontSize: '0.6rem', fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${C.border}`, animation: 'pulse-red 1.5s infinite' }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Slide-in Panel */}
            {isOpen && (
                <div style={{ position: 'fixed', top: 0, right: 0, width: 380, height: '100vh', background: C.surface, borderLeft: `1px solid ${C.border}`, boxShadow: '-12px 0 24px rgba(27,29,42,0.12)', zIndex: 1000, display: 'flex', flexDirection: 'column', transition: 'transform 0.3s' }}>
                    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: C.surfaceAlt }}>
                        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>Notifications</h3>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                            <X size={20} color={C.textMuted} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {alerts.length === 0 ? (
                            <p style={{ color: C.textMuted, fontWeight: 600, textAlign: 'center', padding: 40, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>No alerts yet</p>
                        ) : (
                            alerts.map(a => {
                                const alertData = a.alert;
                                if (!alertData) return null;
                                const priorityColor = PRIORITY_COLORS[alertData.priority] || '#ccc';
                                const priorityTextColor = ['high', 'critical'].includes(alertData.priority) ? '#FFFFFF' : C.text;
                                return (
                                    <div key={a._id} style={{ border: `1px solid ${C.border}`, padding: '12px 14px', background: a.is_read ? C.surfaceAlt : C.surface, borderLeft: `4px solid ${priorityColor}`, opacity: a.is_read ? 0.8 : 1, borderRadius: 14, boxShadow: '4px 4px 10px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>{alertData.title}</span>
                                            <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', background: `${priorityColor}22`, color: priorityTextColor, border: `1px solid ${priorityColor}`, borderRadius: 8 }}>
                                                {alertData.priority}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.78rem', color: C.textSecondary, margin: '0 0 8px', lineHeight: 1.4, fontWeight: 500 }}>{alertData.message}</p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '0.65rem', color: C.textMuted, fontWeight: 600 }}>{new Date(a.delivered_at).toLocaleString()}</span>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {!a.is_read && (
                                                    <button onClick={() => markRead(alertData._id)} style={{ background: C.primary, color: '#FFFFFF', border: 'none', padding: '4px 10px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', borderRadius: 8, boxShadow: '0 4px 10px rgba(108,99,255,0.25)' }}>
                                                        <Eye size={12} /> Read
                                                    </button>
                                                )}
                                                {alertData.priority === 'critical' && !a.is_acknowledged && (
                                                    <button onClick={() => acknowledge(alertData._id)} style={{ background: C.critical, color: '#FFFFFF', border: 'none', padding: '4px 10px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', borderRadius: 8, animation: 'pulse-red 1.5s infinite' }}>
                                                        <CheckCircle size={12} /> ACK
                                                    </button>
                                                )}
                                                {a.is_acknowledged && <span style={{ fontSize: '0.65rem', color: C.safe, fontWeight: 700 }}>Ack'd</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Critical Alert Modal */}
            {criticalAlert && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.6)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: C.surface, border: `2px solid ${C.high}`, boxShadow: '0 18px 40px rgba(239,68,68,0.25)', padding: '40px', maxWidth: 480, width: '90%', textAlign: 'center', borderRadius: 20 }}>
                        <AlertTriangle size={48} color={C.critical} style={{ marginBottom: 16 }} />
                        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: C.critical, margin: '0 0 12px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Critical Alert</h2>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px', fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.text }}>{criticalAlert.alert.title}</h3>
                        <p style={{ fontSize: '0.92rem', color: C.textSecondary, lineHeight: 1.6, margin: '0 0 24px', fontWeight: 500 }}>{criticalAlert.alert.message}</p>
                        <button onClick={() => acknowledge(criticalAlert.alert._id)}
                            style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)', color: '#FFFFFF', border: 'none', boxShadow: '0 10px 20px rgba(239,68,68,0.25)', padding: '14px 28px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 14 }}>
                            <Volume2 size={18} /> I Acknowledge This Alert
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
