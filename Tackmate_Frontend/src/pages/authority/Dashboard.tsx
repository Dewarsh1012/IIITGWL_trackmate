import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../lib/api';
import { 
  AlertTriangle, RefreshCw, Loader2,
  TrendingUp
} from "lucide-react";

export default function AuthorityDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalUsers: 0,
    openIncidents: 0,
    sosLastHour: 0,
    activeUsersToday: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 60 seconds as fallback
    const interval = setInterval(fetchDashboardData, 60000);

    if (socket) {
        socket.on('new-incident', (incident: any) => {
            console.log('Live Incident Received:', incident);
            setIncidents(prev => [incident, ...prev.slice(0, 9)]);
            // Update summary if needed, or just re-fetch
            fetchDashboardData();
        });
    }

    return () => {
        clearInterval(interval);
        if (socket) socket.off('new-incident');
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      const [incidentsRes, summaryRes] = await Promise.all([
        api.get('/incidents?limit=10'),
        api.get('/analytics/summary')
      ]);
      
      if (incidentsRes.data.success) {
        setIncidents(incidentsRes.data.data);
      }
      
      if (summaryRes.data.success) {
        setSummary(summaryRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-amber-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'sos_panic': return 'sos';
      case 'ai_anomaly': return 'smart_toy';
      case 'resident_report': return 'forum';
      default: return 'report';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0F1E] text-slate-100 font-['Public_Sans',_sans-serif]">
      {/* Left Sidebar */}
      <aside className="w-[240px] bg-[#0A0F1E] border-r border-[#1E293B] flex flex-col h-full z-20 shrink-0">
        <div className="p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-1 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl leading-none m-0">shield_person</span>
            </div>
            <div>
              <h1 className="text-white text-lg font-bold leading-none m-0">SafeTravel</h1>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold m-0 mt-1">v3.0 Command Center</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-[#0F172A] rounded-xl border border-[#1E293B]">
            <div className="size-10 rounded-full bg-slate-700 flex items-center justify-center border border-[#1E293B]">
              <span className="font-bold text-slate-300">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || 'KD'}
              </span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <p className="text-white text-sm font-semibold m-0 truncate">{user?.full_name || 'Inspector K. Das'}</p>
              <p className="text-primary text-[10px] font-bold m-0 leading-tight">{user?.designation || 'Special Duty'}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white no-underline" href="/authority/dashboard">
              <span className="material-symbols-outlined text-[20px] m-0">dashboard</span>
              <span className="text-sm font-medium">Dashboard</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" href="#">
              <span className="material-symbols-outlined text-[20px] m-0">report_problem</span>
              <span className="text-sm font-medium">Incidents</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" href="#">
              <span className="material-symbols-outlined text-[20px] m-0">group</span>
              <span className="text-sm font-medium">Tourist Roster</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" href="#">
              <span className="material-symbols-outlined text-[20px] m-0">house</span>
              <span className="text-sm font-medium">Residents</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" href="#">
              <span className="material-symbols-outlined text-[20px] m-0">business_center</span>
              <span className="text-sm font-medium">Businesses</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" href="#">
              <span className="material-symbols-outlined text-[20px] m-0">map</span>
              <span className="text-sm font-medium">Zone Management</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" href="/authority/efir">
              <span className="material-symbols-outlined text-[20px] m-0">description</span>
              <span className="text-sm font-medium">E-FIR System</span>
            </a>
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" href="/authority/analytics">
              <span className="material-symbols-outlined text-[20px] m-0">bar_chart</span>
              <span className="text-sm font-medium">Analytics</span>
            </a>
            
            <div className="my-2 border-t border-[#1E293B]"></div>
            
            <a className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" href="#">
              <span className="material-symbols-outlined text-[20px] m-0">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </a>
          </nav>
        </div>
        <div className="mt-auto p-4">
          <button className="w-full py-2 bg-red-500/10 text-red-500 rounded-lg text-xs font-bold border border-red-500/20 outline-none hover:bg-red-500/20 transition-colors">
            EMERGENCY OVERRIDE
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#0A0F1E]">
        {/* Top Stats Row */}
        <div className="p-4 grid grid-cols-4 gap-4">
          <div className="bg-[#1E293B]/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 border-l-4 border-l-primary">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-tight m-0">Active Users</p>
                <h3 className="text-2xl font-bold m-0 mt-1 text-white">{summary.activeUsersToday}</h3>
              </div>
              <span className="material-symbols-outlined text-primary bg-primary/20 p-2 rounded-lg m-0 leading-none">person_pin_circle</span>
            </div>
            <div className="mt-2 text-[10px] text-green-400 flex items-center gap-1">
              <TrendingUp className="size-3" /> Real-time tracking active
            </div>
          </div>
          
          <div className="bg-[#1E293B]/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 border-l-4 border-l-red-600">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-tight m-0">Open Incidents</p>
                <h3 className="text-2xl font-bold m-0 mt-1 text-red-500">{summary.openIncidents}</h3>
              </div>
              <span className="material-symbols-outlined text-red-500 bg-red-500/20 p-2 rounded-lg m-0 leading-none">warning</span>
            </div>
            <div className="mt-2 text-[10px] text-red-400 flex items-center gap-1">
              <AlertTriangle className="size-3" /> Needs Attention
            </div>
          </div>
          
          <div className="bg-[#1E293B]/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 border-l-4 border-l-red-500 relative overflow-hidden">
            <div className={`absolute inset-0 bg-red-500/5 ${summary.sosLastHour > 0 ? 'animate-pulse' : ''}`}></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-tight m-0">SOS (Last Hr)</p>
                <h3 className="text-2xl font-bold m-0 mt-1 text-red-400">{summary.sosLastHour}</h3>
              </div>
              <span className={`material-symbols-outlined text-red-500 bg-red-500/30 p-2 rounded-lg m-0 leading-none ${summary.sosLastHour > 0 ? 'animate-bounce' : ''}`}>sos</span>
            </div>
            <div className="mt-2 text-[10px] text-red-500 font-bold flex items-center gap-1 relative z-10">
              {summary.sosLastHour > 0 ? (
                <><span className="size-1.5 rounded-full bg-red-500"></span> IMMEDIATE RESPONSE REQ.</>
              ) : (
                <><span className="size-1.5 rounded-full bg-slate-500"></span> No active panics</>
              )}
            </div>
          </div>
          
          <div className="bg-[#1E293B]/40 backdrop-blur-sm p-4 rounded-xl border border-white/5 border-l-4 border-l-amber-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-tight m-0">Total Profiles</p>
                <h3 className="text-2xl font-bold m-0 mt-1 text-amber-500">{summary.totalUsers}</h3>
              </div>
              <span className="material-symbols-outlined text-amber-500 bg-amber-500/20 p-2 rounded-lg m-0 leading-none">gpp_maybe</span>
            </div>
            <div className="mt-2 text-[10px] text-amber-400 flex items-center gap-1">
              Verified System Database
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="flex-1 px-4 pb-4 flex flex-col min-h-0">
          <div className="w-full h-full rounded-xl relative overflow-hidden border border-[#1E293B]" style={{ background: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0a0f1e 100%)' }}>
            <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200')] bg-cover bg-center mix-blend-overlay"></div>
            
            <div className="absolute inset-0 p-8 pointer-events-none">
              <svg className="w-full h-full opacity-20" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M20,20 L50,15 L80,30 L70,70 L30,80 Z" fill="#1a57db" stroke="#1a57db" strokeWidth="0.5"></path>
                <path d="M10,60 L30,55 L40,85 L15,90 Z" fill="#ef4444" stroke="#ef4444" strokeWidth="0.5"></path>
              </svg>
            </div>

            <div className="absolute top-4 left-4 flex gap-2">
              <div className="bg-[#0F172A]/90 backdrop-blur rounded-lg border border-[#1E293B] p-1 flex shadow-xl">
                <button className="px-4 py-1.5 rounded-md bg-primary text-white text-xs font-semibold outline-none border-none">Standard</button>
                <button className="px-4 py-1.5 rounded-md text-slate-400 text-xs font-semibold hover:text-white outline-none border-none bg-transparent">Satellite</button>
                <button className="px-4 py-1.5 rounded-md text-slate-400 text-xs font-semibold hover:text-white outline-none border-none bg-transparent">Heatmap</button>
              </div>
              <div className="bg-[#0F172A]/90 backdrop-blur rounded-lg border border-[#1E293B] p-1 flex shadow-xl">
                <button className="size-8 flex items-center justify-center text-slate-300 hover:text-white border-r border-[#1E293B] bg-transparent outline-none m-0 p-0"><span className="material-symbols-outlined text-sm m-0 leading-none">add</span></button>
                <button className="size-8 flex items-center justify-center text-slate-300 hover:text-white bg-transparent outline-none border-none m-0 p-0"><span className="material-symbols-outlined text-sm m-0 leading-none">remove</span></button>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 bg-[#1E293B]/40 backdrop-blur-sm border border-white/5 p-3 rounded-lg flex flex-col gap-2 min-w-[140px]">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0 text-left">Map Legend</h4>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-primary"></span> Resident
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-green-500"></span> Tourist
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-red-500"></span> SOS Active
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="size-2 rounded-full bg-amber-400"></span> Zone Breach
              </div>
            </div>

            <div className="absolute top-4 right-4 w-64">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg m-0 leading-none">search</span>
                <input className="w-full bg-[#0F172A]/90 backdrop-blur border border-[#1E293B] rounded-lg pl-10 pr-3 py-2 text-xs text-white focus:ring-primary focus:border-primary outline-none" placeholder="Search coordinates or zones..." type="text" />
              </div>
            </div>
          </div>
        </div>

        {/* Live Alert Feed */}
        <div className="px-4 pb-4 flex flex-col h-[280px] shrink-0">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-white text-lg font-bold flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-primary m-0 leading-none">sensors</span>
              Live Alert Feed
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={fetchDashboardData}
                className="size-8 flex items-center justify-center bg-[#0F172A] border border-[#1E293B] rounded text-slate-400 hover:text-white transition-all"
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button className="text-xs bg-[#0F172A] border border-[#1E293B] px-3 py-1.5 rounded text-slate-400 hover:text-white outline-none">Filter</button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto rounded-xl border border-[#1E293B] bg-[#0F172A]/30">
            {loading && incidents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3">
                <Loader2 className="animate-spin size-8" />
                <p className="text-sm font-mono tracking-widest">CONNECTING TO NODE FEED...</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#0F172A] z-10 border-b border-[#1E293B]">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Severity</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Source</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Incident Title</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reporter</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]/50">
                  {incidents.map((incident) => (
                    <tr key={incident._id} className={`transition-colors`}>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`material-symbols-outlined text-lg m-0 leading-none ${
                          incident.source === 'sos_panic' ? 'text-red-500' :
                          incident.source === 'ai_anomaly' ? 'text-primary' :
                          'text-slate-400'
                        }`}>
                          {getSourceIcon(incident.source)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-white m-0">{incident.title}</p>
                        <p className="text-[10px] text-slate-500 m-0 mt-0.5">
                          {incident.zone?.name || 'Unknown Location'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-slate-300 m-0">{incident.reporter?.full_name || 'System'}</p>
                        <p className="text-[9px] text-slate-500 font-mono m-0">{incident.reporter?.blockchain_id || 'LOCAL-AI'}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="px-3 py-1 rounded bg-primary text-white text-[10px] font-bold outline-none border-none hover:bg-primary/80 transition-all">Acknowledge</button>
                          <button className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-bold outline-none border-none hover:bg-slate-700 hover:text-white transition-all">Assign</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {incidents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-slate-500 italic text-sm">
                        No active incidents detected in this sector.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
