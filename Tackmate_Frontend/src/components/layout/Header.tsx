import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, Zap } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="top-header">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 36, height: 36,
          background: '#FFE500',
          border: '3px solid #0A0A0A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '2px 2px 0 #0A0A0A',
        }}>
          <Zap size={18} color="#0A0A0A" fill="#0A0A0A" />
        </div>
        <h2 style={{ fontSize: '1.15rem', margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, letterSpacing: '0.04em', color: '#0A0A0A' }}>
          TRACK<span style={{ color: '#2B6FFF' }}>MATE</span>
        </h2>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {user.safety_score !== undefined && (
            <div className="badge badge-safe" style={{ gap: 6 }}>
              <Shield size={12} />
              <span>Score {user.safety_score}</span>
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            paddingLeft: 16,
            borderLeft: '3px solid #0A0A0A',
          }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, fontFamily: "'Space Grotesk', sans-serif", color: '#0A0A0A' }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: '0.62rem', color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                {user.role}
              </div>
            </div>
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt="Profile"
                style={{ width: 36, height: 36, objectFit: 'cover', border: '3px solid #0A0A0A', boxShadow: '2px 2px 0 #0A0A0A' }}
              />
            ) : (
              <div style={{
                width: 36, height: 36,
                background: '#FFE500',
                border: '3px solid #0A0A0A',
                boxShadow: '2px 2px 0 #0A0A0A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1rem', fontFamily: "'Space Grotesk', sans-serif",
                color: '#0A0A0A',
              }}>
                {user.full_name.charAt(0)}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="geo-btn geo-btn-sm"
            title="Log Out"
            style={{ padding: '8px 12px' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
