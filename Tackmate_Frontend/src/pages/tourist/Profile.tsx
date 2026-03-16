import { useAuth } from '../../context/AuthContext';

export default function TouristProfile() {
  const { user } = useAuth();
  
  // Use user's initials
  const initials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'RS';

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:py-10 text-slate-900 dark:text-slate-100 font-['Inter',_sans-serif]">
      <div className="grid grid-cols-12 gap-8">
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-16 -mt-16"></div>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-primary to-emerald-400 p-1">
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center border-4 border-transparent">
                    <span className="text-4xl font-bold text-slate-800 dark:text-white">{initials}</span>
                  </div>
                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg border border-emerald-400">
                  <span className="material-symbols-outlined text-xs m-0">verified</span> VERIFIED
                </div>
              </div>
              <h2 className="text-2xl font-bold m-0">{user?.name || 'Raj Sharma'}</h2>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium tracking-widest uppercase">
                {user?.role || 'TOURIST'}
              </div>
              <div className="mt-8 w-full space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Member Since</span>
                  <span className="font-medium">Jan 2026</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Trips Completed</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Nationality</span>
                  <span className="font-medium">Indian</span>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-lg m-0">Safety Standing</h3>
              <span className="material-symbols-outlined text-primary m-0">info</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle className="text-slate-100 dark:text-slate-800" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeWidth="8"></circle>
                  <circle className="text-primary transition-all duration-1000 ease-out" cx="96" cy="96" fill="transparent" r="88" stroke="currentColor" strokeDasharray="552.92" strokeDashoffset="82.93" strokeLinecap="round" strokeWidth="8"></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-4xl font-black text-slate-900 dark:text-white">85%</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary mt-1">Good Standing</span>
                </div>
              </div>
              <div className="mt-8 w-full space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Points Breakdown</span>
                    <span className="text-xs font-bold text-emerald-500">+12 this trip</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span>Verified Identity</span>
                      <span className="font-mono text-xs">+500</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span>Safety Reports</span>
                      <span className="font-mono text-xs">+120</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span>Local Compliance</span>
                      <span className="font-mono text-xs">+230</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <div className="col-span-12 lg:col-span-8 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg m-0">Blockchain Digital ID</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors outline-none border-none text-slate-500 flex items-center justify-center">
                  <span className="material-symbols-outlined m-0">share</span>
                </button>
                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors outline-none border-none text-slate-500 flex items-center justify-center">
                  <span className="material-symbols-outlined m-0">download</span>
                </button>
              </div>
            </div>
            <div className="relative overflow-hidden aspect-[1.58/1] w-full max-w-2xl mx-auto rounded-2xl bg-slate-900 text-white p-6 md:p-8 shadow-2xl border border-slate-700">
              <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[120%] bg-blue-500/30 blur-[100px] rounded-full"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[80%] bg-emerald-500/20 blur-[80px] rounded-full"></div>
              </div>
              <div className="absolute inset-0 bg-transparent opacity-10" style={{ backgroundImage: "radial-gradient(var(--color-slate-700) 1px, transparent 1px)", backgroundSize: "10px 10px" }}></div>
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase m-0">SafeTravel Digital Identity</p>
                    <h4 className="text-2xl font-bold tracking-tight m-0">{user?.name || 'Raj Sharma'}</h4>
                  </div>
                  <div className="bg-primary/20 backdrop-blur-md border border-primary/30 px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                    VALID
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1 m-0">Blockchain Hash ID</p>
                      <p className="font-mono text-sm m-0">{user?.blockchain_id || 'BC-7a3f9e2b1c4d5678'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1 m-0">Government ID (Masked)</p>
                      <p className="font-mono text-sm tracking-widest m-0">**** **** 4523</p>
                    </div>
                    <div className="flex gap-8">
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1 m-0">Travel Dates</p>
                        <p className="text-sm font-medium m-0">Mar 1 – Mar 15, 2026</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 mb-1 m-0">Destination</p>
                        <p className="text-sm font-medium m-0">Tawang, India</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-center">
                    <div className="bg-white p-2 rounded-lg flex items-center justify-center">
                       <span className="material-symbols-outlined text-[80px] text-slate-900 m-0">qr_code_2</span>
                    </div>
                    <p className="mt-2 text-[9px] font-mono text-slate-400 m-0">ENCRYPTED PROTOCOL V3</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex gap-4">
              <button className="flex-1 bg-primary text-background-dark font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all border-none">
                <span className="material-symbols-outlined text-xl m-0">content_copy</span> Copy Blockchain ID
              </button>
              <button className="flex-1 border-2 border-slate-200 dark:border-slate-800 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-inherit">
                <span className="material-symbols-outlined text-xl m-0">qr_code_scanner</span> Show Full QR
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg m-0">Emergency Contacts</h3>
                <button className="text-primary hover:bg-primary/10 p-1 rounded-md transition-colors outline-none border-none flex items-center justify-center">
                  <span className="material-symbols-outlined m-0 leading-none">add_circle</span>
                </button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined m-0 text-xl">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold m-0">Anita Sharma</p>
                      <p className="text-[11px] text-slate-500 uppercase tracking-tight m-0 mt-0.5">Primary • Spouse</p>
                    </div>
                  </div>
                  <button className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-none outline-none">
                    <span className="material-symbols-outlined text-sm m-0">call</span>
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                      <span className="material-symbols-outlined m-0 text-xl">medical_services</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold m-0">Dr. R. Patel</p>
                      <p className="text-[11px] text-slate-500 uppercase tracking-tight m-0 mt-0.5">Medical • Family Doctor</p>
                    </div>
                  </div>
                  <button className="size-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-none outline-none">
                    <span className="material-symbols-outlined text-sm m-0">call</span>
                  </button>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
               <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-lg m-0">Language Preferences</h3>
                    <span className="material-symbols-outlined text-slate-400 m-0 leading-none">translate</span>
                  </div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block m-0">Primary Language</label>
                  <div className="relative w-full">
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg py-3 px-4 appearance-none focus:ring-primary focus:border-primary text-sm font-medium outline-none">
                      <option>English (US)</option>
                      <option>Hindi (भारत)</option>
                      <option>Spanish (ES)</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">expand_more</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="px-3 py-1 bg-primary/10 border border-primary/20 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-medium">English</span>
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium dark:text-slate-300">Hindi</span>
                  </div>
               </div>
            </section>
          </div>
          
          <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg m-0">Recent Trip Security Activity</h3>
              <a className="text-primary text-xs font-bold uppercase tracking-wider hover:underline" href="#">View All Logs</a>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="size-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-bold m-0 text-slate-800 dark:text-slate-200">Identity Verification via Blockchain</p>
                  <p className="text-xs text-slate-500 m-0 mt-1">Guwahati Airport Checkpoint • Mar 01, 2026, 09:45 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="size-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-bold m-0 text-slate-800 dark:text-slate-200">Emergency Contact Shared</p>
                  <p className="text-xs text-slate-500 m-0 mt-1">Hotel Blue Pine, Tawang • Mar 02, 2026, 06:12 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-4 opacity-50">
                <div className="size-2 rounded-full bg-slate-400 dark:bg-slate-600 mt-1.5 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-bold m-0 text-slate-600 dark:text-slate-400">Safety Score Recalculated</p>
                  <p className="text-xs text-slate-400 m-0 mt-1">System Update • Feb 28, 2026, 12:00 AM</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
