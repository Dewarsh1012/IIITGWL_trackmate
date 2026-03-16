import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, Map, Navigation, BarChart3, Fingerprint, Settings } from 'lucide-react';

export default function AuthoritySidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo flex items-center gap-12">
        <Navigation size={28} style={{ color: 'var(--color-accent)' }} />
        <div>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Command<span style={{ color: 'var(--color-text-secondary)' }}>View</span></h2>
          <div style={{ fontSize: '0.7rem', color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Authority Node
          </div>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/authority/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/authority/incidents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={20} />
          <span>Incidents</span>
        </NavLink>
        <NavLink to="/authority/tourists" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={20} />
          <span>Tourist Roster</span>
        </NavLink>
        <NavLink to="/authority/zones" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Map size={20} />
          <span>Zone Management</span>
        </NavLink>
        <NavLink to="/authority/efir" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Fingerprint size={20} />
          <span>E-FIR System</span>
        </NavLink>
        <NavLink to="/authority/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} />
          <span>Safety Analytics</span>
        </NavLink>
      </nav>
    </aside>
  );
}
