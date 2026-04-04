import { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Loader2, AlertCircle, Activity, Users } from 'lucide-react';
import api from '../../lib/api';
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

export default function AuthorityAnalytics() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [incidentStats, setIncidentStats] = useState<any>(null);
    const [touristStats, setTouristStats] = useState<any>(null);
    const [zoneStats, setZoneStats] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [anomalyModelStatus, setAnomalyModelStatus] = useState<any>(null);
    const [modelActionLoading, setModelActionLoading] = useState(false);
    const [modelActionMessage, setModelActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [trainConfig, setTrainConfig] = useState({
        maxSamples: 500,
        iterations: 700,
        learningRate: 0.1,
    });

    const [scoreInput, setScoreInput] = useState({
        inactivityMinutes: 42,
        speedKmh: 24,
        isOutsideZone: false,
        nearbyIncidents15m: 1,
        nearbyCriticalIncidents15m: 0,
        userAnomalies24h: 0,
        ruleScore: 0.8,
    });
    const [scoreLoading, setScoreLoading] = useState(false);
    const [scoreResult, setScoreResult] = useState<any>(null);

    const [reportLoading, setReportLoading] = useState(false);
    const [reportStartDate, setReportStartDate] = useState('');
    const [reportEndDate, setReportEndDate] = useState('');
    const [reportSections, setReportSections] = useState({ incidents: true, zones: true });

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnomalyModelStatus = async () => {
        try {
            const modelRes = await api.get('/analytics/anomaly-model');
            if (modelRes.data.success) {
                setAnomalyModelStatus(modelRes.data.data);
            }
        } catch {
            // Keep page usable even if model endpoints are temporarily unavailable.
        }
    };

    const fetchAnalytics = async () => {
        try {
            setLoading(true); setError(null);
            const [incRes, tourRes, zoneRes, sumRes] = await Promise.all([api.get('/analytics/incidents'), api.get('/analytics/tourists'), api.get('/analytics/zones'), api.get('/analytics/summary')]);
            if (incRes.data.success) setIncidentStats(incRes.data.data);
            if (tourRes.data.success) setTouristStats(tourRes.data.data);
            if (zoneRes.data.success) setZoneStats(zoneRes.data.data);
            if (sumRes.data.success) setSummary(sumRes.data.data);
            await fetchAnomalyModelStatus();
        } catch { setError('Connection error. Data may be stale.'); } finally { setLoading(false); }
    };

    const trainAnomalyModel = async () => {
        try {
            setModelActionLoading(true);
            setModelActionMessage(null);
            const res = await api.post('/analytics/anomaly-model/train', {
                maxSamples: trainConfig.maxSamples,
                iterations: trainConfig.iterations,
                learningRate: trainConfig.learningRate,
            });

            if (res.data.success) {
                const data = res.data.data;
                setModelActionMessage({
                    type: 'success',
                    text: `Model ${data.modelVersion} trained: ${(Number(data.accuracy || 0) * 100).toFixed(2)}% accuracy`,
                });
                await fetchAnomalyModelStatus();
            }
        } catch {
            setModelActionMessage({ type: 'error', text: 'Model training failed. Check backend logs.' });
        } finally {
            setModelActionLoading(false);
        }
    };

    const scoreAnomalyPayload = async () => {
        try {
            setScoreLoading(true);
            setScoreResult(null);

            const res = await api.post('/analytics/anomaly-model/score', scoreInput);
            if (res.data.success) {
                setScoreResult(res.data.data);
            }
        } catch {
            setModelActionMessage({ type: 'error', text: 'Payload scoring failed. Verify model endpoint.' });
        } finally {
            setScoreLoading(false);
        }
    };

    if (loading && !summary) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite' }} />
        </div>
    );

    const generateAuditReport = async () => {
        try {
            setReportLoading(true);
            const sections = Object.entries(reportSections).filter(([_, v]) => v).map(([k]) => k);

            const res = await api.post('/reports/audit', {
                startDate: reportStartDate || undefined,
                endDate: reportEndDate || undefined,
                sections
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `TrackMate_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (err) {
            console.error(err);
            setError('Failed to generate audit report.');
        } finally {
            setReportLoading(false);
        }
    };

    const summaryCards = [
        { title: 'Total Users', value: summary?.totalUsers || 0, icon: <Users size={20} />, accent: C.primary, trend: '+4%', pos: true },
        { title: 'Active Crises', value: summary?.openIncidents || 0, icon: <Activity size={20} />, accent: C.high, trend: '-12%', pos: false },
        { title: 'SOS (1h)', value: summary?.sosLastHour || 0, icon: <AlertCircle size={20} />, accent: C.critical, trend: 'Critical', pos: false },
        { title: 'Live Connections', value: summary?.activeUsersToday || 0, icon: <RefreshCw size={20} />, accent: C.safe, trend: 'Stable', pos: true },
    ];

    const incidentByDay = incidentStats?.byDay || [];
    const touristDaily = touristStats?.daily || [];
    const zoneList = zoneStats || [];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <AuthoritySidebar />
            <main className="page-with-sidebar" style={{ flex: 1, padding: '28px' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, margin: 0, letterSpacing: '-0.01em' }}>Safety Analytics</h1>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Crisis Metrics & Trends</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.surfaceAlt, border: `1px solid ${C.border}`, boxShadow: '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)', padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.text }}>
                            <Calendar size={14} /> Last 30 Days
                        </div>
                        <button onClick={fetchAnalytics} style={{ background: C.surface, border: `1px solid ${C.border}`, boxShadow: '4px 4px 8px rgba(27,29,42,0.06), -2px -2px 6px rgba(255,255,255,0.9)', padding: '8px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, color: C.text }}>
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ background: 'rgba(248,113,113,0.08)', border: `1px solid ${C.high}40`, boxShadow: '4px 4px 10px rgba(27,29,42,0.08), -2px -2px 6px rgba(255,255,255,0.85)', padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 600, color: C.text }}>
                        <AlertCircle size={16} color={C.high} /> {error}
                    </div>
                )}

                {/* Stat cards */}
                <div className="grid-4 responsive-grid" style={{ gap: 16, marginBottom: 28 }}>
                    {summaryCards.map((s, i) => (
                        <div key={i} style={{ ...clayCard, borderTop: `4px solid ${s.accent}`, padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                                <div style={{ width: 36, height: 36, background: `${s.accent}1A`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accent }}>{s.icon}</div>
                                <span style={{ padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: s.pos ? `${C.safe}22` : `${C.high}22`, color: s.pos ? C.safe : C.high, border: `1px solid ${s.pos ? C.safe : C.high}` }}>{s.trend}</span>
                            </div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: C.text, lineHeight: 1 }}>{s.value}</div>
                            <p style={{ margin: '6px 0 0', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted }}>{s.title}</p>
                        </div>
                    ))}
                </div>

                {/* Charts row */}
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
                    {/* Incident bar chart */}
                    <div style={{ ...clayCard, padding: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text, margin: 0 }}>Incident Distribution (Last 15 Days)</h3>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 700, color: C.high }}><div style={{ width: 10, height: 10, background: C.high }} /> Critical</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 700, color: C.moderate }}><div style={{ width: 10, height: 10, background: C.moderate }} /> Warning</div>
                            </div>
                        </div>
                        <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
                            {incidentByDay.length > 0 ? incidentByDay.slice(-15).map((d: any, i: number) => {
                                const maxCount = Math.max(...incidentByDay.map((x: any) => x.count || 0), 1);
                                const pct = ((d.count || 0) / maxCount) * 100;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <div style={{ width: '100%', background: i % 2 === 0 ? C.high : C.moderate, height: `${Math.max(pct, 4)}%`, border: `1px solid ${C.border}`, transition: 'height 0.3s' }} />
                                        <span style={{ fontSize: '0.6rem', fontWeight: 700, color: C.textMuted, transform: 'rotate(45deg)', whiteSpace: 'nowrap' }}>{d._id?.date?.split('-').slice(1).join('/') || i}</span>
                                    </div>
                                );
                            }) : <p style={{ color: C.textMuted, fontSize: '0.88rem', margin: 'auto', fontWeight: 600 }}>No data available</p>}
                        </div>
                    </div>

                    {/* Zone Risk */}
                    <div style={{ ...clayCard, padding: '24px' }}>
                        <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text, margin: '0 0 20px' }}>Zone Risk Assessment</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {zoneList.length > 0 ? zoneList.slice(0, 5).map((z: any, i: number) => {
                                const riskLevel = (z.risk_level || 'low').toLowerCase();
                                const riskColor = riskLevel === 'high' ? C.high : riskLevel === 'moderate' ? C.moderate : riskLevel === 'restricted' ? C.restricted : C.safe;
                                const activeIncidents = Number(z.active_incidents || 0);
                                return (
                                    <div key={i}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.text }}>{z.name}</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', background: riskColor, color: (riskLevel === 'high' || riskLevel === 'restricted') ? '#fff' : C.text, border: `1px solid ${C.border}` }}>{riskLevel}</span>
                                        </div>
                                        <div style={{ height: 8, background: C.surfaceAlt, border: `1px solid ${C.border}` }}>
                                            <div style={{ height: '100%', background: riskColor, width: `${Math.min(activeIncidents * 20, 100)}%`, transition: 'width 0.4s' }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.68rem', fontWeight: 600, color: C.textMuted }}>
                                            <span>{activeIncidents} Active</span><span>Score: {100 - activeIncidents * 10}%</span>
                                        </div>
                                    </div>
                                );
                            }) : <p style={{ color: C.textMuted, fontWeight: 600 }}>No zone data</p>}
                        </div>
                    </div>
                </div>

                {/* Bottom row */}
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    {/* Tourist load */}
                    <div style={{ ...clayCard, padding: '24px' }}>
                        <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text, margin: '0 0 20px' }}>Tourist Load (Last 7 Days)</h3>
                        <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                            {touristDaily.length > 0 ? touristDaily.slice(-7).map((d: any, i: number) => {
                                const maxCount = Math.max(...touristDaily.map((x: any) => x.count || 0), 1);
                                const pct = ((d.count || 0) / maxCount) * 100;
                                return (
                                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                        <div style={{ width: '100%', background: C.moderate, border: `1px solid ${C.border}`, height: `${Math.max(pct, 5)}%` }} />
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: C.textMuted }}>{d.date?.split('-')[2] || i + 1}</span>
                                    </div>
                                );
                            }) : <p style={{ color: C.textMuted, fontWeight: 600, margin: 'auto' }}>No data</p>}
                        </div>
                    </div>

                    {/* Export */}
                    <div style={{ ...clayCard, padding: '32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, boxShadow: '0 6px 14px rgba(108,99,255,0.25)' }}>
                                <Download size={24} color="#FFFFFF" />
                            </div>
                            <div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: C.text, margin: 0 }}>System Integrity Export</h4>
                                <p style={{ fontSize: '0.75rem', color: C.textMuted, margin: 0 }}>Customize and download official audit reports.</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: C.textMuted, marginBottom: 4 }}>Start Date (Optional)</label>
                                <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} style={{ width: '100%', padding: '8px', background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', borderRadius: 10 }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: C.textMuted, marginBottom: 4 }}>End Date (Optional)</label>
                                <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} style={{ width: '100%', padding: '8px', background: C.surfaceAlt, border: `1px solid ${C.border}`, color: C.text, fontFamily: 'inherit', borderRadius: 10 }} />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: C.text, cursor: 'pointer' }}>
                                <input type="checkbox" checked={reportSections.incidents} onChange={(e) => setReportSections(s => ({ ...s, incidents: e.target.checked }))} /> Incidents
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: C.text, cursor: 'pointer' }}>
                                <input type="checkbox" checked={reportSections.zones} onChange={(e) => setReportSections(s => ({ ...s, zones: e.target.checked }))} /> Zones
                            </label>
                        </div>

                        <button
                            onClick={generateAuditReport}
                            disabled={reportLoading}
                            style={{ background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', boxShadow: '0 8px 18px rgba(108,99,255,0.25)', padding: '12px 28px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#FFFFFF', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: reportLoading ? 0.7 : 1, borderRadius: 12 }}
                        >
                            {reportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                            {reportLoading ? 'Generating...' : 'Download Audit PDF'}
                        </button>
                    </div>
                </div>

                {/* AI anomaly controls */}
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
                    <div style={{ ...clayCard, padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text, margin: 0 }}>Anomaly Model Control</h3>
                            <button
                                onClick={fetchAnomalyModelStatus}
                                style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', color: C.text }}
                            >
                                Refresh Status
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                            <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' }}>
                                <p style={{ margin: 0, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted, fontWeight: 700 }}>Active Model</p>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', fontWeight: 800, color: C.text }}>{anomalyModelStatus?.activeModelVersion || 'Unavailable'}</p>
                            </div>
                            <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px' }}>
                                <p style={{ margin: 0, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: C.textMuted, fontWeight: 700 }}>Training Accuracy</p>
                                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', fontWeight: 800, color: C.text }}>
                                    {anomalyModelStatus?.accuracy != null ? `${(Number(anomalyModelStatus.accuracy) * 100).toFixed(2)}%` : 'N/A'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>Max Samples</label>
                                <input
                                    type="number"
                                    min={100}
                                    max={5000}
                                    value={trainConfig.maxSamples}
                                    onChange={(e) => setTrainConfig((p) => ({ ...p, maxSamples: Number(e.target.value) || 0 }))}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>Iterations</label>
                                <input
                                    type="number"
                                    min={100}
                                    max={5000}
                                    value={trainConfig.iterations}
                                    onChange={(e) => setTrainConfig((p) => ({ ...p, iterations: Number(e.target.value) || 0 }))}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>Learning Rate</label>
                                <input
                                    type="number"
                                    min={0.0001}
                                    max={1}
                                    step="0.01"
                                    value={trainConfig.learningRate}
                                    onChange={(e) => setTrainConfig((p) => ({ ...p, learningRate: Number(e.target.value) || 0 }))}
                                    style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={trainAnomalyModel}
                            disabled={modelActionLoading}
                            style={{ background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '10px 16px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px rgba(108,99,255,0.25)', opacity: modelActionLoading ? 0.7 : 1 }}
                        >
                            {modelActionLoading ? 'Training...' : 'Train Model'}
                        </button>

                        {modelActionMessage && (
                            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 10, border: `1px solid ${modelActionMessage.type === 'success' ? C.safe : C.high}`, background: modelActionMessage.type === 'success' ? `${C.safe}1A` : `${C.high}1A`, color: modelActionMessage.type === 'success' ? C.safe : C.high, fontSize: '0.78rem', fontWeight: 700 }}>
                                {modelActionMessage.text}
                            </div>
                        )}
                    </div>

                    <div style={{ ...clayCard, padding: '24px' }}>
                        <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.text, margin: '0 0 14px' }}>Anomaly Score Sandbox</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>Inactivity (min)</label>
                                <input type="number" value={scoreInput.inactivityMinutes} onChange={(e) => setScoreInput((p) => ({ ...p, inactivityMinutes: Number(e.target.value) || 0 }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>Speed (km/h)</label>
                                <input type="number" value={scoreInput.speedKmh} onChange={(e) => setScoreInput((p) => ({ ...p, speedKmh: Number(e.target.value) || 0 }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>Nearby Incidents (15m)</label>
                                <input type="number" value={scoreInput.nearbyIncidents15m} onChange={(e) => setScoreInput((p) => ({ ...p, nearbyIncidents15m: Number(e.target.value) || 0 }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>Nearby Critical</label>
                                <input type="number" value={scoreInput.nearbyCriticalIncidents15m} onChange={(e) => setScoreInput((p) => ({ ...p, nearbyCriticalIncidents15m: Number(e.target.value) || 0 }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>User Anomalies (24h)</label>
                                <input type="number" value={scoreInput.userAnomalies24h} onChange={(e) => setScoreInput((p) => ({ ...p, userAnomalies24h: Number(e.target.value) || 0 }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.66rem', color: C.textMuted, marginBottom: 4, fontWeight: 700 }}>Rule Score</label>
                                <input type="number" min={0} max={1} step="0.01" value={scoreInput.ruleScore} onChange={(e) => setScoreInput((p) => ({ ...p, ruleScore: Number(e.target.value) || 0 }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.text, fontFamily: 'inherit' }} />
                            </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: '0.8rem', color: C.text, fontWeight: 600 }}>
                            <input type="checkbox" checked={scoreInput.isOutsideZone} onChange={(e) => setScoreInput((p) => ({ ...p, isOutsideZone: e.target.checked }))} />
                            Outside Zone
                        </label>

                        <button
                            onClick={scoreAnomalyPayload}
                            disabled={scoreLoading}
                            style={{ marginTop: 12, background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 16px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}
                        >
                            {scoreLoading ? 'Scoring...' : 'Score Payload'}
                        </button>

                        {scoreResult && (
                            <div style={{ marginTop: 12, padding: '12px', borderRadius: 10, background: C.surfaceAlt, border: `1px solid ${C.border}`, fontSize: '0.78rem', color: C.text }}>
                                <p style={{ margin: 0, fontWeight: 700 }}>Model: {scoreResult.modelVersion || 'n/a'}</p>
                                <p style={{ margin: '6px 0 0', fontWeight: 700 }}>Model Score: {(Number(scoreResult.modelScore || 0) * 100).toFixed(2)}%</p>
                                <p style={{ margin: '4px 0 0', fontWeight: 700 }}>Hybrid Score: {(Number(scoreResult.hybridScore || 0) * 100).toFixed(2)}%</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
