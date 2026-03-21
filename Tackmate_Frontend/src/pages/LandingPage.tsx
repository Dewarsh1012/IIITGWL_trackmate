import { Link, useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/5 bg-background-dark/80 backdrop-blur-md px-6 md:px-20 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-lg bg-primary text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-2xl font-bold">shield_person</span>
            </div>
            <h2 className="text-slate-100 text-xl font-extrabold tracking-tight">Trackmate</h2>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a className="text-slate-400 hover:text-white transition-colors text-sm font-semibold" href="#">Solutions</a>
            <a className="text-slate-400 hover:text-white transition-colors text-sm font-semibold" href="#">Safety Map</a>
            <a className="text-slate-400 hover:text-white transition-colors text-sm font-semibold" href="#">AI Detection</a>
            <a className="text-slate-400 hover:text-white transition-colors text-sm font-semibold" href="#">Blockchain ID</a>
          </nav>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/auth?mode=login')} className="hidden sm:flex items-center justify-center text-slate-300 text-sm font-bold hover:text-white transition-all">
              Login
            </button>
            <button onClick={() => navigate('/auth')} className="flex min-w-[120px] items-center justify-center rounded-lg h-10 px-5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-sm font-bold shadow-lg shadow-blue-500/30 transition-all border border-blue-400/20">
              Get Started
            </button>
          </div>
        </header>

        <main className="flex-1">
          <section className="hero-gradient relative flex flex-col items-center justify-center px-6 py-24 md:py-32 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-400/20 rounded-full blur-[120px]"></div>
              <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px]"></div>
            </div>
            <div className="relative z-10 max-w-4xl mx-auto space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
                <span className="material-symbols-outlined text-sm text-blue-300">auto_awesome</span>
                Unified Civic OS
              </div>
              <h1 className="text-slate-100 text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
                Safety Intelligence for Everyone <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">Who Lives Here.</span>
              </h1>
              <p className="text-blue-100/70 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                The next generation of urban security. Connecting residents, tourists, and authorities through a secure, AI-powered decentralised infrastructure.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
                <button onClick={() => navigate('/auth')} className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl h-14 px-10 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 hover:brightness-110 text-white text-base font-bold shadow-2xl shadow-blue-500/40 transition-all">
                  <span>Get Started</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button className="w-full sm:w-auto flex items-center justify-center rounded-xl h-14 px-10 border-2 border-white/90 hover:bg-white/10 text-white text-base font-bold transition-all backdrop-blur-sm">
                  Verify an ID
                </button>
              </div>
            </div>
          </section>

          <section className="px-6 md:px-20 py-24 bg-[#0F172A] relative">
            <div className="mb-16 text-center md:text-left">
              <h2 className="text-slate-100 text-3xl md:text-4xl font-black tracking-tight">Choose Your Role</h2>
              <p className="text-slate-400 mt-3 text-lg">Tailored experiences for every citizen and visitor.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <Link to="/auth?role=tourist" className="glass-card-enhanced glow-blue p-8 rounded-2xl flex flex-col items-start gap-5 hover:scale-[1.02] transition-all group">
                <div className="p-4 rounded-xl bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-4xl font-light">travel_explore</span>
                </div>
                <h3 className="text-white text-2xl font-bold">Tourist</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Travel with peace of mind using real-time safety alerts, verified guides, and instant language support.</p>
              </Link>
              
              <Link to="/auth?role=resident" className="glass-card-enhanced glow-green p-8 rounded-2xl flex flex-col items-start gap-5 hover:scale-[1.02] transition-all group">
                <div className="p-4 rounded-xl bg-green-500/20 text-green-400 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-4xl font-light">location_city</span>
                </div>
                <h3 className="text-white text-2xl font-bold">Resident</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Protect your neighborhood, access local services, and report incidents with guaranteed privacy protection.</p>
              </Link>
              
              <Link to="/auth?role=business" className="glass-card-enhanced glow-amber p-8 rounded-2xl flex flex-col items-start gap-5 hover:scale-[1.02] transition-all group">
                <div className="p-4 rounded-xl bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-4xl font-light">storefront</span>
                </div>
                <h3 className="text-white text-2xl font-bold">Business</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Secure your premises with AI-driven threat detection and automated compliance reporting systems.</p>
              </Link>
              
              <Link to="/auth?role=authority" className="glass-card-enhanced glow-purple p-8 rounded-2xl flex flex-col items-start gap-5 hover:scale-[1.02] transition-all group">
                <div className="p-4 rounded-xl bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                  <span className="material-symbols-outlined text-4xl font-light">gavel</span>
                </div>
                <h3 className="text-white text-2xl font-bold">Authority</h3>
                <p className="text-slate-300 text-sm leading-relaxed">Unified command and control for civic safety management with real-time analytics and data sharing.</p>
              </Link>
            </div>
          </section>

          <section className="px-6 md:px-20 py-24 bg-[#0B1120]">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-16">
              <div className="max-w-2xl">
                <h2 className="text-white text-4xl md:text-5xl font-black leading-tight mb-6">Advanced Safety Features</h2>
                <p className="text-slate-400 text-lg leading-relaxed">Powered by proprietary AI models and tamper-proof Blockchain technology for maximum reliability and public trust.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold flex items-center gap-2 border border-blue-500/20">
                  <span className="material-symbols-outlined text-sm">hub</span> AI ENGINE
                </span>
                <span className="px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold flex items-center gap-2 border border-indigo-500/20">
                  <span className="material-symbols-outlined text-sm">database</span> BLOCKCHAIN
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group border border-white/10 bg-white/5 p-8 rounded-2xl hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-300">
                <div className="mb-6">
                  <span className="material-symbols-outlined text-4xl font-bold bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent">map</span>
                </div>
                <h4 className="text-white text-xl font-bold mb-3">Live Map Interface</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">Real-time geospatial visualization of city-wide safety data with heatmaps and predictive routing.</p>
                <img alt="Map ui" className="w-full h-40 object-cover rounded-xl opacity-40 group-hover:opacity-80 transition-opacity border border-white/5" src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=800"/>
              </div>
              
              <div className="group border border-white/10 bg-white/5 p-8 rounded-2xl hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-300">
                <div className="mb-6">
                  <span className="material-symbols-outlined text-4xl font-bold bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent">psychology</span>
                </div>
                <h4 className="text-white text-xl font-bold mb-3">AI Threat Detection</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">Automated identification of anomalies and potential risks before they escalate into emergencies.</p>
                <div className="mt-4 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      <span>Anomaly Scan</span>
                      <span>94%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-[94%] group-hover:brightness-125 transition-all"></div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                      <span>Pattern Match</span>
                      <span>78%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-[78%] group-hover:brightness-125 transition-all"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group border border-white/10 bg-white/5 p-8 rounded-2xl hover:bg-white/[0.08] hover:border-blue-500/30 transition-all duration-300">
                <div className="mb-6">
                  <span className="material-symbols-outlined text-4xl font-bold bg-gradient-to-br from-blue-400 to-indigo-600 bg-clip-text text-transparent">fingerprint</span>
                </div>
                <h4 className="text-white text-xl font-bold mb-3">Blockchain ID</h4>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">Decentralised identity management that puts users in control of their sensitive personal information.</p>
                <div className="mt-8 flex justify-center py-4">
                  <div className="size-20 rounded-2xl border-2 border-blue-500/30 border-dashed flex items-center justify-center group-hover:border-blue-400 transition-colors">
                    <span className="material-symbols-outlined text-3xl text-blue-400 group-hover:scale-110 transition-transform">lock</span>
                  </div>
                </div>
              </div>

            </div>
          </section>
        </main>

        <footer className="bg-background-dark border-t border-white/5 px-6 md:px-20 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-8 rounded bg-primary text-white">
                  <span className="material-symbols-outlined text-lg">shield_person</span>
                </div>
                <h2 className="text-slate-100 text-lg font-bold tracking-tight">Trackmate</h2>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed">Building the foundation for safe, resilient cities of tomorrow. Empowering individuals and communities through technology.</p>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold">Platform</h4>
              <ul className="space-y-2 text-slate-500 text-sm font-medium">
                <li><a className="hover:text-primary transition-colors" href="#">Solutions</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Security Map</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Verify Identity</a></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-white font-bold">Company</h4>
              <ul className="space-y-2 text-slate-500 text-sm font-medium">
                <li><a className="hover:text-primary transition-colors" href="#">About Us</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Data Privacy</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
            <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">© 2026 Trackmate Civic OS. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-green-500/10 text-green-500 text-[10px] font-bold tracking-widest border border-green-500/20">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span> SYSTEM ONLINE
              </div>
              <div className="px-3 py-1 rounded bg-slate-800 text-slate-400 text-[10px] font-bold tracking-widest border border-slate-700">
                V.3.0.42-STABLE
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
