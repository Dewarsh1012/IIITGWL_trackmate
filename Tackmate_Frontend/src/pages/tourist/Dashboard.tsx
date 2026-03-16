import { useLocation } from '../../hooks/use-location';
import TouristMap from '../../components/maps/TouristMap';
import { Link } from 'react-router-dom';
import { Map, AlertTriangle, CloudSun, ShieldAlert, Watch, Shield } from 'lucide-react';

export default function TouristDashboard() {
  const { lat, lng } = useLocation();

  return (
    <div className="max-w-[1440px] mx-auto p-4 space-y-4 text-slate-900 dark:text-slate-100">
      <div className="w-full bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between safety-pulse gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-500 rounded-full p-2 flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-lg">verified_user</span>
          </div>
          <div>
            <h2 className="text-green-800 dark:text-green-400 font-bold text-lg m-0">You are in a Safe Zone — Tawang Monastery Compound</h2>
            <p className="text-green-700/70 dark:text-green-400/70 text-sm m-0 mt-1">Security level: Optimal. Police presence confirmed within 500m.</p>
          </div>
        </div>
        <button className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
          View Coverage Details
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[600px] flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-primary">map</span>
              Live Safety GIS
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="size-2 rounded-full bg-green-500"></span> Safe
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="size-2 rounded-full bg-amber-500"></span> Moderate
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="size-2 rounded-full bg-red-500"></span> Restricted
              </div>
            </div>
          </div>
          <div className="relative flex-grow bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <TouristMap lat={lat} lng={lng} />

            <div className="absolute top-6 left-6 w-72 z-[400]">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-1 flex items-center pointer-events-auto">
                <span className="material-symbols-outlined px-2 text-slate-400">search</span>
                <input className="border-none focus:ring-0 text-sm bg-transparent w-full placeholder:text-slate-400 dark:text-slate-100 outline-none" placeholder="Search safety zones..." type="text"/>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 m-0">
              <span className="material-symbols-outlined text-primary">timeline</span>
              Today's Journey
            </h3>
            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-slate-700">
              <div className="relative pl-10">
                <div className="absolute left-0 size-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center z-10 border dark:border-slate-700">
                  <span className="material-symbols-outlined text-[14px] text-slate-500 leading-none m-0">check</span>
                </div>
                <p className="text-sm font-semibold text-slate-400 m-0">Old Market (Visited)</p>
                <p className="text-xs text-slate-400 m-0 mt-1">10:00 AM - Safe Entry</p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-0 size-6 rounded-full bg-primary flex items-center justify-center z-10 border-4 border-white dark:border-slate-900 box-content -ml-1">
                  <span className="material-symbols-outlined text-[14px] text-white leading-none m-0">near_me</span>
                </div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 m-0">Tawang Monastery (Current)</p>
                <p className="text-xs text-primary font-medium m-0 mt-1">Active Now - Smart-Monitored Zone</p>
              </div>
              <div className="relative pl-10">
                <div className="absolute left-0 size-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center z-10 border dark:border-slate-700">
                  <span className="material-symbols-outlined text-[14px] text-slate-400 leading-none m-0">schedule</span>
                </div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 m-0">War Memorial (Upcoming)</p>
                <p className="text-xs text-slate-400 m-0 mt-1">03:30 PM - Expected Arrival</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 m-0">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 transition-colors group">
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">event_note</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Itinerary</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group">
                <span className="material-symbols-outlined text-red-500 mb-2 group-hover:scale-110 transition-transform">emergency</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Emergency</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 transition-colors group">
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">report</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Report Hazard</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-primary/5 transition-colors group">
                <span className="material-symbols-outlined text-primary mb-2 group-hover:scale-110 transition-transform">watch</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">IoT Band</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex-grow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0">Nearby Alerts</h3>
              <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-wider">3 New</span>
            </div>
            <div className="space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800 rounded-lg flex gap-3">
                <span className="material-symbols-outlined text-amber-500 text-xl">warning</span>
                <div>
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-400 m-0">Congestion: Old Market</p>
                  <p className="text-[11px] text-amber-800/70 dark:text-amber-400/70 m-0 mt-1">High tourist influx. Expected delay: 20 mins.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex gap-3">
                <span className="material-symbols-outlined text-primary text-xl">info</span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 m-0">Weather Update</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 m-0 mt-1">Light snowfall predicted at 5:00 PM.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex gap-3 opacity-60">
                <span className="material-symbols-outlined text-slate-400 text-xl">cloud_off</span>
                <div>
                  <p className="text-xs font-bold text-slate-400 m-0">Route Clearance</p>
                  <p className="text-[11px] text-slate-400 m-0 mt-1">Maintenance on NH-13 complete.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-24 md:bottom-10 right-10 z-[100] group">
        <div className="absolute -inset-4 bg-red-600/20 rounded-full blur-xl group-hover:bg-red-600/40 transition-all duration-500"></div>
        <button className="relative bg-red-600 text-white size-24 rounded-full flex flex-col items-center justify-center shadow-2xl sos-pulse hover:bg-red-700 active:scale-95 transition-all outline-none border-none">
          <span className="material-symbols-outlined text-4xl mb-1">notifications_active</span>
          <span className="text-[10px] font-black uppercase tracking-widest leading-none">Hold for SOS</span>
        </button>
      </div>
    </div>
  );
}
