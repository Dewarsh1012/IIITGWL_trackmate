import { Calendar, MapPin, Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AuthorityAnalytics() {
  const { user } = useAuth();

  return (
    <div className="bg-background-light dark:bg-[#0F172A] font-['Inter',_sans-serif] text-slate-900 dark:text-slate-100 min-h-screen">
      <div className="relative flex flex-col min-h-screen">
        {/* Top Navigation */}
        <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 px-8 py-4 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <Link to="/authority/dashboard" className="flex items-center gap-3 text-primary no-underline">
              <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-2xl leading-none m-0">shield_with_heart</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight m-0 text-slate-900 dark:text-white">SafeTravel <span className="text-primary">v3.0</span> Authority</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/authority/dashboard" className="text-primary text-sm font-semibold border-b-2 border-primary pb-1 no-underline">Dashboard</Link>
              <a href="#" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors no-underline">Zones</a>
              <a href="#" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors no-underline">Reports</a>
              <a href="#" className="text-slate-500 dark:text-slate-400 text-sm font-medium hover:text-primary transition-colors no-underline">Personnel</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl m-0 leading-none">search</span>
              <input className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/50 transition-all outline-none" placeholder="Global system search..." type="text" />
            </div>
            <button className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all outline-none border-none">
              <span className="material-symbols-outlined text-lg m-0 leading-none">ios_share</span>
              Export Data
            </button>
            <div className="size-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 border-primary/20 flex items-center justify-center font-bold text-slate-500">
              KD
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-[1600px] mx-auto w-full">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 outline-none">
                <span className="material-symbols-outlined text-slate-400 m-0 leading-none">calendar_today</span>
                Last 30 Days
                <span className="material-symbols-outlined text-slate-400 text-sm m-0 leading-none">expand_more</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-200 outline-none">
                <span className="material-symbols-outlined text-slate-400 m-0 leading-none">location_on</span>
                All Zones
                <span className="material-symbols-outlined text-slate-400 text-sm m-0 leading-none">expand_more</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm italic">
              <RefreshCw className="size-4 animate-spin text-primary m-0" />
              Live updates active — Last refreshed 2 mins ago
            </div>
          </div>

          {/* Visualization Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            
            {/* 1. Daily Incident Count */}
            <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 flex flex-col border border-slate-200 dark:border-white/10 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 m-0">Daily Incident Count</h3>
                 <div className="flex gap-2">
                    <span className="size-2 rounded-full bg-red-500"></span>
                    <span className="size-2 rounded-full bg-blue-500"></span>
                    <span className="size-2 rounded-full bg-yellow-500"></span>
                 </div>
              </div>
              <div className="flex-1 flex flex-col">
                 <div className="relative h-48 w-full">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50">
                       <path d="M0 45 Q 15 10, 30 35 T 60 15 T 100 40" fill="none" stroke="#ef4444" strokeWidth="2"></path>
                       <path d="M0 40 Q 20 20, 40 45 T 70 30 T 100 35" fill="none" stroke="#3b82f6" strokeWidth="2"></path>
                       <path d="M0 35 Q 25 30, 50 15 T 80 40 T 100 10" fill="none" stroke="#eab308" strokeWidth="2"></path>
                    </svg>
                 </div>
                 <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-bold">
                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                 </div>
              </div>
            </div>

            {/* 2. Average Response Time */}
            <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 flex flex-col border border-slate-200 dark:border-white/10 shadow-sm">
               <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 m-0">Avg Response Time (Min)</h3>
               <div className="flex-1 flex flex-col justify-end gap-3">
                  <div className="flex items-center gap-4">
                     <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Crime</span>
                     <div className="h-6 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '85%' }}></div>
                     </div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-200">12.4m</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Accident</span>
                     <div className="h-6 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: '60%' }}></div>
                     </div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-200">8.1m</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Medical</span>
                     <div className="h-6 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: '45%' }}></div>
                     </div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-200">6.5m</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-xs text-slate-500 dark:text-slate-400 w-16">Hazard</span>
                     <div className="h-6 flex-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: '70%' }}></div>
                     </div>
                     <span className="text-xs font-bold text-slate-700 dark:text-slate-200">10.2m</span>
                  </div>
               </div>
            </div>

            {/* 3. Incidents by Zone */}
            <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 flex flex-col border border-slate-200 dark:border-white/10 shadow-sm">
               <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 m-0">Incidents by Zone</h3>
               <div className="flex-1 flex items-center gap-6 justify-center">
                  <div className="relative size-32">
                     <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" fill="none" r="16" className="stroke-slate-100 dark:stroke-slate-700" strokeWidth="4"></circle>
                        <circle cx="18" cy="18" fill="none" r="16" stroke="#3b82f6" strokeDasharray="40 100" strokeWidth="4"></circle>
                        <circle cx="18" cy="18" fill="none" r="16" stroke="#ef4444" strokeDasharray="25 100" strokeDashoffset="-40" strokeWidth="4"></circle>
                        <circle cx="18" cy="18" fill="none" r="16" stroke="#10b981" strokeDasharray="15 100" strokeDashoffset="-65" strokeWidth="4"></circle>
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold m-0 leading-none text-slate-900 dark:text-white">150</span>
                        <span className="text-[10px] text-slate-500 m-0 mt-1 font-bold">TOTAL</span>
                     </div>
                  </div>
                  <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                        <span className="size-3 rounded-sm bg-blue-500"></span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">Downtown (40%)</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="size-3 rounded-sm bg-red-500"></span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">South (25%)</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="size-3 rounded-sm bg-emerald-500"></span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">West (15%)</span>
                     </div>
                  </div>
               </div>
            </div>

            {/* 4. Safety Score Trends */}
            <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 flex flex-col border border-slate-200 dark:border-white/10 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 m-0">Safety Score Trend</h3>
                  <span className="text-emerald-500 dark:text-emerald-400 font-bold text-lg m-0 leading-none">88.4%</span>
               </div>
               <div className="flex-1 rounded-lg relative overflow-hidden" style={{ background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0) 100%)' }}>
                  <svg className="absolute bottom-0 w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 40">
                     <path d="M0 40 L0 30 Q 25 10, 50 25 T 100 5 L 100 40 Z" fill="#10b98133"></path>
                     <path d="M0 30 Q 25 10, 50 25 T 100 5" fill="none" stroke="#10b981" strokeWidth="2"></path>
                  </svg>
               </div>
               <div className="flex justify-between mt-3 text-[10px] text-slate-500 font-bold px-1">
                  <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
               </div>
            </div>

            {/* 5. Tourist Activity */}
            <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 flex flex-col border border-slate-200 dark:border-white/10 shadow-sm">
               <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 m-0">Tourist Activity</h3>
               <div className="flex-1 flex items-end gap-1.5 h-32">
                  {[40, 55, 85, 70, 95, 80, 60].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary/20 hover:bg-primary transition-colors rounded-t-sm cursor-pointer" style={{ height: `${h}%` }}></div>
                  ))}
               </div>
               <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-bold px-3">
                  <span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span>
               </div>
            </div>

            {/* 6. Incident Lifecycle Funnel */}
            <div className="bg-white/80 dark:bg-slate-800/70 backdrop-blur-md rounded-xl p-6 flex flex-col border border-slate-200 dark:border-white/10 shadow-sm">
               <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-6 m-0">Lifecycle Funnel</h3>
               <div className="flex-1 flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                     <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 m-0">
                        <span>REPORTED</span>
                        <span>100%</span>
                     </div>
                     <div className="h-3 bg-primary w-full rounded-full"></div>
                  </div>
                  <div className="flex flex-col gap-1">
                     <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 m-0">
                        <span>VERIFIED</span>
                        <span>82%</span>
                     </div>
                     <div className="h-3 bg-primary/80 w-[82%] rounded-full"></div>
                  </div>
                  <div className="flex flex-col gap-1">
                     <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 m-0">
                        <span>ASSIGNED</span>
                        <span>65%</span>
                     </div>
                     <div className="h-3 bg-primary/60 w-[65%] rounded-full"></div>
                  </div>
                  <div className="flex flex-col gap-1">
                     <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1 m-0">
                        <span>CLOSED</span>
                        <span>58%</span>
                     </div>
                     <div className="h-3 bg-primary/40 w-[58%] rounded-full"></div>
                  </div>
               </div>
            </div>
            
          </div>

          {/* Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-tight m-0">Total Incidents</span>
                <div className="flex items-end gap-2">
                   <span className="text-3xl font-bold m-0 leading-none text-slate-900 dark:text-white">150</span>
                   <span className="text-red-500 text-xs font-bold mb-0.5 flex items-center leading-none">
                      <TrendingUp className="size-3 mr-0.5" /> 5%
                   </span>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-tight m-0">Avg Response</span>
                <div className="flex items-end gap-2">
                   <span className="text-3xl font-bold m-0 leading-none text-slate-900 dark:text-white">10m</span>
                   <span className="text-emerald-500 text-xs font-bold mb-0.5 flex items-center leading-none">
                      <TrendingDown className="size-3 mr-0.5" /> 10%
                   </span>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-tight m-0">Resolution Rate</span>
                <div className="flex items-end gap-2">
                   <span className="text-3xl font-bold m-0 leading-none text-slate-900 dark:text-white">85%</span>
                   <span className="text-emerald-500 text-xs font-bold mb-0.5 flex items-center leading-none">
                      <TrendingUp className="size-3 mr-0.5" /> 2%
                   </span>
                </div>
             </div>
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl flex flex-col gap-2 shadow-sm">
                <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-tight m-0">Active Zones</span>
                <div className="flex items-end gap-2">
                   <span className="text-3xl font-bold m-0 leading-none text-slate-900 dark:text-white">6</span>
                   <span className="text-slate-400 text-xs font-bold mb-0.5 m-0 leading-none mt-1">Stable</span>
                </div>
             </div>
          </div>
        </main>

        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 dark:text-slate-400 text-sm m-0">
           <div className="flex items-center gap-6">
              <a href="#" className="hover:text-primary transition-colors no-underline text-slate-500 dark:text-slate-400">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors no-underline text-slate-500 dark:text-slate-400">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors no-underline text-slate-500 dark:text-slate-400">System Status</a>
           </div>
           <p className="m-0">© 2026 SafeTravel Authority Analytics. Confidential Information.</p>
        </footer>
      </div>
    </div>
  );
}
