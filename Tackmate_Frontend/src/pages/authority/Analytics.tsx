import { useState, useEffect } from 'react';
import { Calendar, Download, RefreshCw, Loader2, AlertCircle, Activity, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

export default function AuthorityAnalytics() {
  const { } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidentStats, setIncidentStats] = useState<any>(null);
  const [touristStats, setTouristStats] = useState<any>(null);
  const [zoneStats, setZoneStats] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  const [reportLoading, setReportLoading] = useState(false);
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSections, setReportSections] = useState({ incidents: true, zones: true });

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true); setError(null);
      const [incRes, tourRes, zoneRes, sumRes] = await Promise.all([api.get('/analytics/incidents'), api.get('/analytics/tourists'), api.get('/analytics/zones'), api.get('/analytics/summary')]);
      if (incRes.data.success) setIncidentStats(incRes.data.data);
      if (tourRes.data.success) setTouristStats(tourRes.data.data);
      if (zoneRes.data.success) setZoneStats(zoneRes.data.data);
      if (sumRes.data.success) setSummary(sumRes.data.data);
    } catch { setError('Connection error. Data may be stale.'); } finally { setLoading(false); }
  };

  if (loading && !summary) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
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
    { title: 'Total Users', value: summary?.totalUsers || 0, icon: <Users size={20} />, accent: NB.blue, trend: '+4%', pos: true },
    { title: 'Active Crises', value: summary?.openIncidents || 0, icon: <Activity size={20} />, accent: NB.red, trend: '-12%', pos: false },
    { title: 'SOS (1h)', value: summary?.sosLastHour || 0, icon: <AlertCircle size={20} />, accent: '#FF0033', trend: 'Critical', pos: false },
    { title: 'Live Connections', value: summary?.activeUsersToday || 0, icon: <RefreshCw size={20} />, accent: NB.mint, trend: 'Stable', pos: true },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
      <AuthoritySidebar />
      <main className="page-with-sidebar" style={{ flex: 1, padding: '28px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: NB.black, margin: 0, letterSpacing: '-0.01em' }}>Safety Analytics</h1>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Crisis Metrics & Trends</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <Calendar size={14} /> Last 30 Days
            </div>
            <button onClick={fetchAnalytics} style={{ background: NB.yellow, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '8px 16px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#FFF8E0', border: `3px solid ${NB.orange}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem', fontWeight: 600, color: NB.black }}>
            <AlertCircle size={16} color={NB.orange} /> {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid-4 responsive-grid" style={{ gap: 16, marginBottom: 28 }}>
          {summaryCards.map((s, i) => (
            <div key={i} style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, borderTop: `6px solid ${s.accent}`, padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: s.accent, border: `2px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.accent === NB.yellow ? NB.black : NB.white }}>{s.icon}</div>
                <span style={{ padding: '2px 8px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', background: s.pos ? 'rgba(0,208,132,0.15)' : 'rgba(255,59,59,0.15)', color: s.pos ? NB.mint : NB.red, border: `1.5px solid ${s.pos ? NB.mint : NB.red}` }}>{s.trend}</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: NB.black, lineHeight: 1 }}>{s.value}</div>
              <p style={{ margin: '6px 0 0', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6B6B6B' }}>{s.title}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Incident bar chart */}
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: NB.black, margin: 0 }}>Incident Distribution (Last 15 Days)</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 700, color: NB.red }}><div style={{ width: 10, height: 10, background: NB.red }} /> Critical</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.68rem', fontWeight: 700, color: NB.blue }}><div style={{ width: 10, height: 10, background: NB.blue }} /> Warning</div>
              </div>
            </div>
            <div style={{ height: 160, display: 'flex', alignItems: 'flex-end', gap: 4 }}>
              {incidentStats?.byDay?.slice(-15).map((d: any, i: number) => {
                const maxCount = Math.max(...(incidentStats.byDay.map((x: any) => x.count) || [1]), 1);
                const pct = (d.count / maxCount) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', background: i % 2 === 0 ? NB.red : NB.blue, height: `${Math.max(pct, 4)}%`, border: `1.5px solid ${NB.black}`, transition: 'height 0.3s' }} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#6B6B6B', transform: 'rotate(45deg)', whiteSpace: 'nowrap' }}>{d._id?.date?.split('-').slice(1).join('/') || i}</span>
                  </div>
                );
              }) || <p style={{ color: '#9A9A9A', fontSize: '0.88rem', margin: 'auto', fontWeight: 600 }}>No data available</p>}
            </div>
          </div>

          {/* Zone Risk */}
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: NB.black, margin: '0 0 20px' }}>Zone Risk Assessment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {zoneStats?.slice(0, 5).map((z: any, i: number) => {
                const riskColor = z.risk_level === 'high' ? NB.red : z.risk_level === 'medium' ? NB.orange : NB.mint;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: NB.black }}>{z.name}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', background: riskColor, color: z.risk_level === 'medium' ? NB.white : NB.black, border: `1.5px solid ${NB.black}` }}>{z.risk_level}</span>
                    </div>
                    <div style={{ height: 8, background: NB.cream, border: `1.5px solid ${NB.black}` }}>
                      <div style={{ height: '100%', background: riskColor, width: `${Math.min(z.active_incidents * 20, 100)}%`, transition: 'width 0.4s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, fontSize: '0.68rem', fontWeight: 600, color: '#6B6B6B' }}>
                      <span>{z.active_incidents} Active</span><span>Score: {100 - z.active_incidents * 10}%</span>
                    </div>
                  </div>
                );
              }) || <p style={{ color: '#9A9A9A', fontWeight: 600 }}>No zone data</p>}
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Tourist load */}
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px' }}>
            <h3 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: NB.black, margin: '0 0 20px' }}>Tourist Load (Last 7 Days)</h3>
            <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              {touristStats?.daily?.slice(-7).map((d: any, i: number) => {
                const maxCount = Math.max(...(touristStats.daily.map((x: any) => x.count || 0) || [1]), 1);
                const pct = ((d.count || 0) / maxCount) * 100;
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: '100%', background: NB.yellow, border: `2px solid ${NB.black}`, height: `${Math.max(pct, 5)}%` }} />
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#6B6B6B' }}>{d.date?.split('-')[2] || i + 1}</span>
                  </div>
                );
              }) || <p style={{ color: '#9A9A9A', fontWeight: 600, margin: 'auto' }}>No data</p>}
            </div>
          </div>

          {/* Export */}
          <div style={{ background: NB.black, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, background: NB.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Download size={24} color={NB.black} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: NB.white, margin: 0 }}>System Integrity Export</h4>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)', margin: 0 }}>Customize and download official audit reports.</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: NB.white, marginBottom: 4 }}>Start Date (Optional)</label>
                <input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: NB.white, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: NB.white, marginBottom: 4 }}>End Date (Optional)</label>
                <input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: NB.white, fontFamily: 'inherit' }} />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: NB.white, cursor: 'pointer' }}>
                <input type="checkbox" checked={reportSections.incidents} onChange={(e) => setReportSections(s => ({...s, incidents: e.target.checked}))} /> Incidents
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: NB.white, cursor: 'pointer' }}>
                <input type="checkbox" checked={reportSections.zones} onChange={(e) => setReportSections(s => ({...s, zones: e.target.checked}))} /> Zones
              </label>
            </div>

            <button 
              onClick={generateAuditReport}
              disabled={reportLoading}
              style={{ background: NB.yellow, border: `3px solid ${NB.yellow}`, boxShadow: `3px 3px 0 rgba(255,229,0,0.3)`, padding: '12px 28px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', color: NB.black, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: reportLoading ? 0.7 : 1 }}
            >
              {reportLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} 
              {reportLoading ? 'Generating...' : 'Download Audit PDF'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
