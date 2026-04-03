import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Map, AlertTriangle, User, Navigation, Bell, BarChart3 } from 'lucide-react';

export default function MobileNav() {
    const { user } = useAuth();
    if (!user || user.role === 'authority' || user.role === 'admin') return null;

    const C = {
        surface: '#FFFFFF',
        surfaceAlt: '#F7F5FF',
        text: '#1B1D2A',
        textMuted: '#8B8FA8',
        primary: '#6C63FF',
        border: 'rgba(27,29,42,0.08)',
    };

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
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
            boxShadow: '0 -10px 20px rgba(27,29,42,0.08)',
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
                        color: isActive ? C.primary : C.textMuted,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '0.62rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        padding: '4px 12px',
                        borderTop: isActive ? `3px solid ${C.primary}` : '3px solid transparent',
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
