import { useState, useEffect } from 'react';
import { 
  Users, MapPin, CheckCircle, 
  ShieldAlert, Loader2, AlertTriangle, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Link, useLocation } from 'react-router-dom';

export default function AuthorityRosters() {
  const { user: authUser } = useAuth();
  const location = useLocation();
  
  // Extract role from URL path (e.g. /authority/tourists -> tourist)
  const pathPart = location.pathname.split('/').pop() || 'tourists';
  const roleMap: Record<string, string> = {
    'tourists': 'tourist',
    'residents': 'resident',
    'businesses': 'business'
  };
  const role = roleMap[pathPart] || 'tourist';
  
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, [role]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/profiles?role=${role}`);
      if (res.data.success) {
        setProfiles(res.data.data);
      }
    } catch (err) {
      console.error(`Failed to fetch ${role} profiles:`, err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(p => {
    if (!search) return true;
    const term = search.toLowerCase();
    return p.full_name?.toLowerCase().includes(term) || 
           p.blockchain_id?.toLowerCase().includes(term) || 
           p.email?.toLowerCase().includes(term);
  });

  const getRoleTitle = () => {
    switch(role) {
      case 'tourist': return 'Tourist Roster';
      case 'resident': return 'Resident Directory';
      case 'business': return 'Registered Businesses';
      default: return 'User Roster';
    }
  };

  const getRoleIcon = () => {
    switch(role) {
      case 'tourist': return <Users className="size-5" />;
      case 'resident': return <MapPin className="size-5" />;
      case 'business': return <CheckCircle className="size-5" />;
      default: return <Users className="size-5" />;
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
            <Link className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all no-underline ${role === 'tourist' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} to="/authority/tourists">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              Tourist Roster
            </Link>
            <Link className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all no-underline ${role === 'resident' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} to="/authority/residents">
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Residents
            </Link>
            <Link className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all no-underline ${role === 'business' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} to="/authority/businesses">
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
               {getRoleIcon()} {getRoleTitle()}
            </h1>
            <p className="text-sm text-slate-500 m-0">View and manage verified system accounts</p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-64">
             <input 
               type="text"
               value={search}
               onChange={e => setSearch(e.target.value)}
               placeholder="Search name, email, or ID..."
               className="bg-transparent border-none outline-none text-sm px-3 py-1.5 w-full text-slate-900 dark:text-white"
             />
          </div>
        </header>

        <div className="p-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">User Identity</th>
                    <th className="px-6 py-4">Contact Info</th>
                    <th className="px-6 py-4">Blockchain ID</th>
                    <th className="px-6 py-4">Safety Score</th>
                    <th className="px-6 py-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                        No {role} accounts found in the database.
                      </td>
                    </tr>
                  ) : filteredProfiles.map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">{p.full_name}</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">{p.id_type}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div>{p.email}</div>
                        <div>{p.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-primary font-mono select-all">
                          {p.blockchain_id || 'NOT_MINTED'}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                             <div className="h-full bg-green-500 rounded-full" style={{ width: `${p.safety_score || 0}%` }}></div>
                           </div>
                           <span className="text-xs font-bold">{p.safety_score || 0}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {p.is_verified ? (
                           <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-500 bg-green-500/10 px-2 py-1 rounded">
                             <CheckCircle className="size-3" /> Confirmed
                           </span>
                        ) : (
                           <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-1 rounded">
                             <AlertTriangle className="size-3" /> Pending
                           </span>
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
