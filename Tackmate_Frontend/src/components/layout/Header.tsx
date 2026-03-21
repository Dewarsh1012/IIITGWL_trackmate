import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, LogOut, Globe2 } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="top-header">
      <div className="flex items-center gap-12">
        <Globe2 size={24} className="text-primary" />
        <h2 style={{ fontSize: '1.2rem', margin: 0, letterSpacing: '1px' }}>
          Trackmate
        </h2>
      </div>

      {user && (
        <div className="flex items-center gap-16">
          {user.safety_score !== undefined && (
            <div className="flex items-center gap-8 badge badge-safe" style={{ padding: '6px 12px' }}>
              <Shield size={14} />
              <span>Score {user.safety_score}</span>
            </div>
          )}
          
          <div className="flex items-center gap-12" style={{ paddingLeft: '16px', borderLeft: '1px solid var(--color-border)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.full_name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {user.role}
              </div>
            </div>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {user.full_name.charAt(0)}
              </div>
            )}
          </div>

          <button onClick={handleLogout} className="geo-btn geo-btn-sm" title="Log Out" style={{ padding: '8px' }}>
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
