import { useAuth } from '../../context/AuthContext';
import { Shield, CheckCircle, Phone, Languages, Copy, QrCode } from 'lucide-react';

const NB = {
  black: '#0A0A0A',
  yellow: '#FFE500',
  red: '#FF3B3B',
  blue: '#2B6FFF',
  mint: '#00D084',
  orange: '#FF7A00',
  cream: '#FFFBF0',
  white: '#FFFFFF',
  gray: '#E5E5E5'
};

export default function TouristProfile() {
  const { user } = useAuth();
  
  // Use user's initials
  const initials = user?.full_name ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'RS';

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px', fontFamily: "'Space Grotesk', sans-serif", color: NB.black }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.02em', WebkitTextStroke: `1px ${NB.black}` }}>Citizenship Identity</h1>
          <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: '#555' }}>Manage your verified traveler profile, blockchain ID, and safety metrics.</p>
        </div>
        <div style={{ background: NB.mint, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckCircle size={20} color={NB.black} />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase' }}>Fully Verified</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, alignItems: 'start' }}>
        
        {/* Sidebar Profile Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Main Card */}
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            {/* Geometric decoration */}
            <div style={{ position: 'absolute', top: -3, right: -3, width: 40, height: 40, background: NB.yellow, borderLeft: `3px solid ${NB.black}`, borderBottom: `3px solid ${NB.black}` }} />
            
            <div style={{ width: 100, height: 100, borderRadius: '50%', background: NB.blue, border: `4px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: `4px 4px 0 ${NB.black}` }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: NB.white }}>{initials}</span>
            </div>
            
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 8px', textAlign: 'center' }}>{user?.full_name || 'Raj Sharma'}</h2>
            
            <div style={{ background: NB.black, color: NB.white, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24 }}>
              {user?.role || 'TOURIST'}
            </div>

            <div style={{ width: '100%', borderTop: `2px solid ${NB.black}`, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Member Since</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Jan 2026</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Trips</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>1</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#666', textTransform: 'uppercase' }}>Nationality</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>Indian</span>
              </div>
            </div>
          </div>

          {/* Safety Standing */}
          <div style={{ background: NB.yellow, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: 24 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10, textTransform: 'uppercase' }}>
              <Shield size={20} /> Safety Standing
            </h3>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', border: `8px solid ${NB.black}`, background: NB.white, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: `inset 4px 4px 0 rgba(0,0,0,0.1)` }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1 }}>85%</span>
                <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', color: NB.mint, marginTop: 4 }}>Good Standing</span>
              </div>
            </div>

            <div style={{ background: NB.white, border: `2px solid ${NB.black}`, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `2px solid ${NB.black}`, paddingBottom: 8, marginBottom: 12 }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Points Breakdown</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: NB.blue }}>+12 this trip</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, background: NB.mint, border: `1px solid ${NB.black}` }}/> Verified Identity</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>+500</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, background: NB.blue, border: `1px solid ${NB.black}` }}/> Safety Reports</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>+120</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, background: NB.orange, border: `1px solid ${NB.black}` }}/> Local Compliance</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>+230</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'auto / -1' }}>
          
          {/* Blockchain ID Card */}
          <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `6px 6px 0 ${NB.black}`, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Blockchain Digital ID</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: NB.cream, border: `2px solid ${NB.black}`, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', boxShadow: `2px 2px 0 ${NB.black}` }}>
                  <Copy size={14} /> Copy
                </button>
                <button style={{ background: NB.blue, color: NB.white, border: `2px solid ${NB.black}`, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', boxShadow: `2px 2px 0 ${NB.black}` }}>
                  <QrCode size={14} /> Show QR
                </button>
              </div>
            </div>

            <div style={{ background: NB.black, color: NB.white, padding: '24px', position: 'relative', overflow: 'hidden' }}>
              {/* Pattern overlay */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.1, backgroundImage: `radial-gradient(${NB.white} 2px, transparent 2px)`, backgroundSize: '20px 20px' }} />
              
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: NB.mint, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8 }}>TrackMate Protocol</div>
                  <h4 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 24px', letterSpacing: '-0.02em', wordBreak: 'break-word' }}>{user?.full_name || 'Raj Sharma'}</h4>
                  
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Blockchain Hash</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', fontWeight: 700, wordBreak: 'break-all' }}>{user?.blockchain_id || 'BC-7A3F9E2B1C4D5678'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Gov ID</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', fontWeight: 700 }}>**** **** 4523</div>
                    </div>
                  </div>
                </div>
                
                <div style={{ background: NB.white, padding: 12, border: `4px solid ${NB.mint}`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <QrCode size={64} color={NB.black} />
                  <div style={{ color: NB.black, fontSize: '0.55rem', fontWeight: 800, marginTop: 8, textAlign: 'center', lineHeight: 1.2 }}>SCANNABLE<br/>ASSET</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {/* Emergency Contacts */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Emergency Contacts</h3>
                <button style={{ background: NB.yellow, border: `2px solid ${NB.black}`, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `2px 2px 0 ${NB.black}`, fontWeight: 900 }}>+</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ border: `2px solid ${NB.black}`, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: NB.cream }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 4 }}>Anita Sharma</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>Primary • Spouse</div>
                  </div>
                  <button style={{ background: NB.blue, border: `2px solid ${NB.black}`, color: NB.white, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Phone size={14} />
                  </button>
                </div>
                
                <div style={{ border: `2px solid ${NB.black}`, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: NB.cream }}>
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 4 }}>Dr. R. Patel</div>
                    <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: '#666' }}>Medical • Doctor</div>
                  </div>
                  <button style={{ background: NB.blue, border: `2px solid ${NB.black}`, color: NB.white, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Phone size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Language Preferences */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Language Auth</h3>
                <Languages size={20} />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Primary Comms</label>
                <select style={{ width: '100%', border: `3px solid ${NB.black}`, padding: '10px 12px', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'inherit', outline: 'none', background: NB.cream, marginBottom: 20, boxShadow: `2px 2px 0 ${NB.black}`, cursor: 'pointer', appearance: 'none' }}>
                  <option>English (US)</option>
                  <option>Hindi (भारत)</option>
                  <option>Spanish (ES)</option>
                </select>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ background: NB.mint, border: `2px solid ${NB.black}`, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, boxShadow: `2px 2px 0 ${NB.black}` }}>English</div>
                  <div style={{ background: NB.white, border: `2px solid ${NB.black}`, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 800, boxShadow: `2px 2px 0 ${NB.black}` }}>Hindi</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Security Activity */}
          <div style={{ background: NB.cream, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>Security Log</h3>
              <a href="#" style={{ fontSize: '0.75rem', fontWeight: 800, color: NB.blue, textTransform: 'uppercase', textDecoration: 'none' }}>View All</a>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { title: 'Identity Verification via Blockchain', loc: 'Guwahati Airport Checkpoint', time: 'Mar 01, 2026, 09:45 AM', color: NB.mint },
                { title: 'Emergency Contact Shared', loc: 'Hotel Blue Pine, Tawang', time: 'Mar 02, 2026, 06:12 PM', color: NB.orange },
                { title: 'Safety Score Recalculated', loc: 'System Update', time: 'Feb 28, 2026, 12:00 AM', color: '#999' }
              ].map((log, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: i < 2 ? `2px dashed ${NB.black}` : 'none', opacity: i === 2 ? 0.6 : 1 }}>
                  <div style={{ width: 12, height: 12, background: log.color, border: `2px solid ${NB.black}`, marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 4 }}>{log.title}</div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#555', fontFamily: "'JetBrains Mono', monospace" }}>{log.loc} • {log.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
