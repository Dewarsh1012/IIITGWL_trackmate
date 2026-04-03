import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
    const C = {
        bg: '#F0EDFA',
        surface: '#FFFFFF',
        surfaceAlt: '#F7F5FF',
        text: '#1B1D2A',
        textSecondary: '#4A4D68',
        textMuted: '#8B8FA8',
        primary: '#6C63FF',
        accent: '#FF6B8A',
        high: '#F87171',
        border: 'rgba(27,29,42,0.08)',
    };

    const clayCard: React.CSSProperties = {
        background: C.surface,
        borderRadius: 24,
        border: `1px solid ${C.border}`,
        boxShadow: '10px 10px 24px rgba(27,29,42,0.12), -6px -6px 16px rgba(255,255,255,0.95)',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: C.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            backgroundImage: 'radial-gradient(circle, rgba(108,99,255,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
        }}>
            <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
                {/* Giant 404 */}
                <div style={{
                    fontSize: 'clamp(5rem, 20vw, 10rem)',
                    fontWeight: 800,
                    lineHeight: 1,
                    color: C.text,
                    letterSpacing: '-0.04em',
                    background: 'linear-gradient(135deg, #6C63FF, #FF6B8A)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 8,
                }}>
                    404
                </div>

                {/* Card */}
                <div style={{ ...clayCard, padding: '32px', marginBottom: 28 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: `${C.high}22`, color: C.high,
                        border: `1px solid ${C.high}`,
                        padding: '4px 12px',
                        fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
                        marginBottom: 16,
                        borderRadius: 999,
                    }}>
                        <AlertTriangle size={12} />
                        Zone Not Found
                    </div>

                    <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: C.text }}>
                        Off The Grid
                    </h1>
                    <p style={{ color: C.textSecondary, fontSize: '0.95rem', lineHeight: 1.65, fontWeight: 500 }}>
                        The coordinate you're looking for doesn't exist in our geospatial database.
                        You may have strayed into an unmapped zone.
                    </p>
                </div>

                <Link
                    to="/"
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: 10,
                        background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
                        color: '#FFFFFF',
                        border: 'none',
                        boxShadow: '0 10px 20px rgba(108,99,255,0.25)',
                        padding: '14px 32px',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        textDecoration: 'none',
                        transition: 'transform 0.1s ease',
                        borderRadius: 14,
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.transform = 'translate(0,0)';
                    }}
                >
                    <ArrowLeft size={18} />
                    Back to Base
                </Link>
            </div>
        </div>
    );
}
