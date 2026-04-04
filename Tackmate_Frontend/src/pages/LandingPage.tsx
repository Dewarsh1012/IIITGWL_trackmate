import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Zap,
  Map,
  Users,
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Radar,
} from 'lucide-react';

const C = {
  bg: '#F0EDFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F5FF',
  dark: '#1B1D2A',
  darkAlt: '#252840',
  text: '#1B1D2A',
  textSecondary: '#4A4D68',
  textMuted: '#8B8FA8',
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  accent: '#FF6B8A',
  safe: '#34D399',
  moderate: '#FBBF24',
  high: '#F87171',
  border: 'rgba(27,29,42,0.08)',
};

const clayCard: React.CSSProperties = {
  background: C.surface,
  borderRadius: 24,
  border: `1px solid ${C.border}`,
  boxShadow: '8px 8px 16px rgba(27,29,42,0.08), -4px -4px 12px rgba(255,255,255,0.9)',
};

const roles = [
  {
    label: 'Tourist',
    role: 'tourist',
    icon: <Map size={24} color="#FFFFFF" />,
    color: C.primary,
    desc: 'Travel confidently with real-time alerts, live route intelligence, and SOS support.',
  },
  {
    label: 'Resident',
    role: 'resident',
    icon: <Users size={24} color="#FFFFFF" />,
    color: C.safe,
    desc: 'Protect your neighborhood with instant incident reporting and verified local updates.',
  },
  {
    label: 'Business',
    role: 'business',
    icon: <Building2 size={24} color="#FFFFFF" />,
    color: C.moderate,
    desc: 'Monitor risk around your property using predictive AI and smart compliance flows.',
  },
  {
    label: 'Authority',
    role: 'authority',
    icon: <Shield size={24} color="#FFFFFF" />,
    color: C.accent,
    desc: 'Coordinate city-wide safety operations with command analytics, check-ins, and E-FIR.',
  },
];

