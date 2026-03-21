import { useState, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, Clock, 
  MapPin, ShieldAlert, Loader2, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Link } from 'react-router-dom';

export default function AuthorityIncidents() {
  const { user: authUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL'); // ALL, ACTIVE, RESOLVED
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await api.get('/incidents');
      if (res.data.success) {
        setIncidents(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredIncidents = incidents.filter(inc => {
    if (filter !== 'ALL' && inc.status !== filter) return false;
    if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
    return true;
  });

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/incidents/${id}`, { status: newStatus });
      if (res.data.success) {
        setIncidents(prev => prev.map(i => i._id === id ? { ...i, status: newStatus } : i));
      }
    } catch (err) {
      console.error('Failed to update incident:', err);
      alert('Failed to update incident status.');
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
      {/* Sidebar (Extracted logically or duplicated for speed here) */}
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
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary text-white no-underline" to="/authority/incidents">
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
            <Link className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all no-underline" to="/authority/zones">
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
               Incident Management
            </h1>
            <p className="text-sm text-slate-500 m-0">Review, assign, and resolve reported anomalies</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'ALL' ? 'bg-white dark:bg-slate-700 shadow flex items-center gap-1.5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'active' ? 'bg-primary text-white shadow flex items-center gap-1.5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Active
              </button>
              <button 
                onClick={() => setFilter('resolved')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filter === 'resolved' ? 'bg-green-500 text-white shadow flex items-center gap-1.5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Resolved
              </button>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setSeverityFilter('ALL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${severityFilter === 'ALL' ? 'bg-white dark:bg-slate-700 shadow flex items-center gap-1.5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Any Severity
              </button>
              <button 
                onClick={() => setSeverityFilter('CRITICAL')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${severityFilter === 'CRITICAL' ? 'bg-red-500 text-white shadow flex items-center gap-1.5' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Critical
              </button>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Incident</th>
                    <th className="px-6 py-4">Severity / Source</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 italic">
                        No incidents match the applied filters.
                      </td>
                    </tr>
                  ) : filteredIncidents.map((inc) => (
                    <tr key={inc._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 dark:text-white m-0 truncate max-w-[200px]">{inc.title}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{inc.incident_type}</p>
                      </td>
                      <td className="px-6 py-4 flex flex-col items-start gap-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                          inc.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-500' : 
                          inc.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-500' :
                          inc.severity === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          {inc.severity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono mt-1">{inc.source}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {inc.latitude && inc.longitude ? `${inc.latitude.toFixed(4)}, ${inc.longitude.toFixed(4)}` : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(inc.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           {inc.status === 'resolved' ? <CheckCircle className="size-4 text-green-500" /> : <AlertTriangle className="size-4 text-orange-500" />}
                           <span className={`text-xs font-bold capitalize ${inc.status === 'resolved' ? 'text-green-500' : 'text-orange-500'}`}>{inc.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inc.status !== 'resolved' && (
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => handleStatusUpdate(inc._id, 'acknowledged')} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 px-3 py-1.5 rounded transition-all">Ack</button>
                             <button onClick={() => handleStatusUpdate(inc._id, 'resolved')} className="text-[10px] font-bold uppercase tracking-widest text-green-500 hover:bg-green-500/10 px-3 py-1.5 rounded transition-all">Resolve</button>
                             <Link to={`/authority/efir?incidentId=${inc._id}`} className="text-slate-400 hover:text-white p-1.5"><FileText className="size-4" /></Link>
                          </div>
                        )}
                        {inc.status === 'resolved' && (
                          <span className="text-xs text-slate-500 italic">No actions needed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
