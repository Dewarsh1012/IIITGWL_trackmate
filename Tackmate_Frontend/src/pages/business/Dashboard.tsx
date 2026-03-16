import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [verificationId, setVerificationId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = () => {
    if (!verificationId) return;
    setIsVerifying(true);
    // Mock verification delay
    setTimeout(() => {
      setVerificationResult({
        name: 'Sarah J. Miller',
        id: verificationId,
        status: 'Valid',
        nationality: 'Canada',
        tier: 'Gold Elite'
      });
      setIsVerifying(false);
    }, 1500);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 font-['Inter',_sans-serif] text-slate-900 dark:text-slate-100 bg-background-light dark:bg-slate-900 min-h-screen">
      <main className="py-8 space-y-6">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-amber-500/10 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Zone Safety Status</p>
                <h3 className="text-lg font-bold m-0 mt-1">Tawang Monastery Compound</h3>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold uppercase tracking-wide">
                <span className="size-2 rounded-full bg-green-500"></span>
                Safe
              </div>
            </div>
            <div className="flex items-end gap-3 mb-4">
              <span className="text-4xl font-bold tracking-tight leading-none m-0">98</span>
              <div className="flex flex-col mb-1">
                <span className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center leading-none m-0">
                  <span className="material-symbols-outlined text-sm m-0">trending_up</span> +2.5%
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-medium leading-none mt-1 m-0">Safety Score</span>
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
              <div className="flex justify-between mt-2 px-1">
                <span className="text-[10px] font-bold text-slate-400">MON</span>
                <span className="text-[10px] font-bold text-slate-400">WED</span>
                <span className="text-[10px] font-bold text-slate-400">FRI</span>
                <span className="text-[10px] font-bold text-slate-400">SUN</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-amber-500/10 p-6 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 m-0">Footfall Overview</p>
                <h3 className="text-lg font-bold m-0 mt-1">Last 7 Days Traffic</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold leading-none m-0">305</span>
                <p className="text-[10px] text-slate-400 uppercase font-medium m-0 mt-1">Total Tourists</p>
              </div>
            </div>
            <div className="flex items-end justify-between h-[150px] gap-2 pt-4">
              {/* Bars */}
              {[60, 45, 75, 90, 55, 100, 80].map((h, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-2">
                  <div className="w-full bg-amber-500/10 dark:bg-amber-500/5 rounded-t-sm relative group cursor-help" style={{ height: `${h}%` }}>
                    <div className="absolute bottom-0 w-full bg-amber-500 rounded-t-sm h-full opacity-60"></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{"MTWTFSS"[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-800/50 rounded-xl border border-amber-500/10 overflow-hidden shadow-sm flex flex-col">
            <div className="p-4 border-b border-amber-500/5 flex justify-between items-center bg-background-light dark:bg-slate-900/50">
              <h3 className="font-bold flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-amber-500 m-0">location_on</span>
                Nearby Tourists
              </h3>
              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full">200m Radius</span>
            </div>
            <div className="flex-1 relative min-h-[250px] bg-slate-100 dark:bg-slate-800">
              <div className="absolute inset-0 opacity-50 bg-[radial-gradient(#f2a60d_1px,transparent_1px)] [background-size:16px_16px]"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-24 border-2 border-amber-500/40 rounded-full bg-amber-500/10 animate-pulse"></div>
                 <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-4 bg-amber-500 rounded-full ring-4 ring-amber-500/20 shadow-lg shadow-amber-500/40"></div>
                 <div className="absolute top-[30%] left-[40%] size-2.5 bg-blue-500 rounded-full border border-white"></div>
                 <div className="absolute top-[60%] left-[55%] size-2.5 bg-blue-500 rounded-full border border-white"></div>
                 <div className="absolute top-[45%] left-[25%] size-2.5 bg-blue-500 rounded-full border border-white"></div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-lg border border-amber-500/20">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 m-0">12 Active tourists currently in vicinity</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl border border-amber-500/10 p-6 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-amber-500 m-0">campaign</span>
                Your Safety Advisories
              </h3>
              <button className="bg-amber-500 text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-amber-600 transition-colors outline-none border-none">
                <span className="material-symbols-outlined text-[18px] m-0">add_circle</span>
                Post New Advisory
              </button>
            </div>
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                <div className="size-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 m-0 leading-none">notifications_active</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold m-0 text-slate-900 dark:text-slate-100">Limited Access at West Gate</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">Due to local festival maintenance. Use North entry.</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-bold uppercase">Active</span>
                  <p className="text-[10px] text-slate-400 mt-1 m-0">2h ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-slate-400 m-0 leading-none">event_busy</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 m-0">Flash Flood Alert - River Banks</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 m-0 mt-0.5">Advisory issued yesterday for the Tawang River area.</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded text-[10px] font-bold uppercase">Expired</span>
                  <p className="text-[10px] text-slate-400 mt-1 m-0">24h ago</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-800/50 rounded-xl border-2 border-amber-500/20 p-8 shadow-md">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 w-full space-y-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-2 m-0">
                  <span className="material-symbols-outlined text-amber-500 text-[28px] m-0">fingerprint</span>
                  Verify Tourist Identity
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 m-0">Instantly verify traveler safety credentials using blockchain-backed SafeTravel ID.</p>
              </div>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 leading-none m-0">tag</span>
                  <input value={verificationId} onChange={e => setVerificationId(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-background-light dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none text-sm" placeholder="Enter Blockchain ID (e.g. ST-8829-44X)" type="text" />
                </div>
                <button onClick={handleVerify} disabled={isVerifying || !verificationId} className="bg-amber-500 text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-amber-600 transition-all flex items-center justify-center gap-2 outline-none border-none disabled:opacity-50">
                  {isVerifying ? <Loader2 className="size-5 animate-spin" /> : <span className="material-symbols-outlined leading-none m-0">search</span>}
                  Verify
                </button>
              </div>
            </div>

            {verificationResult && (
              <div className="w-full md:w-[320px] bg-background-light dark:bg-slate-900 rounded-xl p-4 border border-amber-500/10 shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Verification Result</span>
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-[10px] font-bold uppercase">Valid</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden border border-amber-500/20 flex items-center justify-center">
                    <span className="text-2xl font-bold text-slate-500 shrink-0">SM</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 leading-none m-0">{verificationResult.name}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 m-0">ID: {verificationResult.id}</p>
                    <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-green-600 dark:text-green-400">
                      <span className="material-symbols-outlined text-[12px] m-0 leading-none">verified_user</span>
                      Identity Verified
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] text-slate-400 font-bold uppercase m-0">Nationality</p>
                    <p className="text-xs font-bold m-0 mt-0.5">{verificationResult.nationality}</p>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-100 dark:border-slate-700">
                    <p className="text-[9px] text-slate-400 font-bold uppercase m-0">Safety Tier</p>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-500 m-0 mt-0.5">{verificationResult.tier}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
