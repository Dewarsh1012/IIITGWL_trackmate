import { useState, useEffect } from 'react';
import { 
  MapPin, AlertTriangle, ShieldAlert, 
  Loader2, Activity, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Link } from 'react-router-dom';

export default function AuthorityZones() {
  const { user: authUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<any[]>([]);

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await api.get('/zones');
      if (res.data.success) {
        setZones(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch zones:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-[#0F172A] font-['Inter',_sans-serif] text-slate-900 dark:text-slate-100 min-h-screen flex">
      {/* Sidebar - Quick Copy */}
      <aside className="w-64 bg-white dark:bg-[#151e32] border-r border-slate-200 dark:border-slate-800 flex flex-col fixed h-screen z-40 hidden md:flex">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 text-primary no-underline text-xl font-bold italic mb-1">
            <ShieldAlert className="size-6" /> SafeTravel
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-9">Command Center</p>
        </div>
        <div className="p-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50 flex items-center gap-3 mb-6">
            <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {authUser?.full_name?.substring(0,2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm m-0 line-clamp-1">{authUser?.full_name}</p>
              <p className="text-xs text-slate-500 capitalize">{authUser?.role}</p>
            </div>
          </div>
          <nav className="space-y-1">
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" to="/authority/dashboard">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Dashboard
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" to="/authority/incidents">
              <AlertTriangle className="size-5" />
              Incidents
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" to="/authority/tourists">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Tourist Roster
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" to="/authority/residents">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Residents
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" to="/authority/businesses">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Businesses
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white no-underline" to="/authority/zones">
              <MapPin className="size-5" />
              Zone Management
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" to="/authority/efir">
              <FileText className="size-5" />
              E-FIR System
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" to="/authority/analytics">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
              Analytics
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        <header className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-8">
          <div>
            <h1 className="text-xl font-bold m-0 flex items-center gap-2">
               Operations Zones
            </h1>
            <p className="text-sm text-slate-500 m-0">Dynamic risk matrices & geographical sector alerts</p>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {zones.length === 0 ? (
               <div className="col-span-3 py-12 text-center text-slate-500 italic border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                 No operational zones established in index.
               </div>
             ) : zones.map((zone) => (
               <div key={zone._id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                 <div className="flex justify-between items-start mb-4">
                   <h3 className="font-bold text-slate-900 dark:text-white m-0 text-lg flex items-center gap-2">
                     <MapPin className="size-4 text-primary" /> {zone.name}
                   </h3>
                   <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                     zone.risk_level === 'CRITICAL' ? 'bg-red-500/10 text-red-500' :
                     zone.risk_level === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                     zone.risk_level === 'MODERATE' ? 'bg-yellow-500/10 text-yellow-500' :
                     'bg-green-500/10 text-green-500'
                   }`}>
                     {zone.risk_level} Risk
                   </span>
                 </div>
                 
                 <p className="text-xs text-slate-500 mb-6 min-h-[40px] line-clamp-2">
                   {zone.description || 'Geofenced operational sector.'}
                 </p>
                 
                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                   <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Active Incidents</p>
                     <p className="font-mono text-lg font-bold text-primary m-0 flex items-center gap-2">
                       <Activity className="size-4" /> {zone.active_incidents_count || 0}
                     </p>
                   </div>
                   <div>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Safety Index</p>
                     <p className="text-lg font-bold text-slate-900 dark:text-white m-0">
                       {zone.safety_score || 100}%
                     </p>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </main>
    </div>
  );
}
