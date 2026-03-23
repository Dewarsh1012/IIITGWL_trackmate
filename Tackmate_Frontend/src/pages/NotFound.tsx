import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFBF0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Space Grotesk', sans-serif",
      backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
        {/* Giant 404 */}
        <div style={{
          fontSize: 'clamp(6rem, 22vw, 11rem)',
          fontWeight: 800,
          lineHeight: 1,
          color: '#0A0A0A',
          letterSpacing: '-0.04em',
          WebkitTextStroke: '3px #0A0A0A',
          WebkitTextFillColor: '#FFE500',
          marginBottom: 8,
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          404
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF',
          border: '3px solid #0A0A0A',
          boxShadow: '6px 6px 0 #0A0A0A',
          padding: '32px',
          marginBottom: 28,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#FF3B3B', color: '#FFFFFF',
            border: '2px solid #0A0A0A',
            padding: '4px 12px',
            fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em',
            marginBottom: 16,
          }}>
            <AlertTriangle size={12} />
            Zone Not Found
          </div>

          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 12, color: '#0A0A0A' }}>
            Off The Grid
          </h1>
          <p style={{ color: '#3A3A3A', fontSize: '0.95rem', lineHeight: 1.65, fontWeight: 500 }}>
            The coordinate you're looking for doesn't exist in our geospatial database.
            You may have strayed into an unmapped zone.
          </p>
        </div>

        <Link
          to="/"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#FFE500',
            color: '#0A0A0A',
            border: '3px solid #0A0A0A',
            boxShadow: '4px 4px 0 #0A0A0A',
            padding: '14px 32px',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.88rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            textDecoration: 'none',
            transition: 'all 0.1s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translate(-2px,-2px)';
            (e.currentTarget as HTMLElement).style.boxShadow = '6px 6px 0 #0A0A0A';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.transform = 'translate(0,0)';
            (e.currentTarget as HTMLElement).style.boxShadow = '4px 4px 0 #0A0A0A';
          }}
        >
          <ArrowLeft size={18} />
          Back to Base
        </Link>
      </div>
    </div>
  );
}
