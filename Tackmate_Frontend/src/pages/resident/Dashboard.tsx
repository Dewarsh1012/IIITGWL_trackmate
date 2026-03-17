import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';
import { 
  Shield, AlertTriangle, 
  Clock, TrendingUp,
  Plus, Navigation, Layers, 
  Activity, Loader2, Users
} from 'lucide-react';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [wardData, setWardData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (user?.ward) {
      fetchWardData();
      const interval = setInterval(fetchWardData, 60000);

      if (socket) {
        const wardId = typeof user.ward === 'object' ? user.ward._id : user.ward;
        // The SocketProvider already joined the room, now we just listen
        socket.on('new-incident', (incident: any) => {
            // Check if incident belongs to this ward
            const incWardId = typeof incident.ward === 'object' ? incident.ward?._id : incident.ward;
            if (incWardId === wardId) {
                setIncidents(prev => [incident, ...prev.slice(0, 9)]);
            }
        });
      }

      return () => {
        clearInterval(interval);
        if (socket) socket.off('new-incident');
      };
    }
  }, [user, socket]);

  const fetchWardData = async () => {
    try {
      // Use user's ward ID from profile
      const wardId = typeof user?.ward === 'object' ? user.ward._id : user?.ward;
      
      const [wardRes, incidentsRes, analyticsRes] = await Promise.all([
        api.get(`/wards/${wardId}`),
        api.get(`/incidents?ward=${wardId}&limit=5`),
        api.get(`/analytics/ward/${wardId}`)
      ]);

      if (wardRes.data.success) setWardData(wardRes.data.data);
      if (incidentsRes.data.success) setIncidents(incidentsRes.data.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
    } catch (err) {
      console.error('Failed to fetch resident dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/50';
      case 'high': return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/50';
      default: return 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/50';
    }
  };

  if (loading && !wardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden font-['Public_Sans',_sans-serif] text-slate-900 dark:text-slate-100 bg-background-light dark:bg-background-dark">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">
                {wardData?.name || 'Local'} Ward Overview
              </h2>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 m-0 mt-1">
                <Clock className="size-3" /> 
                Live Monitoring • {wardData?.district}, {wardData?.state}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className={`text-sm font-semibold flex items-center justify-end gap-1 m-0 ${
                  (analytics?.safety_score || 85) > 80 ? 'text-green-500' : 'text-amber-500'
                }`}>
                  <TrendingUp className="size-4" /> Healthy
                </p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold m-0 mt-1">Community Score</p>
              </div>
              <div className="relative flex items-center justify-center">
                <svg className="size-20 transform -rotate-90">
                  <circle className="text-slate-100 dark:text-slate-800" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="8"></circle>
                  <circle 
                    className={`${(analytics?.safety_score || 85) > 80 ? 'text-green-500' : 'text-amber-500'} transition-all duration-1000`} 
                    cx="40" cy="40" 
                    fill="transparent" r="34" 
                    stroke="currentColor" 
                    strokeWidth="8"
                    strokeDasharray="213.6"
                    strokeDashoffset={213.6 - (213.6 * (analytics?.safety_score || 85) / 100)}
                  ></circle>
                </svg>
                <span className="absolute text-xl font-black text-slate-800 dark:text-white">{analytics?.safety_score || 85}</span>
              </div>
            </div>
          </div>
          <div className="bg-primary rounded-xl shadow-lg shadow-primary/20 p-6 flex flex-col justify-between text-white">
            <div className="flex justify-between items-start">
              <Users className="size-8 opacity-80" />
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest text-[9px]">Verified Residents</span>
            </div>
            <div>
              <p className="text-2xl font-bold m-0">{analytics?.resident_count || 42}</p>
              <p className="text-sm opacity-90 m-0 mt-1">Active Circle</p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[400px] relative">
          {/* Static Map Placeholder with interactive glow */}
          <div className="absolute inset-0 z-0 bg-slate-200 dark:bg-slate-800" style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200')", 
            backgroundSize: "cover", 
            backgroundPosition: "center", 
            opacity: 0.3 
          }}>
            <div className="absolute inset-10 border-2 border-dashed border-primary/20 rounded-[2rem] pointer-events-none"></div>
            {incidents.slice(0, 3).map((inc, i) => (
              <div 
                key={inc._id}
                className={`absolute size-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer animate-pulse`}
                style={{ 
                  top: `${20 + (i * 25)}%`, 
                  left: `${30 + (i * 20)}%`,
                  backgroundColor: inc.severity === 'critical' ? '#ef4444' : '#f59e0b'
                }}
              >
                <div className="absolute inset-0 bg-inherit rounded-full animate-ping opacity-50"></div>
              </div>
            ))}
          </div>
          
          <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
            <button className="size-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary transition-colors">
              <Plus className="size-5" />
            </button>
            <button className="size-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg flex items-center justify-center text-primary transition-colors">
              <Navigation className="size-5" />
            </button>
          </div>
          <div className="absolute left-4 bottom-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-lg border border-slate-200 dark:border-slate-800 rounded-lg p-3 z-10">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-red-500"></span> Incident</div>
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-green-500"></span> Safe Zone</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold m-0">Recent Ward Incidents</h3>
              <Link to="/resident/incidents" className="text-primary text-sm font-semibold hover:underline">View Ward Map</Link>
            </div>
            <div className="space-y-3">
              {incidents.length > 0 ? incidents.map((inc) => (
                <div key={inc._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-start gap-4 hover:border-primary/30 transition-all cursor-pointer group">
                  <div className={`p-2.5 rounded-lg flex items-center justify-center ${
                    inc.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 
                    inc.severity === 'high' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 
                    'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                  }`}>
                    <AlertTriangle className="size-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 dark:text-white m-0 group-hover:text-primary transition-colors">{inc.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${getSeverityStyle(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0 line-clamp-1">{inc.description || 'No description provided.'}</p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-slate-400 m-0 flex items-center gap-1 font-medium">
                        <Clock className="size-3" /> {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {inc.status}
                      </p>
                      <p className="text-[10px] text-slate-400 m-0 font-bold uppercase tracking-wider">{inc.category || 'General'}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center bg-green-50/30 dark:bg-green-900/10 border-2 border-dashed border-green-200 dark:border-green-900/30 rounded-2xl">
                  <Shield className="size-10 text-green-500 mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Your ward is currently clear. No active incidents reported.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold m-0">Community Vitals</h3>
              <div className="flex gap-2">
                <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-1 rounded-full font-bold">Optimal Signal</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                    <Activity className="size-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white m-0">Police Patrol Frequency</p>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Community verified data</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white m-0">High</p>
                  <p className="text-[10px] text-green-500 font-bold m-0">+12% vs last wk</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                    <Layers className="size-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white m-0">Street Light Coverage</p>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Status: Operational</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900 dark:text-white m-0">94%</p>
                  <p className="text-[10px] text-slate-400 font-bold m-0">Check-in due</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Link to="/resident/report" className="fixed bottom-24 right-8 group z-30 outline-none border-none">
        <div className="bg-gradient-to-br from-primary to-blue-700 text-white shadow-xl shadow-primary/40 p-4 rounded-full flex items-center gap-3 group-hover:pr-6 transition-all duration-300">
          <Plus className="size-6 font-bold" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-bold uppercase text-[10px] tracking-widest leading-none">Report Hazard</span>
        </div>
      </Link>
    </div>
  );
}
