import { Link, useNavigate } from 'react-router-dom';
import { Shield, Zap, Map, Users, Building2, Lock, ArrowRight, CheckCircle } from 'lucide-react';

const NB = {
  black: '#0A0A0A',
  yellow: '#FFE500',
  red: '#FF3B3B',
  blue: '#2B6FFF',
  mint: '#00D084',
  orange: '#FF7A00',
  cream: '#FFFBF0',
  white: '#FFFFFF',
};

const roles = [
  {
    label: 'Tourist',
    role: 'tourist',
    icon: <Map size={28} color={NB.black} />,
    bg: NB.yellow,
    desc: 'Travel with confidence. Real-time safety alerts, verified guides & instant SOS.',
  },
  {
    label: 'Resident',
    role: 'resident',
    icon: <Users size={28} color={NB.white} />,
    bg: NB.blue,
    desc: 'Protect your neighbourhood. Report incidents & access local safety data.',
  },
  {
    label: 'Business',
    role: 'business',
    icon: <Building2 size={28} color={NB.black} />,
    bg: NB.mint,
    desc: 'AI-driven threat detection & automated compliance for your premises.',
  },
  {
    label: 'Authority',
    role: 'authority',
    icon: <Shield size={28} color={NB.white} />,
    bg: NB.black,
    desc: 'Unified command & control. Real-time analytics and E-FIR management.',
  },
];

