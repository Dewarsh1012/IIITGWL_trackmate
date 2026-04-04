import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Loader2, Save, MapPin, Phone, Globe, Building2 } from 'lucide-react';
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

export default function BusinessProfile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState<string | null>(null);

    const [businessName, setBusinessName] = useState('');
    const [category, setCategory] = useState('accommodation');
    const [description, setDescription] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/businesses/me');
                if (res.data.success && res.data.data) {
                    const b = res.data.data;
                    setBusinessName(b.business_name || '');
                    setCategory(b.category || 'accommodation');
                    setDescription(b.description || '');
                    setLatitude(b.latitude ? String(b.latitude) : '');
                    setLongitude(b.longitude ? String(b.longitude) : '');
                    setAddress(b.address || '');
                    setPhone(b.phone || '');
                    setWebsite(b.website || '');
                }
            } catch {
                setNotice('Failed to load business profile.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSave = async () => {
        try {
            setSaving(true);
            setNotice(null);
            const payload = {
                business_name: businessName,
                category,
                description,
                latitude: Number(latitude || 0),
                longitude: Number(longitude || 0),
                address,
                phone,
                website,
            };
            const res = await api.patch('/businesses/me', payload);
            if (res.data.success) setNotice('Business profile updated.');
        } catch {
            setNotice('Failed to save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
                <Loader2 size={32} style={{ animation: 'spin-slow 1s linear infinite', color: C.primary }} />
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 24 }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div>
                        <h1 style={{ margin: 0, fontWeight: 800, color: C.text, fontSize: '1.5rem' }}>Business Profile</h1>
                        <p style={{ margin: '4px 0 0', color: C.textMuted, fontSize: '0.82rem' }}>Manage your listing and contact details.</p>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 999, background: `${C.primary}1A`, color: C.primary, fontWeight: 700, fontSize: '0.72rem' }}>
                        <Building2 size={14} /> {user?.business_name || 'Business'}
                    </div>
                </div>

                {notice && (
                    <div style={{ marginBottom: 12, background: `${C.safe}22`, border: `1px solid ${C.safe}`, padding: '10px 12px', borderRadius: 12, fontWeight: 700, color: C.text }}>
                        {notice}
                    </div>
                )}

                <div style={{ ...clayCard, padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Business Name</label>
                        <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={clayInput} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} style={clayInput}>
                            <option value="accommodation">Accommodation</option>
                            <option value="food_beverage">Food & Beverage</option>
                            <option value="transport">Transport</option>
                            <option value="medical">Medical</option>
                            <option value="retail">Retail</option>
                            <option value="tour_operator">Tour Operator</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Description</label>
                        <input value={description} onChange={(e) => setDescription(e.target.value)} style={clayInput} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Latitude</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={14} color={C.primary} />
                            <input value={latitude} onChange={(e) => setLatitude(e.target.value)} style={clayInput} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Longitude</label>
                        <input value={longitude} onChange={(e) => setLongitude(e.target.value)} style={clayInput} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Address</label>
                        <input value={address} onChange={(e) => setAddress(e.target.value)} style={clayInput} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Phone</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Phone size={14} color={C.primary} />
                            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={clayInput} />
                        </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: C.textMuted }}>Website</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Globe size={14} color={C.primary} />
                            <input value={website} onChange={(e) => setWebsite(e.target.value)} style={clayInput} />
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving} style={{ gridColumn: '1 / -1', marginTop: 6, background: 'linear-gradient(135deg, #6C63FF, #8B85FF)', border: 'none', color: '#FFFFFF', fontWeight: 800, fontSize: '0.86rem', padding: '12px 0', borderRadius: 14, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em', boxShadow: '0 8px 18px rgba(108,99,255,0.25)' }}>
                        {saving ? <Loader2 size={16} style={{ animation: 'spin-slow 1s linear infinite' }} /> : <Save size={16} />} Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
