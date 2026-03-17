import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useSocket } from '../../context/SocketContext';
import TouristMap from '../../components/maps/TouristMap';
import { Link } from 'react-router-dom';
import { 
  Map as MapIcon, AlertTriangle, ShieldAlert, 
  Watch, Shield, Loader2, Check, RefreshCw, 
  Navigation as NearMe, Calendar, CheckCircle2
} from 'lucide-react';

export default function TouristDashboard() {
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [timer, setTimer] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);
  const { socket } = useSocket();

  useEffect(() => {
    fetchTouristData();
    const interval = setInterval(fetchTouristData, 30000);

    if (socket) {
        socket.on('new-incident', (incident: any) => {
            setAlerts(prev => [incident, ...prev]);
            // Maybe show a toast or browser notification?
        });
    }

    return () => {
        clearInterval(interval);
        if (socket) socket.off('new-incident');
    };
  }, [socket]);

  const fetchTouristData = async () => {
    try {
      const [tripRes, alertsRes] = await Promise.all([
        api.get('/trips/active'),
        api.get('/incidents?is_public=true&limit=5')
      ]);

      if (tripRes.data.success) {
        setActiveTrip(tripRes.data.data);
      }
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tourist data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSOSStart = () => {
    setCountdown(3);
    const t = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(t);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimer(t);
  };

  const handleSOSEnd = () => {
    if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
    setCountdown(0);
  };

  const triggerSOS = async () => {
    setSosLoading(true);
    try {
      // Get current location (mock for now or use navigator.geolocation)
      const pos = await new Promise<GeolocationPosition>((res, rej) => {
        navigator.geolocation.getCurrentPosition(res, rej);
      }).catch(() => null);

      await api.post('/incidents', {
        title: 'EMERGENCY SOS TRIGGERED',
        incident_type: 'SOS_EMERGENCY',
        severity: 'critical',
        source: 'sos_panic',
        latitude: pos?.coords.latitude || 27.5855,
        longitude: pos?.coords.longitude || 91.8594,
        is_public: true
      });
      setSosSuccess(true);
      setTimeout(() => setSosSuccess(false), 5000);
    } catch (err) {
      console.error('SOS failed:', err);
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto p-4 space-y-4 text-slate-900 dark:text-slate-100 font-['Public_Sans',_sans-serif]">
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
          Safety Coverage: 98.4%
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
            <TouristMap lat={27.5855} lng={91.8594} />

            <div className="absolute top-6 left-6 w-72 z-[100]">
              <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-xl shadow-2xl border border-white/20 dark:border-slate-800 p-1.5 flex items-center pointer-events-auto">
                <span className="material-symbols-outlined px-2 text-slate-400">search</span>
                <input className="border-none focus:ring-0 text-sm bg-transparent w-full placeholder:text-slate-400 dark:text-slate-100 outline-none" placeholder="Find hospitals, kiosks, shelters..." type="text"/>
              </div>
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
                <div className="flex gap-2">
                  <button className="flex-1 py-2 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all">Update Plan</button>
                  <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">Verify Stay</button>
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
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/50 hover:bg-primary/5 transition-all group">
                <CheckCircle2 className="size-6 text-primary mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Check-in</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group">
                <AlertTriangle className="size-6 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Report Anomaly</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                <Watch className="size-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">IoT Sync</span>
              </button>
              <button className="flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
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
                    <p className="text-[11px] text-slate-500 m-0 mt-1 line-clamp-2">{alert.description || alert.zone?.name}</p>
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
    </div>
  );
}
