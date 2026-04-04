import { useEffect, useState } from 'react';
import { Plus, Loader2, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { CLAY_COLORS as C, CLAY_CARD_STYLE as clayCard } from '../../theme/clayTheme';

const clayInput: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    background: C.surfaceAlt,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: '0.88rem',
    fontWeight: 500,
    color: C.text,
    outline: 'none',
    boxShadow: 'inset 3px 3px 6px rgba(27,29,42,0.06), inset -2px -2px 4px rgba(255,255,255,0.8)',
};

export default function TouristItinerary() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [trip, setTrip] = useState<any>(null);
    const [itinerary, setItinerary] = useState<any>(null);
    const [error, setError] = useState('');

    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [entryPoint, setEntryPoint] = useState('');
    const [vehicleDetails, setVehicleDetails] = useState('');

    const [stopName, setStopName] = useState('');
    const [stopDescription, setStopDescription] = useState('');
    const [stopLat, setStopLat] = useState('');
    const [stopLng, setStopLng] = useState('');
    const [stopArrival, setStopArrival] = useState('');
    const [stopDeparture, setStopDeparture] = useState('');
    const [stopNotes, setStopNotes] = useState('');
    const [stopContactName, setStopContactName] = useState('');
    const [stopContactPhone, setStopContactPhone] = useState('');

    const loadTrip = async () => {
        try {
            setError('');
            const res = await api.get('/trips/active');
            if (res.data.success) {
                const t = res.data.data;
                setTrip(t);
                if (t) {
                    setDestination(t.destination_region || '');
                    setStartDate(t.start_date ? t.start_date.split('T')[0] : '');
                    setEndDate(t.end_date ? t.end_date.split('T')[0] : '');
                    setEntryPoint(t.entry_point || '');
                    setVehicleDetails(t.vehicle_details || '');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Unable to load trip.');
        }
    };

    const loadItinerary = async (tripId: string) => {
        try {
            const res = await api.get(`/trips/${tripId}/itinerary`);
            if (res.data.success) setItinerary(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Unable to load itinerary.');
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadTrip();
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        if (trip?._id) loadItinerary(trip._id);
    }, [trip?._id]);

    const handleSaveTrip = async () => {
        if (!destination || !startDate || !endDate) {
            setError('Destination, start date, and end date are required.');
            return;
        }
        try {
            setError('');
            if (trip?._id) {
                const res = await api.patch(`/trips/${trip._id}`, {
                    destination_region: destination,
                    start_date: startDate,
                    end_date: endDate,
                    entry_point: entryPoint,
                    vehicle_details: vehicleDetails,
                });
                if (res.data.success) setTrip(res.data.data);
            } else {
                const res = await api.post('/trips', {
                    destination_region: destination,
                    start_date: startDate,
                    end_date: endDate,
                    entry_point: entryPoint,
                    vehicle_details: vehicleDetails,
                });
                if (res.data.success) setTrip(res.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to save trip.');
        }
    };

    const handleCreateItinerary = async () => {
        if (!trip?._id) {
            setError('Create a trip first.');
            return;
        }
        try {
            setError('');
            const res = await api.post(`/trips/${trip._id}/itinerary`, {
                title: `${user?.full_name || 'Traveler'} Itinerary`,
                stops: [],
            });
            if (res.data.success) setItinerary(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create itinerary.');
        }
    };

    const handleAddStop = async () => {
        if (!trip?._id) {
            setError('Create a trip first.');
            return;
        }
        if (!stopName || !stopLat || !stopLng) {
            setError('Stop name and coordinates are required.');
            return;
        }
        try {
            setError('');
            let itineraryId = itinerary?._id;
            if (!itineraryId) {
                const itRes = await api.post(`/trips/${trip._id}/itinerary`, {
                    title: `${user?.full_name || 'Traveler'} Itinerary`,
                    stops: [],
                });
                itineraryId = itRes.data.data?._id;
                setItinerary(itRes.data.data);
            }
            const nextOrder = (itinerary?.stops?.length || 0);
            const res = await api.post(`/trips/itinerary/${itineraryId}/stops`, {
                destination_name: stopName,
                description: stopDescription || undefined,
                latitude: Number(stopLat),
                longitude: Number(stopLng),
                planned_arrival: stopArrival || undefined,
                planned_departure: stopDeparture || undefined,
                safety_notes: stopNotes || undefined,
                contact_name: stopContactName || undefined,
                contact_phone: stopContactPhone || undefined,
                sort_order: nextOrder,
            });
            if (res.data.success) {
                const updatedStops = [...(itinerary?.stops || []), res.data.data];
                setItinerary((prev: any) => ({ ...prev, stops: updatedStops }));
                setStopName('');
                setStopDescription('');
                setStopLat('');
                setStopLng('');
                setStopArrival('');
                setStopDeparture('');
                setStopNotes('');
                setStopContactName('');
                setStopContactPhone('');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add stop.');
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                <Loader2 size={32} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '24px' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ ...clayCard, padding: 20 }}>
                    <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: C.text }}>Trip Plan</h2>
                    <p style={{ margin: '4px 0 16px', color: C.textMuted, fontSize: '0.82rem' }}>Create or update your travel plan.</p>

                    {error && (
                        <div style={{ marginBottom: 12, background: 'rgba(248,113,113,0.12)', border: `1px solid ${C.high}40`, color: C.high, padding: '10px 12px', borderRadius: 12, fontSize: '0.82rem', fontWeight: 700 }}>
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Destination</label>
                            <input value={destination} onChange={(e) => setDestination(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Entry Point</label>
                            <input value={entryPoint} onChange={(e) => setEntryPoint(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={clayInput} />
                        </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Vehicle Details</label>
                        <input value={vehicleDetails} onChange={(e) => setVehicleDetails(e.target.value)} style={clayInput} />
                    </div>

                    <button onClick={handleSaveTrip} style={{ marginTop: 16, width: '100%', background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', color: '#FFFFFF', fontWeight: 800, fontSize: '0.86rem', padding: '12px 0', borderRadius: 14, cursor: 'pointer', boxShadow: '0 8px 18px rgba(108,99,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {trip ? 'Update Trip' : 'Create Trip'}
                    </button>
                </div>

                <div style={{ ...clayCard, padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <h2 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem', color: C.text }}>Itinerary Stops</h2>
                            <p style={{ margin: '4px 0', color: C.textMuted, fontSize: '0.82rem' }}>Add your planned locations and contacts.</p>
                        </div>
                        {!itinerary && (
                            <button onClick={handleCreateItinerary} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 12px', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <Plus size={14} /> Create
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Stop Name</label>
                            <input value={stopName} onChange={(e) => setStopName(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Description</label>
                            <input value={stopDescription} onChange={(e) => setStopDescription(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Latitude</label>
                            <input value={stopLat} onChange={(e) => setStopLat(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Longitude</label>
                            <input value={stopLng} onChange={(e) => setStopLng(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Planned Arrival</label>
                            <input type="datetime-local" value={stopArrival} onChange={(e) => setStopArrival(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Planned Departure</label>
                            <input type="datetime-local" value={stopDeparture} onChange={(e) => setStopDeparture(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Safety Notes</label>
                            <input value={stopNotes} onChange={(e) => setStopNotes(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Contact Name</label>
                            <input value={stopContactName} onChange={(e) => setStopContactName(e.target.value)} style={clayInput} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Contact Phone</label>
                            <input value={stopContactPhone} onChange={(e) => setStopContactPhone(e.target.value)} style={clayInput} />
                        </div>
                    </div>

                    <button onClick={handleAddStop} style={{ marginTop: 16, width: '100%', background: 'linear-gradient(135deg, #34D399, #2DD4BF)', border: 'none', color: '#FFFFFF', fontWeight: 800, fontSize: '0.86rem', padding: '12px 0', borderRadius: 14, cursor: 'pointer', boxShadow: '0 8px 18px rgba(52,211,153,0.25)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Add Stop
                    </button>

                    {itinerary?.stops?.length > 0 && (
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {itinerary.stops.map((stop: any) => (
                                <div key={stop._id} style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: '0.85rem' }}>{stop.destination_name}</p>
                                        <p style={{ margin: 0, color: C.textMuted, fontSize: '0.72rem' }}>{stop.latitude}, {stop.longitude}</p>
                                    </div>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.safe, fontWeight: 700, fontSize: '0.7rem' }}>
                                        <CheckCircle size={12} /> Planned
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!itinerary?.stops?.length && (
                        <div style={{ marginTop: 16, padding: 16, border: `2px dashed ${C.border}`, borderRadius: 14, textAlign: 'center', color: C.textMuted, fontSize: '0.8rem', fontWeight: 600 }}>
                            No itinerary stops yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
