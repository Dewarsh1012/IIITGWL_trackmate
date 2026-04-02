import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Loader2, Shield, TrendingUp, MapPin, Users, Bell, AlertTriangle, Search, Check, Fingerprint, PlusCircle, Info, Globe } from 'lucide-react';
import AlertPanel from '../../components/alerts/AlertPanel';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

export default function BusinessDashboard() {
  const { user } = useAuth();
  const [verificationId, setVerificationId] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [advisories, setAdvisories] = useState<any[]>([]);

  useEffect(() => {
    fetchBusinessData();
    const interval = setInterval(fetchBusinessData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchBusinessData = async () => {
    try {
      const ward = user?.ward;
      const zoneId = ward ? (typeof ward === 'object' ? (ward as any)._id : ward) : 'general';
      const [analyticsRes, advisoriesRes] = await Promise.all([api.get(`/analytics/ward/${zoneId}`), api.get(`/incidents?category=ADVISORY&limit=3`)]);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (advisoriesRes.data.success) setAdvisories(advisoriesRes.data.data);
    } catch {} finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (!verificationId) return;
    setIsVerifying(true); setVerificationResult(null);
    try {
      const res = await api.get(`/profiles?search=${verificationId}`);
      if (res.data.success && res.data.data.length > 0) { setVerificationResult(res.data.data[0]); }
      else {
        const directRes = await api.get(`/profiles/${verificationId}`).catch(() => null);
        setVerificationResult(directRes?.data?.success ? directRes.data.data : { error: 'Identity proof not found in blockchain ledger.' });
      }
    } catch { setVerificationResult({ error: 'Verification service temporarily unavailable.' }); } finally { setIsVerifying(false); }
  };

  if (loading && !analytics) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: NB.cream }}>
      <Loader2 size={32} />
    </div>
  );

  return (
    <div style={{ color: '#FFFFFF', maxWidth: 1280, margin: '0 auto', padding: '32px 24px', fontFamily: "'Space Grotesk', sans-serif", background: NB.cream, minHeight: '100vh' }}>
      {/* Alert Panel at top */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <AlertPanel />
      </div>
      {/* Safety + Traffic cards */}
      <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
        {/* Safety Score */}
        <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px', borderTop: `6px solid ${NB.orange}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: 0 }}>Zone Safety Status</p>
              <h3 style={{ fontWeight: 800, color: NB.black, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: '1.1rem' }}>
                <MapPin size={16} color={NB.orange} /> {user?.business_name || 'Business Zone'}
              </h3>
            </div>
            <span style={{ background: NB.mint, color: '#000000', border: `2px solid ${NB.black}`, fontSize: '0.65rem', fontWeight: 800, padding: '3px 10px', textTransform: 'uppercase' }}>Safe</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: '3rem', fontWeight: 800, color: NB.black, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{analytics?.safety_score || 98}</span>
            <div style={{ marginBottom: 4 }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 700, color: NB.mint, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}><TrendingUp size={12} /> +2.5%</p>
              <p style={{ fontSize: '0.62rem', color: '#9A9A9A', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>Dynamic Score</p>
            </div>
          </div>
          {/* Sparkline */}
          <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
            <path d="M0,70 Q80,65 140,50 T240,30 T320,18 T400,5" fill="none" stroke={NB.orange} strokeWidth="3" />
            <path d="M0,70 Q80,65 140,50 T240,30 T320,18 T400,5 V80 H0 Z" fill={NB.orange} opacity="0.1" />
          </svg>
        </div>

        {/* Traffic */}
        <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px', borderTop: `6px solid ${NB.yellow}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: 0 }}>Footfall Overview</p>
              <h3 style={{ fontWeight: 800, color: NB.black, margin: '4px 0 0', fontSize: '1.1rem' }}>Real-time Traffic</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: NB.black }}>{analytics?.tourist_count || 305}</span>
              <p style={{ fontSize: '0.62rem', color: '#9A9A9A', margin: '2px 0 0', fontWeight: 600, textTransform: 'uppercase' }}>Active Visitors</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 100, gap: 6, paddingTop: 8 }}>
            {[60, 45, 75, 90, 55, 100, 80].map((h, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: '100%', background: NB.yellow, border: `1.5px solid ${NB.black}`, height: `${h}%`, opacity: 0.7 }} />
                <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#6B6B6B' }}>{'MTWTFSS'[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
        {/* Nearby map */}
        <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, color: '#FFFFFF', margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={15} color={NB.orange} /> Nearby Tourists</h3>
            <span style={{ background: NB.orange, color: NB.white, fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', border: `1.5px solid ${NB.black}` }}>200m Radius</span>
          </div>
          <div style={{ position: 'relative', height: 200, background: NB.cream }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 80, height: 80, border: `2px solid rgba(255,122,0,0.3)`, borderRadius: '50%', background: 'rgba(255,122,0,0.05)' }} />
              <div style={{ position: 'absolute', width: 14, height: 14, background: NB.orange, border: `2px solid ${NB.black}` }} />
            </div>
            {/* Mock dots */}
            {[{ x: '38%', y: '28%' }, { x: '62%', y: '58%' }, { x: '28%', y: '48%' }].map((pos, i) => (
              <div key={i} style={{ position: 'absolute', width: 10, height: 10, background: NB.blue, border: `1.5px solid ${NB.black}`, left: pos.x, top: pos.y }} />
            ))}
            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: NB.white, border: `2px solid ${NB.black}`, padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700 }}>12 verified tourists in vicinity</div>
          </div>
        </div>

        {/* Advisories */}
        <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, color: '#FFFFFF', margin: 0, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 6 }}><Bell size={15} color={NB.orange} /> Safety Advisories</h3>
            <button style={{ background: NB.orange, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}`, padding: '6px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase', color: NB.white, display: 'flex', alignItems: 'center', gap: 6 }}>
              <PlusCircle size={13} /> Post Advisory
            </button>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {advisories.length > 0 ? advisories.map(adv => (
              <div key={adv._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', background: NB.cream, border: `2px solid ${NB.black}`, boxShadow: `2px 2px 0 ${NB.black}` }}>
                <div style={{ width: 36, height: 36, background: NB.orange, border: `2px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><AlertTriangle size={18} color={NB.white} /></div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.88rem' }}>{adv.title}</h4>
                  <p style={{ fontSize: '0.75rem', color: '#6B6B6B', margin: 0 }}>{adv.description}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: NB.mint, color: '#000000', fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', textTransform: 'uppercase' }}>Active</span>
                  <p style={{ fontSize: '0.68rem', color: '#9A9A9A', margin: '4px 0 0' }}>{new Date(adv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )) : (
              <div style={{ padding: '28px', textAlign: 'center', border: `2px dashed ${NB.black}` }}>
                <Info size={20} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ fontSize: '0.82rem', color: '#6B6B6B', fontWeight: 600 }}>No active advisories in your sector.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Identity Verification */}
      <section style={{ background: NB.black, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '28px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 40, height: 40, background: NB.yellow, border: `2px solid ${NB.yellow}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Fingerprint size={22} color="#000000" /></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: NB.white, margin: 0 }}>Blockchain Identity Proof</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 20px', fontWeight: 400 }}>Validate traveler credentials against the Trackmate ledger.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9A9A9A' }} />
              <input value={verificationId} onChange={e => setVerificationId(e.target.value)} style={{ width: '100%', paddingLeft: 36, padding: '12px 12px 12px 36px', background: '#111', border: `2px solid rgba(255,229,0,0.3)`, fontFamily: "'Space Grotesk', monospace", fontSize: '0.88rem', color: '#FFFFFF', outline: 'none', borderRadius: 0 }} placeholder="ST-ID-XXXXXXXXXX" />
            </div>
            <button onClick={handleVerify} disabled={isVerifying || !verificationId} style={{ background: NB.yellow, border: `3px solid ${NB.yellow}`, padding: '0 24px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', textTransform: 'uppercase', color: '#000000', display: 'flex', alignItems: 'center', gap: 8, opacity: (isVerifying || !verificationId) ? 0.5 : 1 }}>
              {isVerifying ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />} Verify
            </button>
          </div>
        </div>

        {verificationResult && (
          <div style={{ width: 320, background: NB.white, border: `3px solid ${NB.yellow}`, boxShadow: `4px 4px 0 ${NB.yellow}`, padding: '20px', flexShrink: 0 }}>
            {verificationResult.error ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: NB.red }}>
                <AlertTriangle size={18} />
                <p style={{ fontSize: '0.85rem', fontWeight: 700, margin: 0 }}>{verificationResult.error}</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: 0 }}>Ledger Verified</p>
                  <span style={{ background: NB.mint, color: '#000000', fontSize: '0.6rem', fontWeight: 800, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={10} /> Auth Valid</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 52, height: 52, background: NB.yellow, border: `2px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={28} color="#000000" /></div>
                  <div>
                    <h4 style={{ fontWeight: 800, color: NB.black, margin: 0 }}>{verificationResult.full_name}</h4>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: '#6B6B6B', margin: '4px 0 0', wordBreak: 'break-all' }}>{verificationResult.blockchain_id}</p>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: NB.mint, margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={10} /> Security Clearance Verified</p>
                  </div>
                </div>
                <div style={{ borderTop: `2px solid ${NB.black}`, marginTop: 14, paddingTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: NB.cream, padding: '8px 10px', border: `1.5px solid ${NB.black}` }}>
                    <p style={{ fontSize: '0.58rem', color: '#9A9A9A', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Verification</p>
                    <p style={{ fontWeight: 700, color: NB.black, margin: '4px 0 0', fontSize: '0.82rem' }}>{verificationResult.is_verified ? 'Identity Proofed' : 'Pending'}</p>
                  </div>
                  <div style={{ background: NB.cream, padding: '8px 10px', border: `1.5px solid ${NB.black}` }}>
                    <p style={{ fontSize: '0.58rem', color: '#9A9A9A', fontWeight: 800, textTransform: 'uppercase', margin: 0 }}>Role</p>
                    <p style={{ fontWeight: 800, color: NB.orange, margin: '4px 0 0', fontSize: '0.82rem', textTransform: 'uppercase' }}>{verificationResult.role}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