const features = [
  {
    icon: <Radar size={26} color={C.primary} />,
    title: 'Live Monitoring Grid',
    desc: 'Track movement, zone risk, and emerging events through a unified operations layer.',
  },
  {
    icon: <Zap size={26} color={C.accent} />,
    title: 'Anomaly Detection',
    desc: 'AI models flag unusual patterns early so teams can respond before escalation.',
  },
  {
    icon: <Lock size={26} color={C.safe} />,
    title: 'Trusted Identity',
    desc: 'Secure verification workflows ensure the right responders act on the right incidents.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        color: C.text,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(8px)',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 6px 14px rgba(108,99,255,0.35)',
              }}
            >
              <Shield size={18} color="#FFFFFF" />
            </div>
            <p style={{ margin: 0, fontWeight: 800, letterSpacing: '-0.01em' }}>
              TrackMate <span style={{ color: C.primary }}>Civic OS</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/auth?mode=login')}
              style={{
                border: `1px solid ${C.border}`,
                background: C.surface,
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 700,
                cursor: 'pointer',
                color: C.text,
              }}
            >
              Login
            </button>
            <button
              onClick={() => navigate('/auth')}
              style={{
                border: 'none',
                background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                color: '#FFFFFF',
                borderRadius: 12,
                padding: '10px 14px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(108,99,255,0.3)',
              }}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <section style={{ padding: '56px 20px 38px' }}>
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            ...clayCard,
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(145deg, #1B1D2A, #252840)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: -80,
              top: -60,
              width: 260,
              height: 260,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(108,99,255,0.45), transparent 65%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: -50,
              bottom: -80,
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,107,138,0.35), transparent 70%)',
            }}
          />

          <div style={{ position: 'relative', zIndex: 1, padding: '56px 32px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: 22,
              }}
            >
              <CheckCircle2 size={14} />
              Unified Safety Platform v3
            </div>

            <h1
              style={{
                margin: 0,
                color: '#FFFFFF',
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                lineHeight: 1.06,
                letterSpacing: '-0.03em',
                maxWidth: 820,
              }}
            >
              Real-time city safety intelligence for
              <span style={{ color: '#8B85FF' }}> residents, visitors, and response teams</span>
            </h1>

            <p
              style={{
                marginTop: 18,
                marginBottom: 32,
                color: 'rgba(255,255,255,0.72)',
                maxWidth: 720,
                fontSize: '1rem',
                lineHeight: 1.75,
                fontWeight: 500,
              }}
            >
              TrackMate connects live maps, AI anomaly detection, secure identity, and emergency workflows in one coordinated operating system.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate('/auth')}
                style={{
                  border: 'none',
                  background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                  color: '#FFFFFF',
                  borderRadius: 14,
                  padding: '14px 20px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 10px 18px rgba(108,99,255,0.35)',
                }}
              >
                Enter Platform <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/auth?mode=login')}
                style={{
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  borderRadius: 14,
                  padding: '14px 20px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Already have access
              </button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '18px 20px 54px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ marginBottom: 20 }}>
            <p
              style={{
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(108,99,255,0.1)',
                color: C.primary,
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              <Sparkles size={13} />
              Select Your Access Role
            </p>
            <h2 style={{ margin: '14px 0 4px', fontSize: 'clamp(1.7rem, 3.5vw, 2.6rem)', color: C.text }}>
              One platform, role-specific workflows
            </h2>
            <p style={{ margin: 0, color: C.textSecondary, fontWeight: 500 }}>
              Use the role that matches your responsibilities to unlock the right tools.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: 16,
            }}
          >
            {roles.map((role) => (
              <Link
                key={role.role}
                to={`/auth?role=${role.role}`}
                style={{
                  ...clayCard,
                  textDecoration: 'none',
                  color: C.text,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  minHeight: 216,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: role.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px rgba(27,29,42,0.15)',
                  }}
                >
                  {role.icon}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{role.label}</h3>
                <p style={{ margin: 0, color: C.textSecondary, lineHeight: 1.65, fontWeight: 500, fontSize: '0.9rem' }}>
                  {role.desc}
                </p>
                <p
                  style={{
                    marginTop: 'auto',
                    marginBottom: 0,
                    color: C.primary,
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Continue as {role.label}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '0 20px 56px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div
            style={{
              ...clayCard,
              padding: '28px 22px',
              background: C.surfaceAlt,
            }}
          >
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.35rem' }}>Core Capabilities</h3>
              <p style={{ margin: 0, color: C.textSecondary, fontWeight: 500 }}>
                Built for rapid coordination between public users and command teams.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 14,
              }}
            >
              {features.map((feature) => (
                <div
                  key={feature.title}
                  style={{
                    background: C.surface,
                    borderRadius: 18,
                    border: `1px solid ${C.border}`,
                    padding: 18,
                    boxShadow: 'inset 2px 2px 4px rgba(255,255,255,0.75), 4px 4px 10px rgba(27,29,42,0.06)',
                  }}
                >
                  <div style={{ marginBottom: 10 }}>{feature.icon}</div>
                  <h4 style={{ margin: '0 0 8px', fontSize: '1rem' }}>{feature.title}</h4>
                  <p style={{ margin: 0, color: C.textSecondary, fontSize: '0.88rem', lineHeight: 1.65, fontWeight: 500 }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer
        style={{
          background: C.dark,
          color: '#FFFFFF',
          borderTop: `1px solid ${C.darkAlt}`,
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: '0 auto',
            padding: '30px 20px 34px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={14} color="#FFFFFF" />
            </div>
            <p style={{ margin: 0, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
              TrackMate Civic Security Platform
            </p>
          </div>

          <p style={{ margin: 0, color: 'rgba(255,255,255,0.55)', fontSize: '0.8rem', fontWeight: 600 }}>
            © 2026 TrackMate. Coordinated safety for connected cities.
          </p>
        </div>
      </footer>
    </div>
  );
}
