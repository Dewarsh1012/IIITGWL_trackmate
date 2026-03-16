import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Map, AlertTriangle, User, Navigation, Bell } from 'lucide-react';

export default function MobileNav() {
  const { user } = useAuth();
  if (!user || user.role === 'authority' || user.role === 'admin') return null;

  const links = {
    tourist: [
      { to: '/tourist/dashboard', icon: <Map size={24} />, label: 'Map' },
      { to: '/tourist/itinerary', icon: <Navigation size={24} />, label: 'Trip' },
      { to: '/tourist/profile', icon: <User size={24} />, label: 'Profile' },
    ],
    resident: [
      { to: '/resident/dashboard', icon: <Map size={24} />, label: 'Local' },
      { to: '/resident/feed', icon: <Bell size={24} />, label: 'Feed' },
      { to: '/resident/report', icon: <AlertTriangle size={24} />, label: 'Report' },
      { to: '/resident/profile', icon: <User size={24} />, label: 'Profile' },
    ],
    business: [
      { to: '/business/dashboard', icon: <BarChart3 size={24} />, label: 'Intel' },
      { to: '/business/profile', icon: <User size={24} />, label: 'Business' },
    ],
  }[user.role as 'tourist' | 'resident' | 'business'] || [];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'var(--color-bg-card)',
      borderTop: '1px solid var(--color-border)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '12px 0 calc(12px + env(safe-area-inset-bottom))',
      zIndex: 100,
    }} className="mobile-only">
      {links.map((link, i) => (
        <NavLink 
          key={i} 
          to={link.to}
          className={({ isActive }) => `flex flex-col items-center gap-4 ${isActive ? 'text-accent' : 'text-secondary'}`}
          style={{ textDecoration: 'none', transition: 'color 0.2s', width: '25%' }}
        >
          {link.icon}
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
