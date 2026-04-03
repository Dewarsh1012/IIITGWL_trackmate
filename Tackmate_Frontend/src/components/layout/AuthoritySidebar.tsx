import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, Map, Fingerprint, BarChart3, Navigation, Bell, Building2, Home, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AuthoritySidebar() {
  const { logout, user } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40,
          background: 'linear-gradient(135deg, #6C63FF, #8B85FF)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(108,99,255,0.3)',
        }}>
          <Navigation size={20} color="#FFFFFF" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '0.02em' }}>
            TRACK<span style={{ color: '#8B85FF' }}>MATE</span>
          </h2>
          <div style={{ fontSize: '0.6rem', color: 'rgba(139,133,255,0.8)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
            Authority Node
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '16px 20px 6px', fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
        Navigation
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/authority/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/authority/incidents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={18} />
          <span>Incidents</span>
        </NavLink>

        {/* Section label for user management */}
        <div style={{ padding: '12px 0 4px', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
          User Management
        </div>

        <NavLink to="/authority/tourists" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Tourists</span>
        </NavLink>
        <NavLink to="/authority/residents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Home size={18} />
          <span>Residents</span>
        </NavLink>
        <NavLink to="/authority/businesses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Building2 size={18} />
          <span>Businesses</span>
        </NavLink>

        {/* Section label for tools */}
        <div style={{ padding: '12px 0 4px', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
          Tools
        </div>

        <NavLink to="/authority/zones" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Map size={18} />
          <span>Zone Management</span>
        </NavLink>
        <NavLink to="/authority/efir" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Fingerprint size={18} />
          <span>E-FIR System</span>
        </NavLink>
        <NavLink to="/authority/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} />
          <span>Safety Analytics</span>
        </NavLink>
        <NavLink to="/authority/alerts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Bell size={18} />
          <span>Send Alert</span>
        </NavLink>
      </nav>

      {/* User info + logout */}
      <div style={{
        margin: '8px 12px 16px',
        padding: '14px 16px',
        background: 'rgba(108,99,255,0.08)',
        border: '1px solid rgba(108,99,255,0.15)',
        borderRadius: 14,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399', boxShadow: '0 0 6px rgba(52,211,153,0.5)', flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.8)', fontWeight: 700, display: 'block' }}>
              {user?.full_name || 'Officer'}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              Online
            </span>
          </div>
        </div>
        <button onClick={logout} title="Logout" style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
          <LogOut size={14} color="rgba(255,255,255,0.5)" />
        </button>
      </div>
    </aside>
  );
}
