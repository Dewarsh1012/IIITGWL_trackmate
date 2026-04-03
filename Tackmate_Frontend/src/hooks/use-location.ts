import { useState, useEffect } from 'react';
import api from '../lib/api';

interface GeolocationState {
    lat: number | null;
    lng: number | null;
    accuracy: number | null;
    speed: number | null;
    heading: number | null;
    error: string | null;
    loading: boolean;
}

export function useLocation() {
    const [state, setState] = useState<GeolocationState>({
        lat: null, lng: null, accuracy: null, speed: null, heading: null,
        error: null, loading: true
    });

    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setState(s => ({ ...s, loading: false, error: 'Geolocation not supported' }));
            return;
        }

        let lastSent = 0;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy, speed, heading } = pos.coords;
                setState({ lat: latitude, lng: longitude, accuracy, speed, heading, error: null, loading: false });

                // Throttle DB inserts to every 30s
                const now = Date.now();
                if (now - lastSent > 30000) {
                    lastSent = now;
                    api.post('/locations', {
                        latitude,
                        longitude,
                        accuracy_meters: accuracy || 0,
                        speed: speed || 0,
                        heading: heading || 0,
                        source: 'gps',
                    }).catch(console.error);
                }
            },
            (error) => {
                setState(s => ({ ...s, loading: false, error: error.message }));
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return state;
}
