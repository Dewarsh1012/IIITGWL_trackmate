import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<any[]>([]);

  useEffect(() => {
    // Mock fetch for now
    api.get('/incidents/ward/mock-ward-id').then(res => {
      setIncidents(res.data.data);
    }).catch(console.error);
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden font-['Public_Sans',_sans-serif] text-slate-900 dark:text-slate-100 bg-background-light dark:bg-background-dark">
      <main className="flex-1 overflow-y-auto p-6 space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Tawang Ward Overview</h2>
              <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 m-0 mt-1">
                <span className="material-symbols-outlined text-sm m-0">update</span> 
                Updated 5 minutes ago • Arunachal Pradesh
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-sm font-semibold text-red-500 flex items-center justify-end gap-1 m-0">
                  <span className="material-symbols-outlined text-base m-0 leading-none">trending_down</span> ↓ 3 points
                </p>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold m-0 mt-1">Safety Score</p>
              </div>
              <div className="relative flex items-center justify-center">
                <svg className="size-20 transform -rotate-90">
                  <circle className="text-slate-100 dark:text-slate-800" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-amber-500 transition-all duration-1000" cx="40" cy="40" fill="transparent" r="34" stroke="currentColor" strokeDasharray="213.6" strokeDashoffset="59.8" strokeWidth="8"></circle>
                </svg>
                <span className="absolute text-xl font-black text-slate-800 dark:text-white">72</span>
              </div>
            </div>
          </div>
          <div className="bg-primary rounded-xl shadow-lg shadow-primary/20 p-6 flex flex-col justify-between text-white">
            <div className="flex justify-between items-start">
              <span className="material-symbols-outlined text-3xl opacity-80 m-0 leading-none">volunteer_activism</span>
              <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Active Watch</span>
            </div>
            <div>
              <p className="text-2xl font-bold m-0">14</p>
              <p className="text-sm opacity-90 m-0 mt-1">Neighbors On Duty</p>
            </div>
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden h-[400px] relative">
          <div className="absolute inset-0 z-0 bg-slate-200 dark:bg-slate-800" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=1200')", backgroundSize: "cover", backgroundPosition: "center", opacity: 0.3 }}>
            <div className="absolute inset-10 border-4 border-dashed border-primary/40 rounded-[2rem] pointer-events-none"></div>
            <div className="absolute top-1/4 left-1/3 size-4 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer">
              <span className="material-symbols-outlined text-white text-[10px] m-0 leading-none">warning</span>
            </div>
            <div className="absolute top-1/2 left-1/2 size-4 bg-primary rounded-full border-2 border-white shadow-[0_0_15px_rgba(26,87,219,0.6)] animate-pulse"></div>
            <div className="absolute bottom-1/3 right-1/4 size-4 bg-slate-400 rounded-full border-2 border-white opacity-80"></div>
            <div className="absolute top-1/4 right-1/3 px-4 py-2 bg-green-500/20 border border-green-500/40 rounded-full backdrop-blur-sm flex items-center gap-2">
              <span className="size-2 bg-green-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-green-700 m-0">SAFE ZONE</span>
            </div>
          </div>
          <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
            <button className="size-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary transition-colors outline-none">
              <span className="material-symbols-outlined m-0 leading-none">add</span>
            </button>
            <button className="size-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-primary transition-colors outline-none">
              <span className="material-symbols-outlined m-0 leading-none">remove</span>
            </button>
            <button className="mt-2 size-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg flex items-center justify-center text-primary transition-colors outline-none">
              <span className="material-symbols-outlined m-0 leading-none">my_location</span>
            </button>
          </div>
          <div className="absolute left-4 bottom-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-lg border border-slate-200 dark:border-slate-800 rounded-lg p-3 z-10">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-red-500"></span> Incident</div>
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-slate-400"></span> Resolved</div>
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary"></span> You</div>
              <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-green-500"></span> Safe Zone</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold m-0">Recent Incidents</h3>
              <button className="text-primary text-sm font-semibold hover:underline outline-none border-none">View All</button>
            </div>
            <div className="space-y-3">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-start gap-4 hover:border-red-200 dark:hover:border-red-900 transition-all cursor-pointer">
                <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2.5 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined m-0 leading-none">car_crash</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 dark:text-white m-0">Road Accident near Market</h4>
                    <span className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase m-0 leading-tight">Critical</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">Two-wheeler collision at Tawang Market intersection.</p>
                  <p className="text-xs text-slate-400 mt-2 mb-0 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-xs m-0 leading-none">schedule</span> 23 min ago
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-start gap-4 hover:border-slate-300 transition-all cursor-pointer">
                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 p-2.5 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined m-0 leading-none">report_problem</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-slate-800 dark:text-white m-0">Street Light Outage</h4>
                    <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold uppercase m-0 leading-tight">Moderate</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 mb-0">Poor visibility on Link Road due to 3 non-functional lights.</p>
                  <p className="text-xs text-slate-400 mt-2 mb-0 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-xs m-0 leading-none">schedule</span> 1 hour ago
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold m-0">Zone Status</h3>
              <div className="flex gap-2">
                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold">4 Safe</span>
                <span className="bg-red-100 text-red-700 text-[10px] px-2 py-1 rounded-full font-bold">1 High Risk</span>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
              <div className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 m-0 leading-none">temple_buddhist</span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white m-0">Tawang Monastery</p>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Quiet • High Visibility</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full">Safe</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 w-12 text-center m-0">0 Inc.</p>
                </div>
              </div>
              <div className="p-4 flex items-center justify-between group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-400 m-0 leading-none">landscape</span>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-white m-0">Sela Pass</p>
                    <p className="text-xs text-slate-500 m-0 mt-0.5">Icy Road Conditions</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-full">Moderate</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 w-12 text-center m-0">2 Inc.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Link to="/resident/report" className="fixed bottom-24 right-8 group z-30 outline-none border-none">
        <div className="bg-gradient-to-br from-primary to-blue-700 text-white shadow-xl shadow-primary/40 p-4 rounded-full flex items-center gap-3 group-hover:pr-6 transition-all duration-300">
          <span className="material-symbols-outlined text-2xl font-bold m-0 leading-none">add</span>
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 font-bold uppercase text-xs tracking-widest m-0 leading-none">Report Incident</span>
        </div>
      </Link>
    </div>
  );
}
