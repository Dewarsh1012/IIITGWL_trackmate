import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import TouristMap from '../../components/maps/TouristMap';
import type { ZoneData } from '../../components/maps/TouristMap';
import { Link } from 'react-router-dom';
import { 
  Map as MapIcon, AlertTriangle, ShieldAlert, 
  Watch, Shield, Loader2, Check, RefreshCw, 
  Navigation as NearMe, Calendar, CheckCircle2,
  X, Send, MapPin, Radio, Bluetooth, Wifi
} from 'lucide-react';

// ───── Helpers ──────────────────────────────────────────────────────────

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  return (
    <div className={`fixed top-6 right-6 z-[9999] ${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-4 text-sm font-semibold`}>
      {type === 'success' ? <Check className="size-4" /> : type === 'error' ? <X className="size-4" /> : <Radio className="size-4" />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X className="size-3" /></button>
    </div>
  );
}

// ───── Modal Shell ──────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white m-0">{title}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"><X className="size-5 text-slate-400" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ───── Main Dashboard ───────────────────────────────────────────────────

export default function TouristDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  // Data state
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [loading, setLoading] = useState(true);

  // GPS state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // SOS state
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [timer, setTimer] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);

  // Feature state
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const [verifyResult, setVerifyResult] = useState<string | null>(null);
  const [highlightZoneId, setHighlightZoneId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [updateTripModalOpen, setUpdateTripModalOpen] = useState(false);
  const [iotModalOpen, setIotModalOpen] = useState(false);

  // ── GPS tracking ─────────────────────────────────────────────────────

  useEffect(() => {
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setUserLat(pos.coords.latitude);
          setUserLng(pos.coords.longitude);
        },
        () => {
          // Fallback to Tawang
          setUserLat(27.5855);
          setUserLng(91.8594);
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    } else {
      setUserLat(27.5855);
      setUserLng(91.8594);
    }
    return () => { if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current); };
  }, []);

  // Periodic location POST (every 60s)
  useEffect(() => {
    const postLocation = async () => {
      if (userLat && userLng) {
        try { await api.post('/locations', { latitude: userLat, longitude: userLng, source: 'gps' }); } catch {}
      }
    };
    postLocation(); // initial
    locationIntervalRef.current = setInterval(postLocation, 60000);
    return () => { if (locationIntervalRef.current) clearInterval(locationIntervalRef.current); };
  }, [userLat, userLng]);

  // ── Data fetching ────────────────────────────────────────────────────

  const fetchTouristData = useCallback(async () => {
    try {
      const [tripRes, alertsRes, zonesRes] = await Promise.all([
        api.get('/trips/active'),
        api.get('/incidents?limit=10'),
        api.get('/zones'),
      ]);
      if (tripRes.data.success) setActiveTrip(tripRes.data.data);
      if (alertsRes.data.success) setAlerts(alertsRes.data.data || []);
      if (zonesRes.data.success) setZones(zonesRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch tourist data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTouristData();
    const interval = setInterval(fetchTouristData, 30000);

    if (socket) {
      socket.on('new-incident', (incident: any) => {
        setAlerts(prev => [incident, ...prev]);
      });
    }

    return () => {
      clearInterval(interval);
      if (socket) socket.off('new-incident');
    };
  }, [socket, fetchTouristData]);

  // ── Quick Actions ────────────────────────────────────────────────────

  const handleCheckin = async () => {
    if (!userLat || !userLng) { setToast({ message: 'Unable to get your location', type: 'error' }); return; }
    setCheckinLoading(true);
    try {
      const res = await api.post('/locations', { latitude: userLat, longitude: userLng, source: 'gps' });
      setCheckinDone(true);
      const zone = res.data.data?.zone;
      setToast({ message: zone ? `Checked in at ${zone.name} (${zone.risk_level})` : 'Daily check-in recorded ✓', type: 'success' });
      setTimeout(() => setCheckinDone(false), 5000);
    } catch {
      setToast({ message: 'Check-in failed. Try again.', type: 'error' });
    } finally {
      setCheckinLoading(false);
    }
  };

  const handleVerifyStay = async () => {
    if (!userLat || !userLng) { setToast({ message: 'Unable to get your location', type: 'error' }); return; }
    try {
      const res = await api.post('/locations', { latitude: userLat, longitude: userLng, source: 'gps' });
      const zone = res.data.data?.zone;
      if (zone) {
        setVerifyResult(`✓ You are in "${zone.name}" — ${zone.risk_level} zone`);
        setHighlightZoneId(zone._id);
        setTimeout(() => setHighlightZoneId(null), 8000);
      } else {
        setVerifyResult('ℹ You are not inside any registered zone');
      }
      setTimeout(() => setVerifyResult(null), 6000);
    } catch {
      setToast({ message: 'Verification failed', type: 'error' });
    }
  };

  const handleSafeHouse = () => {
    if (!userLat || !userLng) { setToast({ message: 'Unable to get your location', type: 'error' }); return; }
    const safeZones = zones.filter(z => z.risk_level === 'safe');
    if (safeZones.length === 0) { setToast({ message: 'No safe zones registered in this area', type: 'info' }); return; }
    let nearest = safeZones[0];
    let minDist = haversine(userLat, userLng, nearest.center_lat, nearest.center_lng);
    for (const z of safeZones) {
      const d = haversine(userLat, userLng, z.center_lat, z.center_lng);
      if (d < minDist) { nearest = z; minDist = d; }
    }
    setHighlightZoneId(nearest._id);
    setToast({ message: `Nearest safe zone: ${nearest.name} (${Math.round(minDist)}m away)`, type: 'success' });
    setTimeout(() => setHighlightZoneId(null), 10000);
  };

  // ── SOS ──────────────────────────────────────────────────────────────

  const handleSOSStart = () => {
    setCountdown(3);
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(t); triggerSOS(); return 0; }
        return prev - 1;
      });
    }, 1000);
    setTimer(t);
  };

  const handleSOSEnd = () => {
    if (timer) { clearInterval(timer); setTimer(null); }
    setCountdown(0);
  };

  const triggerSOS = async () => {
    setSosLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej);
      }).catch(() => null);

      await api.post('/incidents', {
        title: 'EMERGENCY SOS TRIGGERED',
        incident_type: 'SOS_EMERGENCY',
        severity: 'critical',
        source: 'sos_panic',
        latitude: pos?.coords.latitude || userLat || 27.5855,
        longitude: pos?.coords.longitude || userLng || 91.8594,
        is_public: true
      });
      setSosSuccess(true);
      setTimeout(() => setSosSuccess(false), 5000);
    } catch {
      setToast({ message: 'SOS transmission failed!', type: 'error' });
    } finally {
      setSosLoading(false);
    }
  };

  // ── Map search ───────────────────────────────────────────────────────

  const filteredZones = searchQuery.trim()
    ? zones.filter(z => z.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : zones;

  const handleSearchSelect = (zone: ZoneData) => {
    setHighlightZoneId(zone._id);
    setSearchQuery('');
    setTimeout(() => setHighlightZoneId(null), 8000);
  };

  // ── Safety coverage ──────────────────────────────────────────────────

  const safetyCoverage = user?.safety_score ?? 85;

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1440px] mx-auto p-4 space-y-4 text-slate-900 dark:text-slate-100 font-['Public_Sans',_sans-serif]">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Safety Banner */}
      <div className="w-full bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between safety-pulse gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-green-500 rounded-full p-2 flex items-center justify-center text-white">
            <Shield className="size-5" />
          </div>
          <div>
            <h2 className="text-green-800 dark:text-green-400 font-bold text-lg m-0">System Protected — Monitoring Active</h2>
            <p className="text-green-700/70 dark:text-green-400/70 text-sm m-0 mt-1">
              Your location is being live-streamed to {activeTrip?.destination_region || 'local authorities'} command center.
            </p>
          </div>
        </div>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">
          Safety Score: {safetyCoverage}%
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Map Column */}
        <div className="col-span-12 lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[600px] flex flex-col shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 m-0">
              <MapIcon className="size-5 text-primary" />
              Live Safety GIS
            </h3>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="size-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> Safe
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="size-2 rounded-full bg-amber-500"></span> Moderate
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="size-2 rounded-full bg-red-500"></span> Restricted
              </div>
            </div>
          </div>
          <div className="relative flex-grow bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <TouristMap lat={userLat} lng={userLng} zones={zones} highlightZoneId={highlightZoneId} />

            {/* Search overlay */}
            <div className="absolute top-6 left-6 w-72 z-[100]">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 dark:border-slate-800 p-1.5 flex items-center pointer-events-auto">
                <MapPin className="size-4 mx-2 text-slate-400 shrink-0" />
                <input
                  className="border-none focus:ring-0 text-sm bg-transparent w-full placeholder:text-slate-400 dark:text-slate-100 outline-none"
                  placeholder="Search zones, hospitals, kiosks..."
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Search results dropdown */}
              {searchQuery.trim() && filteredZones.length > 0 && (
                <div className="mt-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 max-h-48 overflow-y-auto">
                  {filteredZones.map(zone => (
                    <button
                      key={zone._id}
                      onClick={() => handleSearchSelect(zone)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <span className={`size-2 rounded-full shrink-0 ${
                        zone.risk_level === 'safe' ? 'bg-green-500' :
                        zone.risk_level === 'moderate' ? 'bg-amber-500' :
                        zone.risk_level === 'high' ? 'bg-red-500' : 'bg-purple-500'
                      }`} />
                      <span className="text-xs font-medium truncate">{zone.name}</span>
                      <span className="ml-auto text-[10px] uppercase text-slate-400 tracking-wider">{zone.risk_level}</span>
                    </button>
                  ))}
                </div>
              )}
              {searchQuery.trim() && filteredZones.length === 0 && (
                <div className="mt-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg shadow-xl border border-slate-200 dark:border-slate-800 p-3 text-xs text-slate-400 text-center">
                  No zones matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="col-span-12 lg:col-span-5 xl:col-span-4 space-y-4 flex flex-col min-h-0">
          {/* Trip Info */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 m-0">
              <Calendar className="size-5 text-primary" />
              Active Itinerary
            </h3>
            {activeTrip ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">Destination</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white m-0">{activeTrip.destination_region}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest m-0">Duration</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white m-0">
                      {new Date(activeTrip.start_date).toLocaleDateString()} - {new Date(activeTrip.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {verifyResult && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 animate-in slide-in-from-top-2">
                    {verifyResult}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setUpdateTripModalOpen(true)} className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all">Update Plan</button>
                  <button onClick={handleVerifyStay} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Verify Stay</button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-sm text-slate-400 mb-4">No active trip found for your profile.</p>
                <Link to="/tourist/plan" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20">
                  <NearMe className="size-4" /> Start Planning
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-4 m-0">Safety Services</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCheckin} disabled={checkinLoading} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/50 hover:bg-primary/5 transition-all group disabled:opacity-50">
                {checkinLoading ? <Loader2 className="size-6 text-primary mb-2 animate-spin" /> : checkinDone ? <Check className="size-6 text-green-500 mb-2" /> : <CheckCircle2 className="size-6 text-primary mb-2 group-hover:scale-110 transition-transform" />}
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{checkinDone ? 'Checked In ✓' : 'Daily Check-in'}</span>
              </button>
              <button onClick={() => setReportModalOpen(true)} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group">
                <AlertTriangle className="size-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Report Anomaly</span>
              </button>
              <button onClick={() => setIotModalOpen(true)} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                <Watch className="size-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">IoT Sync</span>
              </button>
              <button onClick={handleSafeHouse} className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                <ShieldAlert className="size-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Safe House</span>
              </button>
            </div>
          </div>

          {/* Live Alerts */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex-grow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 m-0">Safety Broadcasts</h3>
              <div className="flex gap-2">
                <button onClick={fetchTouristData} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors">
                  <RefreshCw className={`size-3 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
                </button>
                {alerts.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                    {alerts.length} Active
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[200px] pr-1 scrollbar-thin">
              {alerts.length > 0 ? alerts.map((alert) => (
                <div key={alert._id} className={`p-3 rounded-lg flex gap-3 border ${
                  alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 
                  alert.severity === 'high' ? 'bg-amber-500/5 border-amber-500/20' : 
                  'bg-blue-500/5 border-blue-500/20'
                }`}>
                  <AlertTriangle className={`size-5 shrink-0 ${
                    alert.severity === 'critical' ? 'text-red-500' : 
                    alert.severity === 'high' ? 'text-amber-500' : 
                    'text-blue-500'
                  }`} />
                  <div>
                    <p className={`text-xs font-bold m-0 ${
                      alert.severity === 'critical' ? 'text-red-800 dark:text-red-400' : 
                      alert.severity === 'high' ? 'text-amber-800 dark:text-amber-400' : 
                      'text-blue-800 dark:text-blue-400'
                    }`}>{alert.title}</p>
                    <p className="text-[11px] text-slate-500 m-0 mt-1 line-clamp-2">{alert.description || alert.zone?.name || new Date(alert.created_at).toLocaleString()}</p>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-lg">
                  <Check className="size-6 text-green-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">All sectors clear. Enjoy your trip!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SOS Button */}
      <div className="fixed bottom-24 md:bottom-10 right-10 z-[1000] group">
        <div className={`absolute -inset-4 bg-red-600/20 rounded-full blur-xl group-hover:bg-red-600/40 transition-all duration-500 ${countdown > 0 ? 'bg-red-600/60 scale-150' : ''}`}></div>
        
        {sosSuccess ? (
          <div className="relative bg-green-500 text-white size-24 rounded-full flex flex-col items-center justify-center shadow-2xl animate-bounce">
            <Check className="size-10" />
            <span className="text-[8px] font-black uppercase tracking-wider mt-1 text-center px-2">Alert Sent</span>
          </div>
        ) : (
          <button 
            onMouseDown={handleSOSStart}
            onMouseUp={handleSOSEnd}
            onMouseLeave={handleSOSEnd}
            onTouchStart={handleSOSStart}
            onTouchEnd={handleSOSEnd}
            className={`relative bg-red-600 text-white size-24 rounded-full flex flex-col items-center justify-center shadow-2xl active:scale-95 transition-all outline-none border-none select-none
                       ${countdown > 0 ? 'scale-110 !bg-red-800' : 'sos-pulse hover:bg-red-700'}`}
          >
            {sosLoading ? (
              <Loader2 className="animate-spin size-8" />
            ) : countdown > 0 ? (
              <span className="text-4xl font-black">{countdown}</span>
            ) : (
              <>
                <ShieldAlert className="size-10 mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Hold SOS</span>
              </>
            )}
          </button>
        )}

        {countdown > 0 && (
          <div className="absolute top-0 right-full mr-6 whitespace-nowrap bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-2xl animate-in slide-in-from-right-4 duration-200">
            TRANSMITTING TO POLICE IN {countdown}s...
          </div>
        )}
      </div>

      {/* ─────────── MODALS ─────────── */}

      {/* Report Anomaly Modal */}
      <ReportAnomalyModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        userLat={userLat}
        userLng={userLng}
        onSuccess={(title) => {
          setToast({ message: `Anomaly "${title}" reported successfully`, type: 'success' });
          fetchTouristData();
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {/* Update Trip Modal */}
      <UpdateTripModal
        open={updateTripModalOpen}
        onClose={() => setUpdateTripModalOpen(false)}
        trip={activeTrip}
        onSuccess={() => {
          setToast({ message: 'Trip updated successfully', type: 'success' });
          fetchTouristData();
        }}
        onError={(msg) => setToast({ message: msg, type: 'error' })}
      />

      {/* IoT Sync Modal */}
      <Modal open={iotModalOpen} onClose={() => setIotModalOpen(false)} title="IoT Device Sync">
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center size-20 rounded-full bg-blue-500/10 mb-4">
              <Watch className="size-10 text-blue-500" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Connect your wearable or IoT safety band to enable real-time biometric and location syncing.</p>
          </div>
          <div className="space-y-3">
            <button onClick={() => { setToast({ message: 'Searching for Bluetooth devices...', type: 'info' }); setIotModalOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Bluetooth className="size-5 text-blue-500" />
              <div className="text-left">
                <p className="text-sm font-bold m-0">Bluetooth Pair</p>
                <p className="text-[11px] text-slate-400 m-0">Search for nearby IoT bands</p>
              </div>
            </button>
            <button onClick={() => { setToast({ message: 'WiFi direct scan initiated', type: 'info' }); setIotModalOpen(false); }} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Wifi className="size-5 text-green-500" />
              <div className="text-left">
                <p className="text-sm font-bold m-0">WiFi Direct</p>
                <p className="text-[11px] text-slate-400 m-0">Connect via local network</p>
              </div>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Report Anomaly Modal
// ═══════════════════════════════════════════════════════════════════════

function ReportAnomalyModal({ open, onClose, userLat, userLng, onSuccess, onError }: {
  open: boolean; onClose: () => void; userLat: number | null; userLng: number | null;
  onSuccess: (title: string) => void; onError: (msg: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('suspicious_activity');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/incidents', {
        title,
        description,
        incident_type: incidentType,
        severity,
        source: 'resident_report',
        latitude: userLat || 27.5855,
        longitude: userLng || 91.8594,
        is_public: true,
      });
      onSuccess(title);
      setTitle(''); setDescription(''); setIncidentType('suspicious_activity'); setSeverity('medium');
      onClose();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const InputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400";

  return (
    <Modal open={open} onClose={onClose} title="Report Safety Anomaly">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Incident Type</label>
          <select value={incidentType} onChange={e => setIncidentType(e.target.value)} className={InputClass}>
            <option value="suspicious_activity">Suspicious Activity</option>
            <option value="theft">Theft / Robbery</option>
            <option value="harassment">Harassment</option>
            <option value="natural_hazard">Natural Hazard</option>
            <option value="infrastructure">Infrastructure Issue</option>
            <option value="medical">Medical Emergency</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className={InputClass} placeholder="Brief summary of the incident" required />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className={`${InputClass} resize-none`} rows={3} placeholder="Provide details about what you observed..." />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Severity</label>
          <div className="flex gap-2">
            {(['low', 'medium', 'high', 'critical'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                  severity === s
                    ? s === 'low' ? 'bg-green-500/10 border-green-500 text-green-600'
                    : s === 'medium' ? 'bg-blue-500/10 border-blue-500 text-blue-600'
                    : s === 'high' ? 'bg-amber-500/10 border-amber-500 text-amber-600'
                    : 'bg-red-500/10 border-red-500 text-red-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs text-slate-500">
          <MapPin className="size-4 shrink-0 text-primary" />
          Location: {userLat?.toFixed(4)}, {userLng?.toFixed(4)} (auto-detected)
        </div>
        <button type="submit" disabled={submitting || !title.trim()} className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {submitting ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Update Trip Modal
// ═══════════════════════════════════════════════════════════════════════

function UpdateTripModal({ open, onClose, trip, onSuccess, onError }: {
  open: boolean; onClose: () => void; trip: any;
  onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Populate when trip data changes
  useEffect(() => {
    if (trip) {
      setDestination(trip.destination_region || '');
      setStartDate(trip.start_date ? trip.start_date.split('T')[0] : '');
      setEndDate(trip.end_date ? trip.end_date.split('T')[0] : '');
    }
  }, [trip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trip?._id) return;
    setSubmitting(true);
    try {
      await api.patch(`/trips/${trip._id}`, {
        destination_region: destination,
        start_date: startDate,
        end_date: endDate,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      onError(err.response?.data?.message || 'Failed to update trip');
    } finally {
      setSubmitting(false);
    }
  };

  const InputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-slate-900 dark:text-white [color-scheme:dark]";

  return (
    <Modal open={open} onClose={onClose} title="Update Travel Plan">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Destination Region</label>
          <input value={destination} onChange={e => setDestination(e.target.value)} className={InputClass} placeholder="e.g. Tawang District" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={InputClass} required />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={InputClass} required />
          </div>
        </div>
        <button type="submit" disabled={submitting} className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 rounded-lg font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50">
          {submitting ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {submitting ? 'Updating...' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
}
