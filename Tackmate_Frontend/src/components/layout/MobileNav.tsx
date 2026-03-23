import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Map, AlertTriangle, User, Navigation, Bell, BarChart3 } from 'lucide-react';

export default function MobileNav() {
  const { user } = useAuth();
  if (!user || user.role === 'authority' || user.role === 'admin') return null;

  const links = {
    tourist: [
      { to: '/tourist/dashboard', icon: <Map size={22} />, label: 'Map' },
      { to: '/tourist/itinerary', icon: <Navigation size={22} />, label: 'Trip' },
      { to: '/tourist/profile', icon: <User size={22} />, label: 'Profile' },
    ],
    resident: [
      { to: '/resident/dashboard', icon: <Map size={22} />, label: 'Local' },
      { to: '/resident/feed', icon: <Bell size={22} />, label: 'Feed' },
      { to: '/resident/report', icon: <AlertTriangle size={22} />, label: 'Report' },
      { to: '/resident/profile', icon: <User size={22} />, label: 'Profile' },
    ],
    business: [
      { to: '/business/dashboard', icon: <BarChart3 size={22} />, label: 'Intel' },
      { to: '/business/profile', icon: <User size={22} />, label: 'Business' },
    ],
  }[user.role as 'tourist' | 'resident' | 'business'] || [];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#0A0A0A',
      borderTop: '4px solid #0A0A0A',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '10px 0 calc(10px + env(safe-area-inset-bottom))',
      zIndex: 100,
    }}>
      {links.map((link, i) => (
        <NavLink
          key={i}
          to={link.to}
          style={({ isActive }) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            textDecoration: 'none',
            color: isActive ? '#FFE500' : 'rgba(255,255,255,0.5)',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.62rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '4px 12px',
            borderBottom: isActive ? '3px solid #FFE500' : '3px solid transparent',
            transition: 'all 0.15s ease',
            width: `${100 / links.length}%`,
          })}
        >
          {link.icon}
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
