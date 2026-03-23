import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Shield, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../lib/api';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

export default function VerifyPage() {
  const { blockchainId } = useParams();
  const [isVerifying, setIsVerifying] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const runVerification = async () => {
        try {
            const res = await api.get(`/verify/${blockchainId}`);
            if (res.data.success) {
                setResult(res.data.data);
            }
        } catch (err) {
            console.error('Verification error:', err);
            setResult({ valid: false });
        } finally {
            setIsVerifying(false);
        }
    };

    if (blockchainId) runVerification();
  }, [blockchainId]);

  return (
    <div style={{ minHeight: '100vh', background: NB.mint, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif" }}>
      <div className="responsive-container" style={{ width: '100%', maxWidth: 500 }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', fontWeight: 800, color: NB.black, textDecoration: 'none', marginBottom: 24, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          <ArrowLeft size={18} style={{ marginRight: 8 }} />
          Back to Home
        </Link>
        
        <div style={{ background: NB.white, border: `4px solid ${NB.black}`, boxShadow: `8px 8px 0 ${NB.black}`, padding: 32, position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ margin: '0 auto 16px', width: 64, height: 64, background: NB.yellow, border: `3px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `4px 4px 0 ${NB.black}` }}>
              <Shield size={32} color={NB.black} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: NB.black, margin: '0 0 8px', textTransform: 'uppercase' }}>Trackmate ID</h1>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Blockchain Identity Lookup</p>
          </div>

          {isVerifying ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', borderTop: `3px solid ${NB.black}` }}>
              <Loader2 size={48} color={NB.blue} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
              <p style={{ margin: 0, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', fontSize: '0.85rem' }}>Verifying Hash...</p>
            </div>
          ) : result?.valid ? (
            <div style={{ borderTop: `3px solid ${NB.black}`, paddingTop: 24 }}>
              <div style={{ background: NB.cream, border: `3px solid ${NB.black}`, padding: 24, position: 'relative' }}>
                <div style={{ position: 'absolute', top: -16, right: -16, background: NB.mint, border: `3px solid ${NB.black}`, borderRadius: '50%', padding: 4, display: 'flex' }}>
                  <CheckCircle2 size={28} color={NB.black} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 56, height: 56, background: NB.blue, border: `3px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: NB.white }}>
                    {result.name?.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px', color: NB.black }}>{result.name}</h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: NB.mint, textTransform: 'uppercase', letterSpacing: '0.05em', background: NB.black, padding: '4px 8px' }}>
                       Verified
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 700 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${NB.black}`, paddingBottom: 8 }}>
                    <span style={{ color: '#666' }}>Blockchain ID</span>
                    <span style={{ color: NB.blue }}>{result.blockchain_id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${NB.black}`, paddingBottom: 8 }}>
                    <span style={{ color: '#666' }}>System Role</span>
                    <span style={{ textTransform: 'uppercase' }}>{result.role}</span>
                  </div>
                  {result.trip && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${NB.black}`, paddingBottom: 8 }}>
                        <span style={{ color: '#666' }}>Destination</span>
                        <span style={{ color: NB.orange }}>{result.trip.destination_region}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8 }}>
                        <span style={{ color: '#666' }}>Valid Until</span>
                        <span>{new Date(result.trip.valid_to).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ borderTop: `3px solid ${NB.black}`, paddingTop: 24 }}>
              <div style={{ background: NB.red, border: `3px solid ${NB.black}`, padding: 24, textAlign: 'center', color: NB.white }}>
                <XCircle size={48} style={{ margin: '0 auto 16px' }} />
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase' }}>Verification Failed</h2>
                <p style={{ margin: '0 0 16px', fontWeight: 600, fontSize: '0.85rem' }}>ID not found or expired.</p>
                <div style={{ background: NB.black, padding: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem', fontWeight: 700 }}>
                  ID: {blockchainId || 'Unknown'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
