import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';

export default function VerifyPage() {
  const { blockchainId } = useParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Mock the verification process
    const timer = setTimeout(() => {
      if (blockchainId?.startsWith('ST-')) {
        setResult({
          status: 'valid',
          name: 'Sarah J. Miller',
          id: blockchainId,
          nationality: 'Canada',
          tier: 'Gold Elite',
          issuedAt: '2026-03-10',
          expiresAt: '2026-06-10'
        });
      } else {
        setResult({
          status: 'invalid',
          id: blockchainId
        });
      }
      setIsVerifying(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [blockchainId]);

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-6 font-['Outfit',_sans-serif]">
      {/* Background topographic pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #1db954 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center text-[#00d4aa] mb-8 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Home
        </Link>
        
        <div className="bg-[#112240]/80 backdrop-blur-xl border border-[rgba(0,212,170,0.2)] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1db954] via-[#e8a838] to-[#ff4757]"></div>
          
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-[#0a1628] border border-[rgba(0,212,170,0.3)] rounded-full flex items-center justify-center mb-4 text-[#00d4aa] shadow-[0_0_15px_rgba(0,212,170,0.2)]">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">SafeTravel ID Verification</h1>
            <p className="text-[#8892b0] font-mono text-sm">Blockchain Identity Lookup</p>
          </div>

          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#00d4aa]">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-mono text-sm animate-pulse">Verifying cryptographic hash on mainnet...</p>
            </div>
          ) : result?.status === 'valid' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#0a1628] border border-[#1db954]/30 rounded-xl p-6 relative">
                <div className="absolute top-4 right-4 text-[#1db954]">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-lg bg-[#112240] flex items-center justify-center text-xl font-bold text-[#8892b0] border border-[rgba(0,212,170,0.3)]">
                    SM
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white leading-tight">{result.name}</h2>
                    <p className="text-[#1db954] font-mono text-xs mt-1">✓ Identity Verified</p>
                  </div>
                </div>
                
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between border-b border-[#112240] pb-2">
                    <span className="text-[#8892b0]">Blockchain ID</span>
                    <span className="text-[#00d4aa]">{result.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#112240] pb-2">
                    <span className="text-[#8892b0]">Nationality</span>
                    <span className="text-white">{result.nationality}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#112240] pb-2">
                    <span className="text-[#8892b0]">Safety Tier</span>
                    <span className="text-[#e8a838]">{result.tier}</span>
                  </div>
                  <div className="flex justify-between pt-2">
                    <span className="text-[#8892b0]">Valid Until</span>
                    <span className="text-white">{result.expiresAt}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-[#ff4757]/10 border border-[#ff4757]/30 rounded-xl p-6 text-center">
                <XCircle className="w-16 h-16 text-[#ff4757] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Verification Failed</h2>
                <p className="text-[#8892b0] mb-4">The provided SafeTravel ID could not be found or is cryptographically invalid.</p>
                <div className="bg-[#0a1628] border border-[#ff4757]/20 p-3 rounded font-mono text-xs text-[#ff4757]">
                  ID: {result?.id || 'Unknown'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
