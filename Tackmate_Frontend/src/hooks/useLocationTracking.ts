import { useEffect, useRef, useState, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isTracking: boolean;
  error: string | null;
  zoneAlert: { type: string; zone: any; message: string } | null;
}

/**
 * Live location tracking hook.
 * Sends GPS coordinates every 5 seconds via socket when enabled.
 * Also listens for zone_alert events from the backend.
 */
export function useLocationTracking(autoStart = false) {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [state, setState] = useState<LocationState>({
    latitude: null, longitude: null, accuracy: null,
    isTracking: false, error: null, zoneAlert: null,
  });
  const watchRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const latestPos = useRef<{ lat: number; lng: number; acc: number }>({ lat: 0, lng: 0, acc: 0 });

  // Listen for zone alerts
  useEffect(() => {
    if (!socket) return;
    const handleZoneAlert = (data: any) => {
      setState(prev => ({ ...prev, zoneAlert: data }));
      // Auto-clear zone alert after 8 seconds
      setTimeout(() => setState(prev => ({ ...prev, zoneAlert: null })), 8000);
    };
    socket.on('zone_alert', handleZoneAlert);
    return () => { socket.off('zone_alert', handleZoneAlert); };
  }, [socket]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported' }));
      return;
    }

    // Watch position continuously
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        latestPos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy };
        setState(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          isTracking: true,
          error: null,
        }));
      },
      (err) => {
        setState(prev => ({ ...prev, error: err.message }));
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    watchRef.current = watchId;

    // Send location via socket every 5 seconds
    const emitInterval = setInterval(() => {
      if (socket && user && latestPos.current.lat !== 0) {
        socket.emit('location_update', {
          userId: user.id,
          latitude: latestPos.current.lat,
          longitude: latestPos.current.lng,
          accuracy: latestPos.current.acc,
        });
      }
    }, 5000);
    intervalRef.current = emitInterval;

    setState(prev => ({ ...prev, isTracking: true }));
  }, [socket, user]);

  const stopTracking = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({ ...prev, isTracking: false }));
  }, []);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart && socket && user) {
      startTracking();
    }
    return () => stopTracking();
  }, [autoStart, socket, user, startTracking, stopTracking]);

  return {
    ...state,
    startTracking,
    stopTracking,
  };
}
