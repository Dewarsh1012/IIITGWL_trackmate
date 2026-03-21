import { useState, useEffect } from 'react';
import { 
  Calendar, Download, RefreshCw, 
  Loader2, AlertCircle, Activity, Shield, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Link } from 'react-router-dom';

export default function AuthorityAnalytics() {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [incidentStats, setIncidentStats] = useState<any>(null);
  const [touristStats, setTouristStats] = useState<any>(null);
  const [zoneStats, setZoneStats] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [incRes, tourRes, zoneRes, sumRes] = await Promise.all([
        api.get('/analytics/incidents'),
        api.get('/analytics/tourists'),
        api.get('/analytics/zones'),
        api.get('/analytics/summary')
      ]);

      if (incRes.data.success) setIncidentStats(incRes.data.data);
      if (tourRes.data.success) setTouristStats(tourRes.data.data);
      if (zoneRes.data.success) setZoneStats(zoneRes.data.data);
      if (sumRes.data.success) setSummary(sumRes.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError('System connection interrupted. Some data might be stale.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0F172A]">
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-[#0F172A] font-['Public_Sans',_sans-serif] text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex flex-col min-h-screen">
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-8 py-4 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <Link to="/authority/dashboard" className="flex items-center gap-3 text-primary no-underline">
              <Shield className="size-8" />
              <h1 className="text-xl font-bold tracking-tight m-0 text-slate-900 dark:text-white italic">Trackmate Authority</h1>
            </Link>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={fetchAnalytics} className="p-2 text-slate-400 hover:text-primary transition-colors">
                <RefreshCw className={`size-5 ${loading ? 'animate-spin' : ''}`} />
             </button>
            <div className="size-10 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-300">
               {authUser?.full_name?.[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
          {error && (
            <div className="mb-6 bg-amber-500/10 border border-amber-500/50 text-amber-500 p-4 rounded-xl flex items-center gap-3 text-sm font-medium">
              <AlertCircle className="size-5" /> {error}
            </div>
          )}

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold m-0">Crisis Metrics & Trends</h2>
            <div className="bg-slate-800/50 border border-white/5 px-4 py-2 rounded-lg flex items-center gap-3">
              <Calendar className="size-4 text-primary" />
              <span className="text-sm font-bold opacity-80 uppercase tracking-widest text-[10px]">Active Window: Last 30 Days</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <StatsCard title="Total Infrastructure" value={summary?.totalUsers || 0} icon={<Users />} trend="+4%" positive />
            <StatsCard title="Active Crises" value={summary?.openIncidents || 0} icon={<Activity />} trend="-12%" positive={false} />
            <StatsCard title="SOS Alerts (1h)" value={summary?.sosLastHour || 0} icon={<AlertCircle />} trend="Critical" positive={false} critical />
            <StatsCard title="Live Connections" value={summary?.activeUsersToday || 0} icon={<RefreshCw />} trend="Stable" positive />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
            {/* Incident Trends */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 m-0">Incident Distribution Trends</h3>
                <div className="flex gap-4">
                   <div className="flex items-center gap-2 text-[10px] font-bold"><span className="size-2 rounded-full bg-red-500"></span> CRITICAL</div>
                   <div className="flex items-center gap-2 text-[10px] font-bold"><span className="size-2 rounded-full bg-blue-500"></span> WARNING</div>
                </div>
              </div>
              <div className="h-64 flex items-end gap-2 group">
                {incidentStats?.byDay?.slice(-15).map((d: any, i: number) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                    <div className="w-full relative h-full flex items-end gap-0.5">
                      <div className="flex-1 bg-red-500/20 hover:bg-red-500 transition-colors rounded-t-sm" style={{ height: `${(d.count / (incidentStats.byDay[0]?.count || 10)) * 100}%` }}></div>
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 rotate-45 mt-2">{d._id.date.split('-').slice(1).join('/')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Risks */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 m-0">Zone Risk Assessment</h3>
               <div className="space-y-6">
                 {zoneStats?.slice(0, 5).map((z: any, i: number) => (
                   <div key={i} className="space-y-2">
                     <div className="flex justify-between items-center text-sm">
                       <span className="font-bold">{z.name}</span>
                       <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                         z.risk_level === 'high' ? 'bg-red-500/10 text-red-500' : 
                         z.risk_level === 'medium' ? 'bg-amber-500/10 text-amber-500' : 
                         'bg-green-500/10 text-green-500'
                       }`}>{z.risk_level}</span>
                     </div>
                     <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div className={`h-full transition-all duration-1000 ${
                         z.risk_level === 'high' ? 'bg-red-500' : 
                         z.risk_level === 'medium' ? 'bg-amber-500' : 
                         'bg-green-500'
                       }`} style={{ width: `${z.active_incidents * 20}%` }}></div>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-slate-500">
                       <span>{z.active_incidents} Active Alerts</span>
                       <span>Score: {100 - (z.active_incidents * 10)}%</span>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
               <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8 m-0">Tourist Load (Last 7 Days)</h3>
               <div className="h-48 flex items-end gap-3">
                 {touristStats?.daily?.slice(-7).map((d: any, i: number) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-3">
                     <div className="w-full bg-primary/10 hover:bg-primary/40 transition-all rounded-xl" style={{ height: `${(d.count / (touristStats.totalTourists || 100)) * 100}%` }}></div>
                     <span className="text-[10px] font-bold text-slate-500">{d.date.split('-')[2]}</span>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm flex flex-col justify-center">
               <div className="text-center space-y-4">
                 <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                   <Download className="text-primary size-8" />
                 </div>
                 <h4 className="text-xl font-bold">System Integrity Export</h4>
                 <p className="text-sm text-slate-500 max-w-xs mx-auto">Generate a cryptographic snapshot of current system metrics for official audit.</p>
                 <button className="bg-primary text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Download Audit PDF</button>
               </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, trend, positive, critical }: any) {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm relative overflow-hidden group hover:border-primary/50 transition-colors ${critical ? 'border-red-500/30' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${critical ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-3xl font-black m-0 leading-none">{value}</p>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 m-0">{title}</p>
      </div>
    </div>
  );
}