const features = [
  {
    icon: <Map size={32} />,
    title: 'Live Safety Map',
    desc: 'Real-time heatmaps, zone alerts and predictive routing across the entire city.',
    accent: NB.yellow,
  },
  {
    icon: <Zap size={32} />,
    title: 'AI Threat Detection',
    desc: 'Proprietary models flag anomalies before they escalate — 94% accuracy rate.',
    accent: NB.red,
  },
  {
    icon: <Lock size={32} />,
    title: 'Blockchain Identity',
    desc: 'Decentralised ID management. You own your data, always.',
    accent: NB.blue,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div style={{ background: NB.cream, minHeight: '100vh', fontFamily: "'Space Grotesk', sans-serif", color: NB.black }}>

      {/* ── NAV ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: NB.black,
        borderBottom: `4px solid ${NB.black}`,
        padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, background: NB.yellow,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${NB.yellow}`,
          }}>
            <Shield size={20} color={NB.black} />
          </div>
          <span style={{ color: NB.white, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.04em' }}>
            TRACK<span style={{ color: NB.yellow }}>MATE</span>
          </span>
        </div>

        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => navigate('/auth?mode=login')}
            style={{
              background: 'transparent', border: `2px solid rgba(255,255,255,0.3)`,
              color: NB.white, padding: '8px 20px', fontFamily: 'inherit',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = NB.yellow)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
          >
            Login
          </button>
          <button
            onClick={() => navigate('/auth')}
            style={{
              background: NB.yellow, border: `2px solid ${NB.yellow}`,
              color: NB.black, padding: '8px 20px', fontFamily: 'inherit',
              fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              boxShadow: `3px 3px 0 ${NB.white}`,
              transition: 'all 0.1s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-1px,-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = `4px 4px 0 ${NB.white}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = `3px 3px 0 ${NB.white}`; }}
          >
            Get Started
          </button>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{
        padding: '80px 5% 72px',
        background: NB.black,
        borderBottom: `4px solid ${NB.black}`,
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Yellow accent blob */}
        <div style={{
          position: 'absolute', top: -60, right: '8%',
          width: 320, height: 320,
          background: NB.yellow, opacity: 0.12,
          borderRadius: 0,
          transform: 'rotate(20deg)',
        }} />

        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: NB.yellow, border: `2px solid ${NB.yellow}`,
            padding: '5px 16px', marginBottom: 28,
            fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
            color: NB.black,
          }}>
            <CheckCircle size={13} />
            Unified Civic Safety OS — v3.0
          </div>

          <h1 style={{
            color: NB.white,
            fontSize: 'clamp(2.8rem, 7vw, 5.2rem)',
            fontWeight: 800, lineHeight: 1.05,
            letterSpacing: '-0.02em',
            marginBottom: 24,
          }}>
            Safety Intelligence{' '}
            <span style={{
              display: 'inline-block',
              background: NB.yellow,
              color: NB.black,
              padding: '2px 12px',
            }}>
              for Everyone
            </span>{' '}
            Who Lives Here.
          </h1>

          <p style={{
            color: 'rgba(255,255,255,0.65)',
            fontSize: '1.1rem',
            maxWidth: 600, margin: '0 auto 40px',
            lineHeight: 1.7, fontWeight: 400,
          }}>
            The next generation of urban security — connecting residents, tourists & authorities
            through a secure, AI-powered decentralised infrastructure.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/auth')}
              style={{
                background: NB.yellow, border: `3px solid ${NB.yellow}`,
                color: NB.black, padding: '16px 40px',
                fontFamily: 'inherit', fontWeight: 800, fontSize: '0.95rem',
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
                boxShadow: `5px 5px 0 rgba(255,229,0,0.4)`,
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = `7px 7px 0 rgba(255,229,0,0.4)`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = `5px 5px 0 rgba(255,229,0,0.4)`; }}
            >
              Get Started <ArrowRight size={18} />
            </button>
            <button
              onClick={() => navigate('/verify')}
              style={{
                background: 'transparent', border: `3px solid rgba(255,255,255,0.5)`,
                color: NB.white, padding: '16px 40px',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.95rem',
                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
                transition: 'all 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = NB.white)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)')}
            >
              Verify an ID
            </button>
          </div>
        </div>
      </section>

      {/* ── CHOOSE ROLE ── */}
      <section style={{ padding: '72px 5%', background: NB.cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{
              display: 'inline-block', background: NB.black, color: NB.yellow,
              padding: '4px 14px', fontSize: '0.68rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14,
            }}>
              Who Are You?
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: NB.black, lineHeight: 1.1 }}>
              Choose Your Role
            </h2>
            <p style={{ marginTop: 10, color: '#3A3A3A', fontSize: '1.05rem', fontWeight: 500 }}>
              Tailored experiences for every citizen and visitor.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {roles.map(r => (
              <Link
                key={r.role}
                to={`/auth?role=${r.role}`}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 16,
                  background: NB.white, border: `3px solid ${NB.black}`,
                  boxShadow: `5px 5px 0 ${NB.black}`,
                  padding: '28px 24px',
                  textDecoration: 'none', color: NB.black,
                  transition: 'all 0.1s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `7px 7px 0 ${NB.black}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = `5px 5px 0 ${NB.black}`;
                }}
              >
                <div style={{
                  width: 56, height: 56,
                  background: r.bg,
                  border: `3px solid ${NB.black}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {r.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: NB.black, marginBottom: 8 }}>
                    {r.label}
                  </h3>
                  <p style={{ color: '#3A3A3A', fontSize: '0.88rem', lineHeight: 1.6, fontWeight: 500 }}>
                    {r.desc}
                  </p>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: NB.black, fontSize: '0.78rem', fontWeight: 800,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  marginTop: 'auto',
                }}>
                  Enter <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: '72px 5%', background: NB.white, borderTop: `3px solid ${NB.black}`, borderBottom: `3px solid ${NB.black}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 52 }}>
            <div style={{
              display: 'inline-block', background: NB.red, color: NB.white,
              padding: '4px 14px', fontSize: '0.68rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 14,
              border: `2px solid ${NB.black}`,
            }}>
              Platform Features
            </div>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: NB.black, lineHeight: 1.1 }}>
              Advanced Safety Features
            </h2>
            <p style={{ marginTop: 10, color: '#3A3A3A', fontSize: '1rem', fontWeight: 500, maxWidth: 560 }}>
              Powered by proprietary AI and tamper-proof Blockchain technology.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {features.map((f, i) => (
              <div key={i} style={{
                background: NB.cream,
                border: `3px solid ${NB.black}`,
                boxShadow: `4px 4px 0 ${NB.black}`,
                padding: '32px 28px',
                transition: 'all 0.1s',
              }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = `6px 6px 0 ${NB.black}`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.transform = '';
                  (e.currentTarget as HTMLElement).style.boxShadow = `4px 4px 0 ${NB.black}`;
                }}
              >
                <div style={{
                  width: 56, height: 56,
                  background: f.accent,
                  border: `3px solid ${NB.black}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20, color: NB.black,
                }}>
                  {f.icon}
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: NB.black, marginBottom: 10 }}>
                  {f.title}
                </h4>
                <p style={{ color: '#3A3A3A', fontSize: '0.9rem', lineHeight: 1.65, fontWeight: 500 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        background: NB.black,
        borderTop: `4px solid ${NB.black}`,
        padding: '48px 5% 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, background: NB.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} color={NB.black} />
                </div>
                <span style={{ color: NB.white, fontWeight: 800, fontSize: '1rem', letterSpacing: '0.04em' }}>
                  TRACK<span style={{ color: NB.yellow }}>MATE</span>
                </span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', lineHeight: 1.65, maxWidth: 280, fontWeight: 400 }}>
                Building safe, resilient cities of tomorrow through technology.
              </p>
            </div>
            <div>
              <h4 style={{ color: NB.white, fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Platform</h4>
              {['Safety Map', 'Verify Identity', 'AI Detection'].map(item => (
                <a key={item} href="#" style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', marginBottom: 8, fontWeight: 500, textDecoration: 'none' }}>
                  {item}
                </a>
              ))}
            </div>
            <div>
              <h4 style={{ color: NB.white, fontWeight: 800, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Company</h4>
              {['About Us', 'Data Privacy', 'Contact Support'].map(item => (
                <a key={item} href="#" style={{ display: 'block', color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', marginBottom: 8, fontWeight: 500, textDecoration: 'none' }}>
                  {item}
                </a>
              ))}
            </div>
          </div>

          <div style={{
            borderTop: `2px solid rgba(255,255,255,0.1)`,
            paddingTop: 24,
            display: 'flex', flexWrap: 'wrap', gap: 16,
            alignItems: 'center', justifyContent: 'space-between',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              © 2026 Trackmate Civic OS. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,208,132,0.12)', border: `2px solid rgba(0,208,132,0.4)`,
                padding: '4px 12px', fontSize: '0.68rem', fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.1em', color: '#00D084',
              }}>
                <div style={{ width: 6, height: 6, background: '#00D084', animation: 'pulse-green 2s infinite' }} />
                System Online
              </div>
              <div style={{
                padding: '4px 12px',
                background: 'rgba(255,255,255,0.08)', border: `2px solid rgba(255,255,255,0.15)`,
                fontSize: '0.68rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                v3.0.42
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
