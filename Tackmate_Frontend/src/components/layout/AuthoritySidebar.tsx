import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, Map, Fingerprint, BarChart3, Navigation, Bell } from 'lucide-react';

export default function AuthoritySidebar() {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40,
          background: '#FFE500',
          border: '3px solid #FFE500',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Navigation size={22} color="#0A0A0A" />
        </div>
        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#FFFFFF', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, letterSpacing: '0.02em' }}>
            TRACK<span style={{ color: '#FFE500' }}>MATE</span>
          </h2>
          <div style={{ fontSize: '0.62rem', color: '#FFE500', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
            Authority Node
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '16px 20px 4px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 800 }}>
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
        <NavLink to="/authority/tourists" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>Tourist Roster</span>
        </NavLink>
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

      {/* Bottom badge */}
      <div style={{
        margin: '16px 12px',
        padding: '12px 16px',
        background: 'rgba(255,229,0,0.08)',
        border: '2px solid rgba(255,229,0,0.25)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ width: 8, height: 8, background: '#00D084', border: '2px solid #00D084', flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          System Online
        </span>
      </div>
    </aside>
  );
}
