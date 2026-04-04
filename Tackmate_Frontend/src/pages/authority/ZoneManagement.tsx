import { useState, useEffect } from 'react';
import { MapPin, Loader2, Activity, Shield, Users, Clock } from 'lucide-react';
import api from '../../lib/api';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard, CLAY_CARD_INNER_STYLE as clayCardInner } from '../../theme/clayTheme';

const riskColor = (level: string) => {
    switch (level?.toUpperCase()) {
        case 'CRITICAL': return C.critical;
        case 'HIGH': return C.high;
        case 'MODERATE': return C.moderate;
        default: return C.safe;
    }
};

export default function AuthorityZones() {
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState<any[]>([]);
    const [safeHouseRequests, setSafeHouseRequests] = useState<any[]>([]);

    useEffect(() => { fetchZones(); }, []);

    const fetchZones = async () => {
        try {
            const [zonesRes, shRes] = await Promise.all([
                api.get('/zones'),
                api.get('/incidents?incident_type=safe_house_request&limit=50').catch(() => ({ data: { success: false, data: [] } })),
            ]);
            if (zonesRes.data.success) setZones(zonesRes.data.data);
            if (shRes.data.success) setSafeHouseRequests(shRes.data.data || []);
        } catch {
            console.error('Failed to fetch zones');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', background: C.bg }}>
                <AuthoritySidebar />
                <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
                </main>
            </div>
        );
    }

    const summary = [
        { label: 'Total Zones', value: zones.length, color: C.primary },
        { label: 'High Risk', value: zones.filter((z) => ['CRITICAL', 'HIGH'].includes(z.risk_level?.toUpperCase())).length, color: C.high },
        { label: 'Safe Zones', value: zones.filter((z) => !['CRITICAL', 'HIGH'].includes(z.risk_level?.toUpperCase())).length, color: C.safe },
        { label: 'Safe House Requests', value: safeHouseRequests.length, color: C.moderate },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1 }}>
                <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '16px 28px', boxShadow: '0 2px 12px rgba(27,29,42,0.04)' }}>
                    <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: C.text }}>Zone Management</h1>
                    <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: C.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk zoning and safe-house request intelligence</p>
                </div>

                <div className="grid-4 responsive-grid" style={{ gap: 16, padding: '20px 28px 0' }}>
                    {summary.map((item) => (
                        <div key={item.label} style={{ ...clayCard, padding: '16px 18px', borderTop: `4px solid ${item.color}` }}>
                            <p style={{ margin: 0, fontSize: '0.68rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{item.label}</p>
                            <p style={{ margin: '6px 0 0', fontSize: '1.9rem', lineHeight: 1, fontWeight: 800, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.value}</p>
                        </div>
                    ))}
                </div>

                <div className="responsive-grid" style={{ padding: '20px 28px 28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
                    {zones.length === 0 ? (
                        <div style={{ ...clayCard, gridColumn: '1 / -1', padding: 40, textAlign: 'center', color: C.textMuted, fontWeight: 600 }}>No operational zones established.</div>
                    ) : zones.map((zone) => {
                        const rc = riskColor(zone.risk_level);
                        const isSafeZone = zone.risk_level?.toLowerCase() === 'safe' || zone.risk_level?.toLowerCase() === 'moderate';
                        const zoneRequests = safeHouseRequests.filter((sh) => sh.description?.toLowerCase().includes(zone.name?.toLowerCase()));

                        return (
                            <div key={zone._id} style={{ ...clayCard, padding: 18, borderTop: `4px solid ${rc}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                        <div style={{ width: 30, height: 30, borderRadius: 10, background: `${rc}20`, color: rc, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <MapPin size={15} />
                                        </div>
                                        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{zone.name}</h3>
                                    </div>
                                    <span style={{ padding: '3px 8px', borderRadius: 999, background: `${rc}1f`, border: `1px solid ${rc}55`, color: rc, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>{zone.risk_level || 'LOW'}</span>
                                </div>

                                <p style={{ margin: '0 0 12px', fontSize: '0.8rem', lineHeight: 1.5, color: C.textSecondary }}>{zone.description || 'Geofenced operational sector.'}</p>

                                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                    <div style={{ ...clayCardInner, padding: '10px 12px' }}>
                                        <p style={{ margin: 0, fontSize: '0.62rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Active Incidents</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '1.2rem', lineHeight: 1, fontWeight: 800, color: rc, fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={14} /> {zone.active_incidents_count || 0}</p>
                                    </div>
                                    <div style={{ ...clayCardInner, padding: '10px 12px' }}>
                                        <p style={{ margin: 0, fontSize: '0.62rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Safety Index</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '1.2rem', lineHeight: 1, fontWeight: 800, color: C.text, fontFamily: "'JetBrains Mono', monospace", display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={14} /> {zone.safety_score || 100}%</p>
                                    </div>
                                </div>

                                {isSafeZone && (
                                    <div style={{ marginTop: 12 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <p style={{ margin: 0, fontSize: '0.66rem', color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}><Users size={12} /> Safe House Requests</p>
                                            {zoneRequests.length > 0 && (
                                                <span style={{ padding: '2px 8px', borderRadius: 999, background: `${C.primary}1f`, border: `1px solid ${C.primary}55`, color: C.primary, fontSize: '0.62rem', fontWeight: 800 }}>{zoneRequests.length}</span>
                                            )}
                                        </div>
                                        {zoneRequests.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 124, overflowY: 'auto' }}>
                                                {zoneRequests.slice(0, 5).map((req) => (
                                                    <div key={req._id} style={{ ...clayCardInner, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{ width: 24, height: 24, borderRadius: 8, background: `${C.primary}22`, color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 800, flexShrink: 0 }}>
                                                            {req.reporter?.full_name?.charAt(0) || '?'}
                                                        </div>
                                                        <div style={{ minWidth: 0, flex: 1 }}>
                                                            <p style={{ margin: 0, fontSize: '0.74rem', fontWeight: 700, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{req.reporter?.full_name || 'Unknown'}</p>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.64rem', color: C.textMuted, flexShrink: 0 }}>
                                                            <Clock size={10} />
                                                            {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p style={{ margin: 0, fontSize: '0.72rem', color: C.textMuted, fontStyle: 'italic' }}>No requests for this zone.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
