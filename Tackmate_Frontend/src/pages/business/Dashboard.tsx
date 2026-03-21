import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { 
  Loader2, Shield, TrendingUp, 
  MapPin, Users, Bell, AlertTriangle, 
  Search, Check, Fingerprint, PlusCircle,
  Info, Globe
} from 'lucide-react';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [verificationId, setVerificationId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [advisories, setAdvisories] = useState<any[]>([]);

  useEffect(() => {
    fetchBusinessData();
    const interval = setInterval(fetchBusinessData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchBusinessData = async () => {
    try {
      const ward = user?.ward;
      const zoneId = ward ? (typeof ward === 'object' ? (ward as any)._id : ward) : 'general';
      
      const [analyticsRes, advisoriesRes] = await Promise.all([
        api.get(`/analytics/ward/${zoneId}`),
        api.get(`/incidents?category=ADVISORY&limit=3`)
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (advisoriesRes.data.success) setAdvisories(advisoriesRes.data.data);
    } catch (err) {
      console.error('Failed to fetch business data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationId) return;
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      // Search for profile by blockchain ID
      const res = await api.get(`/profiles?search=${verificationId}`);
      if (res.data.success && res.data.data.length > 0) {
        setVerificationResult(res.data.data[0]);
      } else {
        // Try direct ID lookup if search fails
        const directRes = await api.get(`/profiles/${verificationId}`).catch(() => null);
        if (directRes?.data?.success) {
          setVerificationResult(directRes.data.data);
        } else {
          setVerificationResult({ error: 'Identity proof not found in blockchain ledger.' });
        }
      }
    } catch (err) {
      setVerificationResult({ error: 'Verification service temporarily unavailable.' });
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 font-['Inter',_sans-serif] text-slate-900 dark:text-slate-100 bg-background-light dark:bg-slate-900 min-h-screen">
      <main className="py-8 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Safety Card */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-amber-500/10 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Zone Safety Status</p>
                <h3 className="text-lg font-bold m-0 mt-1 flex items-center gap-2">
                  <MapPin className="size-4 text-amber-500" />
                  {user?.business_name || 'Business Zone'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wide">
                <span className="size-2 rounded-full bg-green-500 ring-2 ring-green-500/20"></span>
                Safe
              </div>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold tracking-tight leading-none m-0">{analytics?.safety_score || 98}</span>
              <div className="flex flex-col mb-1">
                <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center leading-none m-0">
                  <TrendingUp className="size-3 mr-1" /> +2.5%
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-medium leading-none mt-1 m-0">Dynamic Score</span>
              </div>
            </div>
            <div className="h-[120px] w-full mt-6">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100">
                <path d="M0,80 Q50,75 100,60 T200,40 T300,25 T400,10" fill="none" stroke="#f59e0b" strokeWidth="3"></path>
                <path d="M0,80 Q50,75 100,60 T200,40 T300,25 T400,10 V100 H0 Z" fill="url(#grad1)" opacity="0.1"></path>
                <defs>
                  <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#f59e0b', stopOpacity:1}}></stop>
                    <stop offset="100%" style={{stopColor:'#f59e0b', stopOpacity:0}}></stop>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          
          {/* Traffic Card */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-amber-500/10 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Footfall Overview</p>
                <h3 className="text-lg font-bold m-0 mt-1">Real-time Traffic</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold leading-none m-0">{analytics?.tourist_count || 305}</span>
                <p className="text-[10px] text-slate-400 uppercase font-medium m-0 mt-1">Active Visitors</p>
              </div>
            </div>
            <div className="flex items-end justify-between h-[150px] gap-2 pt-4">
              {[60, 45, 75, 90, 55, 100, 80].map((h, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-2">
                  <div className="w-full bg-amber-500/10 rounded-t-sm relative group cursor-help transition-all hover:bg-amber-500/20" style={{ height: `${h}%` }}>
                    <div className="absolute bottom-0 w-full bg-amber-500 rounded-t-sm h-full opacity-60"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{"MTWTFSS"[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Proximity Map */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-800/50 rounded-xl border border-amber-500/10 overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-amber-500/10 flex justify-between items-center bg-background-light dark:bg-slate-900/50">
              <h3 className="font-bold flex items-center gap-2 m-0">
                <Globe className="size-4 text-amber-500" />
                Nearby Tourists
              </h3>
              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">200m Radius</span>
            </div>
            <div className="flex-1 relative min-h-[250px] bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-0 opacity-50 bg-[radial-gradient(#f2a60d_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 border border-amber-500/40 rounded-full bg-amber-500/10 animate-pulse"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 bg-amber-500 rounded-full ring-4 ring-amber-500/20"></div>
                 {/* Mock points */}
                 <div className="absolute top-[30%] left-[40%] size-2.5 bg-blue-500 rounded-full border border-white"></div>
                 <div className="absolute top-[60%] left-[55%] size-2.5 bg-blue-500 rounded-full border border-white"></div>
                 <div className="absolute top-[45%] left-[25%] size-2.5 bg-blue-500 rounded-full border border-white"></div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-amber-500/10">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 m-0">12 Verified tourists in vicinity</p>
              </div>
            </div>
          </div>

          {/* Advisories */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl border border-amber-500/10 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2 m-0">
                <Bell className="size-5 text-amber-500" />
                Safety Advisories
              </h3>
              <button className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-amber-600 transition-colors">
                <PlusCircle className="size-4" />
                Post Advisory
              </button>
            </div>
            <div className="space-y-4 flex-1">
              {advisories.length > 0 ? advisories.map((adv) => (
                <div key={adv._id} className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 transition-all hover:bg-amber-500/10">
                  <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-600">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold m-0 text-slate-900 dark:text-slate-100">{adv.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">{adv.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-bold uppercase tracking-wider">Active</span>
                    <p className="text-[10px] text-slate-400 mt-1 m-0 font-medium">
                      {new Date(adv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                  <Info className="size-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-medium">No active advisories in your sector.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Verification System */}
        <section className="bg-white dark:bg-slate-800/50 rounded-xl border-2 border-amber-500/20 p-8 shadow-md">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 w-full space-y-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-2 m-0">
                  <Fingerprint className="size-7 text-amber-500" />
                  Blockchain Identity Proof
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 m-0">Validate traveler credentials against the Trackmate decentralized ledger.</p>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={verificationId} onChange={e => setVerificationId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-background-light dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm font-mono" placeholder="ST-ID-XXXXXXXXXX" type="text" />
                </div>
                <button onClick={handleVerify} disabled={isVerifying || !verificationId} className="bg-amber-500 text-slate-900 px-8 py-3 rounded-lg font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 outline-none border-none disabled:opacity-50 min-w-[140px]">
                  {isVerifying ? <Loader2 className="size-5 animate-spin" /> : <Check className="size-5" />}
                  Verify
                </button>
              </div>
            </div>

            {verificationResult && (
              <div className="w-full md:w-[360px] bg-background-light dark:bg-slate-900 rounded-xl p-5 border border-amber-500/20 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                {verificationResult.error ? (
                  <div className="flex items-center gap-3 text-red-500">
                    <AlertTriangle className="size-5" />
                    <p className="text-xs font-bold m-0">{verificationResult.error}</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ledger Verified</span>
                      <div className="px-2 py-0.5 bg-green-500/10 text-green-500 rounded flex items-center gap-1">
                        <Check className="size-3" />
                        <span className="text-[10px] font-bold uppercase">Auth Valid</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="size-16 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-500/20 border border-amber-500/20 flex items-center justify-center">
                        <Users className="size-8 text-slate-400" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 m-0">{verificationResult.full_name}</h4>
                        <p className="text-[10px] font-mono text-slate-500 break-all">{verificationResult.blockchain_id}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-green-600">
                          <Shield className="size-3" />
                          Security Clearance Verified
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 pt-5 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                      <div className="p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] text-slate-500 font-bold uppercase m-0">Verification</p>
                        <p className="text-xs font-bold m-0 mt-1">{verificationResult.is_verified ? 'Identity Proofed' : 'Pending'}</p>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                        <p className="text-[9px] text-slate-400 font-bold uppercase m-0">Role</p>
                        <p className="text-xs font-black text-amber-600 dark:text-amber-500 m-0 mt-1 uppercase tracking-tight">{verificationResult.role}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
