import { useState, useEffect } from 'react';
import { CheckCircle, Loader2, AlertTriangle, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useLocation } from 'react-router-dom';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

export default function AuthorityRosters() {
  const { } = useAuth();
  const location = useLocation();
  const pathPart = location.pathname.split('/').pop() || 'tourists';
  const roleMap: Record<string, string> = { tourists: 'tourist', residents: 'resident', businesses: 'business' };
  const role = roleMap[pathPart] || 'tourist';

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchProfiles(); }, [role]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/profiles?role=${role}`);
      if (res.data.success) setProfiles(res.data.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const filteredProfiles = profiles.filter(p => {
    if (!search) return true;
    const t = search.toLowerCase();
    return p.full_name?.toLowerCase().includes(t) || p.blockchain_id?.toLowerCase().includes(t) || p.email?.toLowerCase().includes(t);
  });

  const roleTitle = { tourist: 'Tourist Roster', resident: 'Resident Directory', business: 'Registered Businesses' }[role] || 'User Roster';
  const roleAccent = { tourist: NB.blue, resident: NB.mint, business: NB.orange }[role] || NB.yellow;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: NB.cream }}>
      <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
      <AuthoritySidebar />
      <main className="page-with-sidebar" style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ background: NB.white, borderBottom: `3px solid ${NB.black}`, padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 3px 0 ${NB.black}`, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 6, height: 32, background: roleAccent, border: `2px solid ${NB.black}` }} />
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: NB.black, margin: 0 }}>{roleTitle}</h1>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#6B6B6B', fontWeight: 600 }}>{profiles.length} registered accounts</p>
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B6B6B' }} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, ID..." style={{ paddingLeft: 32, padding: '10px 14px 10px 32px', background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 500, outline: 'none', width: 260 }} />
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          <div style={{ border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, background: NB.white, overflowX: 'auto' }}>
            <table className="geo-table">
              <thead>
                <tr>
                  <th>User Identity</th><th>Contact Info</th><th>Blockchain ID</th><th>Safety Score</th><th style={{ textAlign: 'right' }}>Verification</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#6B6B6B', fontWeight: 600 }}>No {role} accounts found in the database.</td></tr>
                ) : filteredProfiles.map(p => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: roleAccent, border: `2px solid ${NB.black}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.95rem', color: NB.black }}>
                          {p.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.9rem' }}>{p.full_name}</p>
                          <p style={{ fontSize: '0.65rem', color: '#6B6B6B', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{p.id_type || role}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: NB.black, fontWeight: 500 }}>{p.email}</p>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#6B6B6B', fontWeight: 500 }}>{p.phone || '—'}</p>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.72rem', background: NB.cream, padding: '4px 8px', border: `1.5px solid ${NB.black}`, fontFamily: "'JetBrains Mono', monospace", color: NB.blue, fontWeight: 700, display: 'block', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.blockchain_id || 'NOT_MINTED'}
                      </code>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 64, height: 8, background: NB.cream, border: `1.5px solid ${NB.black}` }}>
                          <div style={{ height: '100%', background: NB.mint, width: `${p.safety_score || 0}%` }} />
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: NB.black, fontFamily: "'JetBrains Mono', monospace" }}>{p.safety_score || 0}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {p.is_verified ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: NB.mint, color: NB.black, border: `2px solid ${NB.black}`, padding: '3px 10px' }}>
                          <CheckCircle size={11} /> Confirmed
                        </span>
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', background: NB.orange, color: NB.white, border: `2px solid ${NB.black}`, padding: '3px 10px' }}>
                          <AlertTriangle size={11} /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
