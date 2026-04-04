import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, AlertTriangle, Map, Fingerprint, BarChart3, Bell, Building2, Home, LogOut, CheckCircle2, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LANGUAGES } from '../../i18n';
import { useState } from 'react';

export default function AuthoritySidebar() {
  const { logout, user } = useAuth();
  const { t, language, setLanguage, currentLang } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="/trackmate-logo.png"
          alt="TrackMate Logo"
          style={{
            width: 40, height: 40,
            borderRadius: 14,
            objectFit: 'cover',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(108,99,255,0.3)',
          }}
        />

        <div>
          <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#FFFFFF', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, letterSpacing: '0.02em' }}>
            TRACK<span style={{ color: '#8B85FF' }}>MATE</span>
          </h2>
          <div style={{ fontSize: '0.6rem', color: 'rgba(139,133,255,0.8)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
            {t('authorityNode')}
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '16px 20px 6px', fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
        {t('navigation')}
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/authority/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>{t('dashboard')}</span>
        </NavLink>
        <NavLink to="/authority/incidents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={18} />
          <span>{t('incidents')}</span>
        </NavLink>

        {/* Section label for user management */}
        <div style={{ padding: '12px 0 4px', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
          {t('userManagement')}
        </div>

        <NavLink to="/authority/tourists" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Users size={18} />
          <span>{t('tourists')}</span>
        </NavLink>
        <NavLink to="/authority/residents" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Home size={18} />
          <span>{t('residents')}</span>
        </NavLink>
        <NavLink to="/authority/businesses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Building2 size={18} />
          <span>{t('businesses')}</span>
        </NavLink>

        {/* Section label for tools */}
        <div style={{ padding: '12px 0 4px', fontSize: '0.55rem', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700 }}>
          {t('tools')}
        </div>

        <NavLink to="/authority/checkins" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <CheckCircle2 size={18} />
          <span>{t('dailyCheckins')}</span>
        </NavLink>
        <NavLink to="/authority/zones" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Map size={18} />
          <span>{t('zoneManagement')}</span>
        </NavLink>
        <NavLink to="/authority/efir" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Fingerprint size={18} />
          <span>{t('efirSystem')}</span>
        </NavLink>
        <NavLink to="/authority/analytics" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <BarChart3 size={18} />
          <span>{t('safetyAnalytics')}</span>
        </NavLink>
        <NavLink to="/authority/alerts" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Bell size={18} />
          <span>{t('sendAlert')}</span>
        </NavLink>
      </nav>

      {/* Language Selector */}
      <div style={{ margin: '4px 12px', position: 'relative' }}>
        <button onClick={() => setLangOpen(!langOpen)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 12, cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <Globe size={14} color="#8B85FF" />
          <span style={{ flex: 1, textAlign: 'left' }}>{currentLang.nativeName}</span>
        </button>
        {langOpen && (
          <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0, background: '#1a1a2e', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 12, padding: 4, maxHeight: 260, overflowY: 'auto', zIndex: 50 }}>
            {LANGUAGES.map(lang => (
              <button key={lang.code} onClick={() => { setLanguage(lang.code); setLangOpen(false); }} style={{ display: 'block', width: '100%', padding: '7px 12px', background: language === lang.code ? 'rgba(108,99,255,0.15)' : 'transparent', border: 'none', borderRadius: 8, cursor: 'pointer', color: language === lang.code ? '#8B85FF' : 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: language === lang.code ? 800 : 600, fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'left', marginBottom: 1 }}>
                {lang.nativeName}
              </button>
            ))}
          </div>
        )}
      </div>

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
              {user?.full_name || t('officer')}
            </span>
            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
              {t('online')}
            </span>
          </div>
        </div>
        <button onClick={logout} title={t('logout')} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
          <LogOut size={14} color="rgba(255,255,255,0.5)" />
        </button>
      </div>
    </aside>
  );
}
