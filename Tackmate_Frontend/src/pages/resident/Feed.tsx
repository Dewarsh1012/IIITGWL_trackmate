import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import TouristMap, { type ZoneData } from '../../components/maps/TouristMap';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard } from '../../theme/clayTheme';

export default function ResidentFeed() {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [loading, setLoading] = useState(true);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [zones, setZones] = useState<ZoneData[]>([]);
    const [wardData, setWardData] = useState<any>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const wardId = typeof user?.ward === 'object' ? user?.ward?._id : user?.ward;
            const [incRes, zonesRes, wardRes] = await Promise.all([
                api.get(wardId ? `/incidents?ward=${wardId}&limit=20` : '/incidents?limit=20'),
                api.get('/zones'),
                wardId ? api.get(`/wards/${wardId}`) : Promise.resolve({ data: { success: false } }),
            ]);
            if (incRes.data.success) setIncidents(incRes.data.data || []);
            if (zonesRes.data.success) setZones(zonesRes.data.data || []);
            if (wardRes.data?.success) setWardData(wardRes.data.data);
        } catch {
            setIncidents([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user?.ward]);

    useEffect(() => {
        if (!socket) return;
        const handler = (incident: any) => {
            setIncidents(prev => [incident, ...prev].slice(0, 20));
        };
        socket.on('new-incident', handler);
        return () => { socket.off('new-incident', handler); };
    }, [socket]);

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
                <Loader2 size={32} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 24, paddingBottom: 100 }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                <div style={{ ...clayCard, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <h2 style={{ margin: 0, fontWeight: 800, color: C.text }}>Incident Feed</h2>
                            <p style={{ margin: 0, color: C.textMuted, fontSize: '0.78rem' }}>{wardData?.name || 'All wards'} · Live updates</p>
                        </div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.primary }}>{incidents.length} events</span>
                    </div>
                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {incidents.length > 0 ? incidents.map((inc) => (
                            <div key={inc._id} style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: C.surfaceAlt, padding: '12px 14px', display: 'flex', gap: 10 }}>
                                <AlertTriangle size={16} color={inc.severity === 'critical' ? C.high : C.moderate} style={{ marginTop: 2 }} />
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: '0.86rem' }}>{inc.title}</p>
                                    <p style={{ margin: '4px 0 0', color: C.textMuted, fontSize: '0.72rem' }}>{inc.description || inc.zone?.name || 'Incident reported'}</p>
                                </div>
                            </div>
                        )) : (
                            <div style={{ padding: 24, border: `2px dashed ${C.border}`, borderRadius: 14, textAlign: 'center', color: C.textMuted, fontWeight: 600 }}>No incidents yet.</div>
                        )}
                    </div>
                </div>

                <div style={{ ...clayCard, padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, background: C.surfaceAlt }}>
                        <h3 style={{ margin: 0, fontWeight: 800, color: C.text }}>Live Zone Map</h3>
                        <p style={{ margin: '4px 0 0', color: C.textMuted, fontSize: '0.72rem' }}>Tap a zone for details</p>
                    </div>
                    <div style={{ height: 320 }}>
                        <TouristMap
                            lat={wardData?.center_lat || null}
                            lng={wardData?.center_lng || null}
                            zones={zones}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
