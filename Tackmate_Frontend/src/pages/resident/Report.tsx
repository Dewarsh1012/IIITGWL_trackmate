import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useLocation } from '../../hooks/use-location';
import { Loader2, Shield, AlertTriangle, Crosshair, MapPin, Search, ServerCrash, Flame, ArrowRight, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

export default function ResidentReport() {
  const { lat, lng } = useLocation();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue } = useForm({
    defaultValues: { incident_type: 'crime', title: '', description: '' }
  });

  const incidentType = watch('incident_type');

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      await api.post('/incidents', {
        ...data,
        severity: 'medium',
        latitude: lat,
        longitude: lng,
        source: 'user_app'
      });
      navigate('/resident/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const types = [
    { id: 'crime', label: 'Crime', icon: <AlertTriangle size={24} /> },
    { id: 'accident', label: 'Accident', icon: <ServerCrash size={24} /> },
    { id: 'medical', label: 'Medical', icon: <Crosshair size={24} /> },
    { id: 'infrastructure', label: 'Infrastructure', icon: <Shield size={24} /> },
    { id: 'missing_person', label: 'Missing Person', icon: <Search size={24} /> },
    { id: 'suspicious', label: 'Suspicious', icon: <AlertTriangle size={24} /> },
    { id: 'fire', label: 'Fire', icon: <Flame size={24} /> },
  ];

  const inputStyle = { width: '100%', padding: '12px 14px', background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `3px 3px 0 ${NB.black}`, fontFamily: 'inherit', fontSize: '0.9rem', fontWeight: 600, outline: 'none' };
  const labelStyle = { display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8, color: NB.black };

  return (
    <div style={{ flex: 1, padding: '24px', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif", overflowY: 'auto', paddingBottom: 100 }}>
      <div className="responsive-container" style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: NB.black, margin: '0 0 8px', textTransform: 'uppercase' }}>Report an Incident</h1>
            <p style={{ margin: 0, fontWeight: 700, color: '#555' }}>Provide the initial details of the occurrence.</p>
          </div>
          <div style={{ background: NB.black, color: NB.white, padding: '6px 12px', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Step {step} of 3
          </div>
        </div>

        {/* Progress Tracker */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {['Details', 'Location', 'Evidence'].map((s, i) => {
            const isActive = step >= i + 1;
            return (
              <div key={s} style={{ flex: 1 }}>
                <div style={{ height: 8, background: isActive ? NB.yellow : '#DDD', border: `2px solid ${NB.black}` }} />
                <p style={{ marginTop: 8, margin: '8px 0 0', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: isActive ? NB.black : '#888' }}>{s}</p>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ background: NB.white, border: `4px solid ${NB.black}`, boxShadow: `8px 8px 0 ${NB.black}` }}>
          <div style={{ padding: '32px 28px' }}>
            
            {step === 1 && (
              <>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: NB.black, margin: '0 0 20px', textTransform: 'uppercase' }}>What are you reporting?</h2>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 16, marginBottom: 32 }}>
                  {types.map((type) => {
                    const selected = incidentType === type.id;
                    return (
                      <button 
                        key={type.id} 
                        type="button"
                        onClick={() => setValue('incident_type', type.id)}
                        style={{ padding: 16, background: selected ? NB.yellow : NB.cream, border: `3px solid ${NB.black}`, boxShadow: selected ? `4px 4px 0 ${NB.black}` : 'none', transform: selected ? 'translate(-2px, -2px)' : 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, transition: 'all 0.1s' }}
                      >
                        <div style={{ color: NB.black }}>{type.icon}</div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: NB.black }}>{type.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div>
                    <label style={labelStyle}>Incident Title</label>
                    <input {...register('title', { required: true })} style={inputStyle} placeholder="Brief summary of the incident" type="text" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <label style={labelStyle}>Detailed Description</label>
                      <span style={{ fontSize: '0.65rem', fontWeight: 800, background: NB.yellow, border: `2px solid ${NB.black}`, padding: '2px 6px', color: NB.black }}>MIN 20 CHARS</span>
                    </div>
                    <textarea {...register('description', { required: true })} style={{ ...inputStyle, minHeight: 120, resize: 'vertical', marginTop: 8 }} placeholder="Please provide as much detail as possible about what happened..." />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                 <div style={{ width: 80, height: 80, background: NB.mint, border: `3px solid ${NB.black}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: `4px 4px 0 ${NB.black}` }}>
                   <MapPin size={40} color={NB.black} />
                 </div>
                 <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: NB.black, margin: '0 0 12px', textTransform: 'uppercase' }}>Auto-Capturing GPS Location</h2>
                 <p style={{ fontWeight: 600, color: '#555', margin: '0 0 24px' }}>Tagging incident with current device location.</p>
                 <div style={{ background: NB.black, color: NB.mint, padding: '12px 24px', display: 'inline-block', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.9rem', fontWeight: 800 }}>
                   {lat && lng ? `LAT: ${lat.toFixed(6)} | LNG: ${lng.toFixed(6)}` : 'Scanning Satellites...'}
                 </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ padding: '40px 0' }}>
                 <div style={{ background: NB.cream, border: `3px dashed ${NB.black}`, padding: '48px 24px', textAlign: 'center', cursor: 'pointer' }}>
                   <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 12px', textTransform: 'uppercase' }}>Upload Evidence</h3>
                   <p style={{ fontWeight: 600, color: '#555', margin: '0 0 24px' }}>Photos, videos, or audio (Optional)</p>
                   <span style={{ background: NB.black, color: NB.white, padding: '10px 20px', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Browse Files</span>
                 </div>
              </div>
            )}
          </div>

          <div style={{ background: NB.cream, borderTop: `4px solid ${NB.black}`, padding: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} style={{ padding: '12px 24px', background: NB.white, border: `3px solid ${NB.black}`, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <button type="button" onClick={() => navigate('/resident/dashboard')} style={{ padding: '12px 24px', background: NB.white, border: `3px solid ${NB.black}`, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', color: NB.red }}>
                Cancel
              </button>
            )}
            
            {step < 3 ? (
              <button type="button" onClick={() => setStep(step + 1)} style={{ padding: '12px 24px', background: NB.blue, color: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
               <button type="submit" disabled={isSubmitting} style={{ padding: '12px 24px', background: NB.mint, color: NB.black, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSubmitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting</> : 'Submit to Grid'}
              </button>
            )}
          </div>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#666' }}>
          <Shield size={16} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Secure & Encrypted</span>
        </div>
      </div>
    </div>
  );
}
