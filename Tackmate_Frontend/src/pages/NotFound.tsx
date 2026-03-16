import { Link } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-6 font-['Outfit',_sans-serif]">
      {/* Background topographic pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1db954 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="w-full max-w-lg relative z-10 text-center">
        <div className="relative inline-block mb-8">
          <div className="absolute inset-0 bg-[#00d4aa] blur-[60px] opacity-20 rounded-full animate-pulse"></div>
          <Compass className="w-32 h-32 text-[#00d4aa] relative z-10 animate-[spin_10s_linear_infinite] opacity-80" />
        </div>
        
        <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#1db954] to-[#00d4aa] mb-4 tracking-tighter mix-blend-screen">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-white mb-6">Off the Grid</h2>
        <p className="text-[#8892b0] text-lg mb-10 max-w-md mx-auto">
          The coordinate you are looking for does not exist in our geospatial database. You might have strayed into an unmapped zone.
        </p>

        <Link to="/" className="inline-flex items-center justify-center gap-2 bg-[#00d4aa] hover:bg-[#1db954] text-[#0a1628] font-bold px-8 py-4 rounded-xl transition-all shadow-[0_4px_20px_rgba(0,212,170,0.3)] hover:shadow-[0_4px_30px_rgba(29,185,84,0.5)] transform hover:-translate-y-1">
          <ArrowLeft className="w-5 h-5" />
          Recalibrate to Base
        </Link>
      </div>
    </div>
  );
}
