import { useState, useEffect, useCallback } from 'react';
import { Bell, X, CheckCircle, AlertTriangle, Volume2, Eye } from 'lucide-react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

const PRIORITY_COLORS: Record<string, string> = {
  critical: NB.red,
  high: NB.orange,
  medium: NB.yellow,
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
      <button onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchAlerts(); }} style={{ position: 'relative', background: NB.yellow, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, cursor: 'pointer', padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Bell size={20} color="#000000" />
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, background: NB.red, color: NB.white, fontSize: '0.6rem', fontWeight: 800, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${NB.black}`, animation: 'pulse-red 1.5s infinite' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-in Panel */}
      {isOpen && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: 380, height: '100vh', background: NB.white, border: `3px solid ${NB.black}`, borderRight: 'none', boxShadow: `-6px 0 0 ${NB.black}`, zIndex: 1000, display: 'flex', flexDirection: 'column', transition: 'transform 0.3s' }}>
          <div style={{ padding: '16px 20px', borderBottom: `3px solid ${NB.black}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: NB.cream }}>
            <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', fontFamily: "'Space Grotesk', sans-serif" }}>🔔 Notifications</h3>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} color={NB.black} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {alerts.length === 0 ? (
              <p style={{ color: '#999', fontWeight: 600, textAlign: 'center', padding: 40, fontFamily: "'Space Grotesk', sans-serif" }}>No alerts yet</p>
            ) : (
              alerts.map(a => {
                const alertData = a.alert;
                if (!alertData) return null;
                const priorityColor = PRIORITY_COLORS[alertData.priority] || '#ccc';
                return (
                  <div key={a._id} style={{ border: `2px solid ${NB.black}`, padding: '12px 14px', background: a.is_read ? NB.cream : NB.white, borderLeft: `5px solid ${priorityColor}`, opacity: a.is_read ? 0.75 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', fontFamily: "'Space Grotesk', sans-serif" }}>{alertData.title}</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 6px', background: priorityColor, color: alertData.priority === 'low' || alertData.priority === 'medium' ? NB.black : NB.white, border: `1.5px solid ${NB.black}` }}>
                        {alertData.priority}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#555', margin: '0 0 8px', lineHeight: 1.4, fontWeight: 500 }}>{alertData.message}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.65rem', color: '#999', fontWeight: 600 }}>{new Date(a.delivered_at).toLocaleString()}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!a.is_read && (
                          <button onClick={() => markRead(alertData._id)} style={{ background: NB.blue, color: NB.white, border: `2px solid ${NB.black}`, padding: '4px 10px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                            <Eye size={12} /> Read
                          </button>
                        )}
                        {alertData.priority === 'critical' && !a.is_acknowledged && (
                          <button onClick={() => acknowledge(alertData._id)} style={{ background: NB.red, color: NB.white, border: `2px solid ${NB.black}`, padding: '4px 10px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit', animation: 'pulse-red 1.5s infinite' }}>
                            <CheckCircle size={12} /> ACK
                          </button>
                        )}
                        {a.is_acknowledged && <span style={{ fontSize: '0.65rem', color: NB.mint, fontWeight: 700 }}>✅ Ack'd</span>}
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: NB.white, border: `4px solid ${NB.red}`, boxShadow: `8px 8px 0 ${NB.red}`, padding: '40px', maxWidth: 480, width: '90%', textAlign: 'center', animation: 'pulse-red 1s infinite' }}>
            <AlertTriangle size={48} color={NB.red} style={{ marginBottom: 16 }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: NB.red, margin: '0 0 12px', fontFamily: "'Space Grotesk', sans-serif" }}>🚨 CRITICAL ALERT</h2>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 12px', fontFamily: "'Space Grotesk', sans-serif" }}>{criticalAlert.alert.title}</h3>
            <p style={{ fontSize: '0.92rem', color: '#333', lineHeight: 1.6, margin: '0 0 24px', fontWeight: 500 }}>{criticalAlert.alert.message}</p>
            <button onClick={() => acknowledge(criticalAlert.alert._id)}
              style={{ background: NB.red, color: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '14px 28px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={18} /> I Acknowledge This Alert
            </button>
          </div>
        </div>
      )}
    </>
  );
}
