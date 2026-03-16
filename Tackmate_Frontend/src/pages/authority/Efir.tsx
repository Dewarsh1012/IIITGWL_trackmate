import { useState } from 'react';
import { ShieldAlert, Search, Bell, Copy, Plus, Trash2, Upload, Eye, Send, Save, CheckCircle2, MapPin, Calendar, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function AuthorityEfir() {
  const { user } = useAuth();
  const [status, setStatus] = useState('draft'); // draft, submitted, review, resolved, closed

  const steps = [
    { id: 'draft', label: 'Draft', desc: 'Currently Editing' },
    { id: 'submitted', label: 'Submitted', desc: 'Pending' },
    { id: 'review', label: 'Under Review', desc: 'Pending' },
    { id: 'resolved', label: 'Resolved', desc: 'Pending' },
    { id: 'closed', label: 'Closed', desc: 'Pending' }
  ];

  const getStepIndex = (id: string) => steps.findIndex(s => s.id === id);
  const currentIndex = getStepIndex(status);

  return (
    <div className="bg-background-light dark:bg-[#0F172A] font-['Inter',_sans-serif] text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/authority/dashboard" className="flex items-center gap-3 text-primary no-underline">
              <span className="material-symbols-outlined text-3xl m-0 leading-none">security</span>
              <h2 className="text-xl font-bold tracking-tight m-0 text-slate-900 dark:text-white">SafeTravel <span className="text-slate-400 font-medium text-sm">v3.0</span></h2>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/authority/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors no-underline">Dashboard</Link>
              <Link to="/authority/efir" className="text-primary text-sm font-semibold border-b-2 border-primary py-5 no-underline">FIR Records</Link>
              <Link to="/authority/analytics" className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors no-underline">Analytics</Link>
              <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary text-sm font-medium transition-colors no-underline">Settings</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm leading-none m-0">search</span>
              <input className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary outline-none" placeholder="Search records..." type="text" />
            </div>
            <button className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 outline-none border-none bg-transparent">
              <span className="material-symbols-outlined m-0 leading-none">notifications</span>
            </button>
            <div className="size-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white border border-primary/20">
              KD
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Workflow Pipeline */}
        <div className="grid grid-cols-5 gap-4 mb-10">
          {steps.map((step, idx) => {
            const isActive = idx === currentIndex;
            const isPast = idx < currentIndex;
            
            return (
              <div key={step.id} className="flex flex-col gap-2">
                <div className={`h-1.5 w-full rounded-full ${isActive || isPast ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm m-0 leading-none ${isActive || isPast ? 'text-primary' : 'text-slate-500'}`}>
                    {isActive ? 'radio_button_checked' : isPast ? 'check_circle' : 'circle'}
                  </span>
                  <span className={`text-xs font-bold uppercase tracking-wider ${isActive || isPast ? 'text-primary' : 'text-slate-500'}`}>{step.label}</span>
                </div>
                <p className="text-[10px] text-slate-500 uppercase ml-6 m-0">{isActive ? 'Currently Editing' : isPast ? 'Completed' : 'Pending'}</p>
              </div>
            );
          })}
        </div>

        <h1 className="text-2xl font-bold mb-8 m-0 text-slate-900 dark:text-white">Electronic FIR Filing <span className="text-slate-500 font-normal m-0">#E-FIR-2026-8832</span></h1>
        
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column: Form Sections */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* 1. Subject Information */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary m-0 leading-none">person</span>
                  <h3 className="font-semibold text-lg m-0 dark:text-white text-slate-900">Subject Information</h3>
                </div>
                <span className="px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-500 text-[10px] font-bold rounded uppercase tracking-widest leading-none">Verified Identity</span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">Full Name</label>
                  <p className="text-lg font-medium m-0 text-slate-900 dark:text-white">Raj Sharma</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">Blockchain ID</label>
                  <div className="flex items-center gap-2">
                     <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-primary font-mono text-sm leading-none m-0">BC-7a3f-8891-2290</code>
                     <span className="material-symbols-outlined text-slate-400 text-sm cursor-pointer m-0 leading-none bg-transparent hover:text-primary transition-colors">content_copy</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">Nationality</label>
                  <p className="text-sm m-0 text-slate-800 dark:text-slate-200">Indian (Passport ending in *9921)</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider m-0">Contact</label>
                  <p className="text-sm m-0 text-slate-800 dark:text-slate-200">+91 987xx xxxx0</p>
                </div>
              </div>
            </section>
            
            {/* 2. Incident Details */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
                <span className="material-symbols-outlined text-primary m-0 leading-none">report_problem</span>
                <h3 className="font-semibold text-lg m-0 text-slate-900 dark:text-white">Incident Details</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                     <label className="text-sm font-medium m-0 text-slate-900 dark:text-white">FIR Title</label>
                     <input className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary outline-none px-4 py-2" type="text" defaultValue="Unauthorized Luggage Access" />
                  </div>
                  <div className="flex flex-col gap-2">
                     <label className="text-sm font-medium m-0 text-slate-900 dark:text-white">Incident Type</label>
                     <select className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary outline-none px-4 py-2 appearance-none">
                        <option>Theft/Larceny</option>
                        <option>Assault</option>
                        <option>Cybercrime</option>
                        <option>Harassment</option>
                     </select>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium m-0 text-slate-900 dark:text-white">Description</label>
                  <textarea className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-primary focus:border-primary outline-none px-4 py-3 resize-y" placeholder="Describe the incident in detail..." rows={4}></textarea>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium m-0 text-slate-900 dark:text-white">Location Coordinates</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm m-0 leading-none">location_on</span>
                      <input className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg pl-10 px-4 py-2 focus:ring-primary focus:border-primary outline-none" type="text" defaultValue="28.6139° N, 77.2090° E" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium m-0 text-slate-900 dark:text-white">Incident Date & Time</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm m-0 leading-none z-10">calendar_month</span>
                      <input className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg pl-10 px-4 py-2 focus:ring-primary focus:border-primary outline-none relative z-0 appearance-none" type="datetime-local" defaultValue="2026-03-15T14:30" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Witness Statements */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary m-0 leading-none">groups</span>
                  <h3 className="font-semibold text-lg m-0 text-slate-900 dark:text-white">Witness Statements</h3>
                </div>
                <button className="flex items-center gap-2 text-primary text-sm font-bold hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors outline-none border-none bg-transparent">
                  <span className="material-symbols-outlined text-sm m-0 leading-none">add</span>
                  Add Witness
                </button>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Witness Name</th>
                        <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                        <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Brief Statement</th>
                        <th className="pb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     <tr className="group">
                        <td className="py-4 font-medium text-slate-800 dark:text-slate-200">Amit Verma</td>
                        <td className="py-4 text-sm text-slate-500">+91 999xx xxxx1</td>
                        <td className="py-4 text-sm max-w-xs truncate text-slate-400 italic">"Saw the suspect near the baggage carousel at 2:15 PM..."</td>
                        <td className="py-4 text-right">
                           <button className="text-slate-400 hover:text-red-500 outline-none border-none bg-transparent m-0 p-0 flex items-center justify-end w-full"><span className="material-symbols-outlined text-sm m-0 leading-none">delete</span></button>
                        </td>
                     </tr>
                     <tr className="group">
                        <td className="py-4 font-medium text-slate-800 dark:text-slate-200">Suresh Iyer</td>
                        <td className="py-4 text-sm text-slate-500">+91 999xx xxxx4</td>
                        <td className="py-4 text-sm max-w-xs truncate text-slate-400 italic">"Confirmed that the bag was locked before the flight..."</td>
                        <td className="py-4 text-right">
                           <button className="text-slate-400 hover:text-red-500 outline-none border-none bg-transparent m-0 p-0 flex items-center justify-end w-full"><span className="material-symbols-outlined text-sm m-0 leading-none">delete</span></button>
                        </td>
                     </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Right Column: Evidence & Submission */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* 4. Evidence */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
                <span className="material-symbols-outlined text-primary m-0 leading-none">attachment</span>
                <h3 className="font-semibold text-lg m-0 text-slate-900 dark:text-white">Evidence</h3>
              </div>
              <div className="p-6 space-y-4">
                 <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center bg-slate-50 dark:bg-slate-900/20 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <span className="material-symbols-outlined text-4xl text-slate-400 m-0 leading-none">cloud_upload</span>
                    <div>
                       <p className="text-sm font-medium m-0 text-slate-800 dark:text-slate-200">Drag &amp; drop files here</p>
                       <p className="text-xs text-slate-500 mt-1 m-0">PNG, JPG or PDF up to 10MB</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer">
                       <div className="aspect-square bg-slate-100 dark:bg-slate-800 border-none m-0 p-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558227096-b08e705b4b1a?auto=format&fit=crop&q=80&w=300')" }}></div>
                       <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="size-8 bg-white dark:bg-slate-900 rounded-full text-slate-900 dark:text-slate-100 flex items-center justify-center outline-none border-none shadow-lg">
                             <span className="material-symbols-outlined text-sm m-0 leading-none">visibility</span>
                          </button>
                       </div>
                    </div>
                    <div className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 cursor-pointer">
                       <div className="aspect-square bg-slate-100 dark:bg-slate-800 bg-cover bg-center border-none m-0 p-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=300')" }}></div>
                       <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="size-8 bg-white dark:bg-slate-900 rounded-full text-slate-900 dark:text-slate-100 flex items-center justify-center outline-none border-none shadow-lg">
                             <span className="material-symbols-outlined text-sm m-0 leading-none">visibility</span>
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
            </section>

            {/* Submission UI */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
              <div className="space-y-4">
                 <button onClick={() => setStatus('submitted')} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 outline-none border-none">
                    <span className="material-symbols-outlined m-0 leading-none">send</span>
                    Submit FIR
                 </button>
                 <button className="w-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all text-slate-700 dark:text-slate-300 bg-transparent outline-none">
                    <span className="material-symbols-outlined m-0 leading-none">save</span>
                    Save as Draft
                 </button>
              </div>
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
                 <div className="flex items-center gap-2 text-slate-500 mb-2">
                    <span className="material-symbols-outlined text-sm m-0 leading-none">hub</span>
                    <span className="text-xs font-bold uppercase tracking-wider m-0">Blockchain Verification</span>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-400 m-0">Blockchain Hash (SHA-256)</label>
                    <div className="flex gap-2">
                       <input className="flex-1 bg-slate-50 dark:bg-[#0A0F1E] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono p-2 text-slate-500 truncate outline-none" readOnly type="text" value="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" />
                       <button className="bg-primary/10 text-primary px-3 py-1 rounded-lg hover:bg-primary/20 transition-colors outline-none border-none flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm m-0 leading-none">verified</span>
                       </button>
                    </div>
                 </div>
                 <p className="text-[10px] text-slate-500 italic m-0">This FIR will be cryptographically signed and anchored to the mainnet upon submission.</p>
              </div>
            </section>

            {/* Map Widget */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
               <div className="h-48 bg-slate-800 relative">
                  <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600')" }}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                     <div className="size-8 bg-primary rounded-full animate-pulse flex items-center justify-center border-4 border-white/20">
                        <div className="size-2 bg-white rounded-full"></div>
                     </div>
                  </div>
               </div>
               <div className="p-3 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase m-0 leading-none">Live Location Feed</span>
                  <span className="text-[10px] text-green-600 dark:text-green-500 flex items-center gap-1 m-0 leading-none">
                     <span className="size-1.5 bg-green-500 rounded-full"></span> Active
                  </span>
               </div>
            </section>
          </div>
        </div>
      </main>
      
      <footer className="max-w-[1280px] mx-auto px-6 py-8 border-t border-slate-200 dark:border-slate-800 text-center m-0">
        <p className="text-xs text-slate-500 m-0">© 2026 SafeTravel v3.0 Authority Portal. All cryptographic records are legally binding under Electronic Signature Acts.</p>
      </footer>
    </div>
  );
}
