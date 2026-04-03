import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Shield, MapPin, AlertTriangle, User, Phone, Mail, CheckCircle, Clock, Navigation, Activity } from 'lucide-react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';
import TouristMap from '../../components/maps/TouristMap';
import type { ZoneData } from '../../components/maps/TouristMap';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

const roleColors: Record<string, string> = {
  tourist: NB.blue,
  resident: NB.mint,
  business: NB.orange,
  authority: NB.yellow,
};

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [profile, setProfile] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveLat, setLiveLat] = useState<number | null>(null);
  const [liveLng, setLiveLng] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [profileRes, locRes, incRes, zoneRes] = await Promise.all([
          api.get(`/profiles/${userId}`),
          api.get(`/locations/user/${userId}?hours=48`),
          api.get(`/incidents?reporter=${userId}&limit=10`),
          api.get('/zones'),
        ]);
        if (profileRes.data.success) setProfile(profileRes.data.data);
        if (locRes.data.success) {
          const locs = locRes.data.data || [];
          setLocations(locs);
          if (locs.length > 0) {
            setLiveLat(locs[0].latitude);
            setLiveLng(locs[0].longitude);
          }
        }
        if (incRes.data.success) setIncidents(incRes.data.data || []);
        if (zoneRes.data.success) setZones(zoneRes.data.data || []);
      } catch (err) {
        console.error('Failed to load user data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  // Listen for live location updates
  useEffect(() => {
    if (!socket || !userId) return;
    const handleLocationUpdate = (data: any) => {
      if (data.userId === userId) {
        const lat = data.latitude || (data.location?.coordinates && data.location.coordinates[1]);
        const lng = data.longitude || (data.location?.coordinates && data.location.coordinates[0]);
        if (lat && lng) {
          setLiveLat(lat);
          setLiveLng(lng);
        }
      }
    };
    socket.on('location:update', handleLocationUpdate);
    return () => { socket.off('location:update', handleLocationUpdate); };
  }, [socket, userId]);

  const sevColor = (s: string) => {
    switch (s) {
      case 'critical': return '#FF0033';
      case 'high': return NB.red;
      case 'medium': return NB.orange;
      default: return NB.blue;
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
      <AuthoritySidebar />
      <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite', color: NB.yellow }} />
      </main>
    </div>
  );

  if (!profile) return (
    <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
      <AuthoritySidebar />
      <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <AlertTriangle size={40} color={NB.red} />
        <p style={{ color: NB.black, fontWeight: 700, fontSize: '1.1rem' }}>User not found</p>
        <button onClick={() => navigate(-1)} style={{ background: NB.yellow, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '10px 20px', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
          Go Back
        </button>
      </main>
    </div>
  );

  const accent = roleColors[profile.role] || NB.blue;
  const lastSeen = locations.length > 0 ? new Date(locations[0].recorded_at).toLocaleString() : 'No data';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
      <AuthoritySidebar />

      <main className="page-with-sidebar" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0 }}>
        {/* Top bar */}
        <div className="top-header responsive-container" style={{ background: NB.white, borderBottom: `3px solid ${NB.black}`, padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: `0 3px 0 ${NB.black}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => navigate(-1)} style={{ background: NB.yellow, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <div>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: NB.black, margin: 0 }}>User Profile — {profile.full_name}</h1>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#6B6B6B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {profile.role} · {profile.blockchain_id || 'NO CHAIN ID'}
              </p>
            </div>
          </div>
          <span style={{ padding: '5px 14px', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', background: accent, color: accent === NB.yellow ? NB.cream : NB.black, border: `2px solid ${NB.black}` }}>
            {profile.role}
          </span>
        </div>

        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {/* Profile Cards Row */}
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {/* Name */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '18px', borderTop: `6px solid ${accent}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, background: accent, border: `2px solid ${NB.black}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.3rem', color: accent === NB.yellow ? NB.cream : NB.black }}>
                  {profile.full_name?.charAt(0) || '?'}
                </div>
                <div>
                  <p style={{ fontWeight: 800, color: NB.black, margin: 0, fontSize: '1rem' }}>{profile.full_name}</p>
                  <p style={{ fontSize: '0.68rem', color: '#6B6B6B', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>{profile.designation || profile.role}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#6B6B6B' }}>
                {profile.is_verified ? (
                  <><CheckCircle size={12} color={NB.mint} /> <span style={{ color: NB.mint, fontWeight: 700 }}>Verified</span></>
                ) : (
                  <><AlertTriangle size={12} color={NB.orange} /> <span style={{ color: NB.orange, fontWeight: 700 }}>Pending Verification</span></>
                )}
              </div>
            </div>

            {/* Contact */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '18px' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: '0 0 12px' }}>Contact Info</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} color={NB.blue} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: NB.black }}>{profile.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={14} color={NB.mint} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: NB.black }}>{profile.phone || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={14} color={NB.orange} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: NB.black }}>{profile.id_type ? `${profile.id_type} ···${profile.id_last_four || ''}` : 'No ID'}</span>
                </div>
              </div>
            </div>

            {/* Safety Score */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: '0 0 8px' }}>Safety Score</p>
              <div style={{ position: 'relative', width: 80, height: 80 }}>
                <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke={NB.cream} strokeWidth="8" />
                  <circle cx="40" cy="40" r="32" fill="none" stroke={(profile.safety_score || 0) > 70 ? NB.mint : NB.orange} strokeWidth="8" strokeDasharray="201" strokeDashoffset={201 - (201 * (profile.safety_score || 0) / 100)} strokeLinecap="butt" />
                </svg>
                <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontWeight: 800, fontSize: '1.2rem', color: NB.black, fontFamily: "'JetBrains Mono', monospace" }}>{profile.safety_score || 0}</span>
              </div>
            </div>

            {/* Last Seen */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '18px' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', margin: '0 0 12px' }}>Location Status</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Clock size={14} color={NB.blue} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: NB.black }}>Last: {lastSeen}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Navigation size={14} color={NB.mint} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: NB.black }}>
                    {liveLat && liveLng ? `${liveLat.toFixed(4)}, ${liveLng.toFixed(4)}` : 'Unavailable'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={14} color={NB.orange} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: liveLat ? NB.mint : NB.red }}>
                    {liveLat ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Map + Incidents row */}
          <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
            {/* Live Location Map */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800, color: NB.black, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}>
                  <MapPin size={16} /> Live Location — {profile.full_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, background: liveLat ? NB.mint : NB.red, animation: liveLat ? 'pulse-green 1.5s infinite' : undefined }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: liveLat ? NB.mint : NB.red }}>{liveLat ? 'Tracking Active' : 'No Signal'}</span>
                </div>
              </div>
              <div style={{ flex: 1, minHeight: 400 }}>
                <TouristMap lat={liveLat} lng={liveLng} zones={zones} />
              </div>
            </div>

            {/* Incidents */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Blockchain ID Card */}
              <div style={{ background: NB.black, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '16px' }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', margin: '0 0 8px' }}>Blockchain Identity</p>
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem', color: NB.yellow, fontWeight: 700, wordBreak: 'break-all' }}>
                  {profile.blockchain_id || 'NOT_MINTED'}
                </code>
                {profile.ward && (
                  <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>Assigned Ward</p>
                    <p style={{ color: NB.white, fontWeight: 700, margin: '2px 0 0', fontSize: '0.85rem' }}>{profile.ward?.name || profile.ward}</p>
                  </div>
                )}
              </div>

              {/* Location History */}
              <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.cream }}>
                  <h3 style={{ fontWeight: 800, color: NB.black, margin: 0, fontSize: '0.88rem' }}>Location Trail (48h)</h3>
                </div>
                <div style={{ padding: '12px', maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {locations.length > 0 ? locations.slice(0, 10).map((loc, i) => (
                    <div key={loc._id || i} style={{ padding: '8px 10px', background: NB.cream, border: `1px solid rgba(255,251,240,0.15)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", color: NB.black, fontWeight: 600 }}>
                        {loc.latitude?.toFixed(4)}, {loc.longitude?.toFixed(4)}
                      </span>
                      <span style={{ color: '#6B6B6B', fontWeight: 500 }}>{new Date(loc.recorded_at).toLocaleTimeString()}</span>
                    </div>
                  )) : (
                    <div style={{ padding: '16px', textAlign: 'center', color: '#6B6B6B', fontSize: '0.78rem', fontWeight: 600, border: `2px dashed rgba(255,251,240,0.2)` }}>
                      No location history available
                    </div>
                  )}
                </div>
              </div>

              {/* Incidents */}
              <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, flex: 1, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontWeight: 800, color: NB.black, margin: 0, fontSize: '0.88rem' }}>Reported Incidents</h3>
                  {incidents.length > 0 && <span style={{ padding: '2px 8px', background: NB.red, color: NB.white, fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase' }}>{incidents.length}</span>}
                </div>
                <div style={{ padding: '12px', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {incidents.length > 0 ? incidents.map(inc => (
                    <div key={inc._id} style={{ padding: '10px 12px', background: NB.cream, border: `2px solid ${sevColor(inc.severity)}`, display: 'flex', gap: 10 }}>
                      <AlertTriangle size={14} color={sevColor(inc.severity)} style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <p style={{ fontWeight: 700, color: NB.black, margin: 0, fontSize: '0.82rem' }}>{inc.title}</p>
                          <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', background: sevColor(inc.severity), color: NB.white, padding: '2px 5px', flexShrink: 0 }}>{inc.severity}</span>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: '#6B6B6B', margin: '2px 0 0', fontWeight: 500 }}>
                          {inc.status} · {new Date(inc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding: '20px', textAlign: 'center', border: `2px dashed rgba(255,251,240,0.2)` }}>
                      <Shield size={18} color={NB.mint} style={{ margin: '0 auto 6px' }} />
                      <p style={{ fontSize: '0.78rem', color: '#6B6B6B', fontWeight: 600 }}>No incidents reported by this user</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
