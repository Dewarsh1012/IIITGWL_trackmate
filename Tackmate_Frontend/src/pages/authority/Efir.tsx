import { useState, useEffect } from 'react';
import { Trash2, Upload, Eye, Send, Save, MapPin, Calendar, FileText, Loader2, Fingerprint, Users, Mail, Phone, Info, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { useSearchParams } from 'react-router-dom';
import AuthoritySidebar from '../../components/layout/AuthoritySidebar';

const NB = { black: '#FFFBF0', yellow: '#FFE500', red: '#FF3B3B', blue: '#2B6FFF', mint: '#00D084', orange: '#FF7A00', cream: '#0A0A0A', white: '#111111' };

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: NB.cream, border: `2px solid ${NB.black}`,
  fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.88rem', fontWeight: 500, outline: 'none',
  boxShadow: '2px 2px 0 #0A0A0A', color: NB.black, borderRadius: 0,
};

const labelS: React.CSSProperties = {
  fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6B6B6B', display: 'block', marginBottom: 6,
};

export default function AuthorityEfir() {
  const { } = useAuth();
  const [params] = useSearchParams();
  const incidentId = params.get('incidentId');

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('draft');
  const [witnesses, setWitnesses] = useState<any[]>([]);
  const [subject, setSubject] = useState<any>(null);
  const [searchId, setSearchId] = useState('');
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('Theft/Larceny');
  const [location, setLocation] = useState('');
  const [incidentTime, setIncidentTime] = useState('');

  useEffect(() => {
    if (incidentId) { fetchIncident(incidentId); } else { setLoading(false); }
  }, [incidentId]);

  const fetchIncident = async (id: string) => {
    try {
      const res = await api.get(`/incidents/${id}`);
      if (res.data.success) {
        const inc = res.data.data;
        setTitle(`eFIR: ${inc.title}`);
        setDescription(inc.description || '');
        setIncidentType(inc.incident_type || 'General');
        setLocation(`${inc.latitude}, ${inc.longitude}`);
        setIncidentTime(new Date(inc.created_at).toISOString().slice(0, 16));
        if (inc.reporter) setSubject(inc.reporter);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const findSubject = async () => {
    if (!searchId) return;
    try {
      const res = await api.get(`/profiles?search=${searchId}`);
      if (res.data.success && res.data.data.length > 0) { setSubject(res.data.data[0]); }
      else { alert('Subject not found with that ID or email.'); }
    } catch { alert('Error searching for subject.'); }
  };

  const addWitness = () => setWitnesses([...witnesses, { name: '', contact: '', statement: '' }]);
  const updateWitness = (i: number, field: string, value: string) => { const w = [...witnesses]; w[i][field] = value; setWitnesses(w); };
  const removeWitness = (i: number) => setWitnesses(witnesses.filter((_, idx) => idx !== i));

  const handleSubmit = async (_submitStatus: string) => {
    if (!subject) { alert('Please select a subject first.'); return; }
    if (!title || title.length < 5) { alert('Title is required and must be at least 5 characters.'); return; }
    if (!description || description.length < 20) { alert('Description is required and must be at least 20 characters.'); return; }
    try {
      setIsSubmitting(true);
      const payload: Record<string, any> = { user: subject._id, title, description, incident_type: incidentType };
      if (location) payload.incident_location = location;
      if (incidentTime) payload.incident_time = incidentTime;
      if (incidentId) payload.incident = incidentId;
      const validWitnesses = witnesses.filter(w => w.name && w.statement && w.statement.length >= 10);
      if (validWitnesses.length > 0) payload.witness_statements = validWitnesses;
      if (evidenceUrls.length > 0) payload.evidence_urls = evidenceUrls;
      const res = await api.post('/efirs', payload);
      if (res.data.success) { alert(`eFIR saved as draft successfully.`); setStatus('draft'); }
    } catch (err: any) {
      let msg = err.response?.data?.message || err.message || 'Submission failed.';
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg += '\n' + err.response.data.errors.map((e: any) => `${e.field || e.path}: ${e.message}`).join('\n');
      }
      alert(`Submission Error: ${msg}`);
    } finally { setIsSubmitting(false); }
  };

  const steps = ['draft', 'submitted', 'review', 'resolved', 'closed'];

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: NB.cream }}>
      <Loader2 size={36} style={{ animation: 'spin-slow 1s linear infinite' }} />
    </div>
  );

  const canSubmit = !!subject && !!title && !!description;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: NB.cream, fontFamily: "'Space Grotesk', sans-serif" }}>
      <AuthoritySidebar />
      <main className="page-with-sidebar" style={{ flex: 1 }}>
        {/* Header */}
        <div style={{ background: NB.black, borderBottom: `3px solid ${NB.black}`, padding: '16px 28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, background: NB.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={18} color={NB.black} />
            </div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 800, color: NB.white, margin: 0 }}>Electronic FIR Filing</h1>
          </div>
          {/* Progress steps */}
          <div style={{ display: 'flex', gap: 8 }}>
            {steps.map((s) => (
              <div key={s} style={{ flex: 1 }}>
                <div style={{ height: 4, background: s === status ? NB.yellow : 'rgba(255,255,255,0.2)', marginBottom: 4 }} />
                <p style={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: s === status ? NB.yellow : 'rgba(255,255,255,0.4)', margin: 0 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="responsive-grid" style={{ padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Subject */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}` }}>
              <div style={{ padding: '14px 20px', borderBottom: `2px solid ${NB.black}`, background: NB.yellow, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><Users size={16} /> Subject Information</h3>
                {!subject && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={searchId} onChange={e => setSearchId(e.target.value)} placeholder="Blockchain ID or Email" style={{ ...inputStyle, width: 220, padding: '6px 10px', fontSize: '0.8rem' }} />
                    <button onClick={findSubject} style={{ background: NB.black, color: NB.white, border: '2px solid #000', padding: '6px 14px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', textTransform: 'uppercase' }}>Search</button>
                  </div>
                )}
              </div>
              <div style={{ padding: '20px' }}>
                {subject ? (
                  <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><label style={labelS}>Full Name</label><p style={{ fontWeight: 700, color: NB.black, margin: 0 }}>{subject.full_name}</p></div>
                    <div><label style={labelS}>Blockchain Hash ID</label><code style={{ fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace", color: NB.blue, fontWeight: 700 }}>{subject.blockchain_id || 'NOT_ASSIGNED'}</code></div>
                    <div>
                      <label style={labelS}>Contact</label>
                      <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}><Mail size={12} /> {subject.email}</p>
                      <p style={{ margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}><Phone size={12} /> {subject.phone || '—'}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                      <button onClick={() => setSubject(null)} style={{ background: 'none', border: 'none', color: NB.red, fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>Change Subject</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '28px', textAlign: 'center', border: `2px dashed ${NB.black}`, color: '#6B6B6B' }}>
                    <Fingerprint size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>No subject selected. Use search to find a verified user.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Incident details */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}` }}>
              <div style={{ padding: '14px 20px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={16} /><h3 style={{ fontWeight: 800, margin: 0, fontSize: '0.9rem' }}>Incident Details</h3>
              </div>
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={labelS}>FIR Title</label><input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} placeholder="e.g. Theft at North Gate" /></div>
                  <div><label style={labelS}>Incident Category</label>
                    <select value={incidentType} onChange={e => setIncidentType(e.target.value)} style={inputStyle}>
                      <option>Theft/Larceny</option><option>Assault</option><option>Harassment</option><option>Accident</option><option>General Safety</option>
                    </select>
                  </div>
                </div>
                <div><label style={labelS}>Detailed Narrative</label><textarea value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} placeholder="Type narrative here..." /></div>
                <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div><label style={labelS}><MapPin size={10} style={{ display: 'inline' }} /> Location Ref</label><input value={location} onChange={e => setLocation(e.target.value)} style={inputStyle} placeholder="Coordinates or Zone name" /></div>
                  <div><label style={labelS}><Calendar size={10} style={{ display: 'inline' }} /> Incident Time</label><input type="datetime-local" value={incidentTime} onChange={e => setIncidentTime(e.target.value)} style={inputStyle} /></div>
                </div>
              </div>
            </div>

            {/* Witnesses */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}` }}>
              <div style={{ padding: '14px 20px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem' }}><Info size={16} /> Witness Evidence</h3>
                <button onClick={addWitness} style={{ background: NB.mint, border: `2px solid ${NB.black}`, padding: '5px 12px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.68rem', cursor: 'pointer', textTransform: 'uppercase', boxShadow: `2px 2px 0 ${NB.black}` }}>+ Add Member</button>
              </div>
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {witnesses.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#6B6B6B', fontWeight: 600, fontSize: '0.85rem', padding: '16px' }}>No witness statements captured yet.</p>
                ) : witnesses.map((w, i) => (
                  <div key={i} style={{ padding: '14px', background: NB.cream, border: `2px solid ${NB.black}`, position: 'relative' }}>
                    <button onClick={() => removeWitness(i)} style={{ position: 'absolute', top: 8, right: 8, background: NB.red, border: 'none', color: NB.white, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                      <Trash2 size={12} />
                    </button>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                      <input value={w.name} onChange={e => updateWitness(i, 'name', e.target.value)} placeholder="Witness Name" style={{ ...inputStyle, padding: '7px 10px' }} />
                      <input value={w.contact} onChange={e => updateWitness(i, 'contact', e.target.value)} placeholder="Contact" style={{ ...inputStyle, padding: '7px 10px' }} />
                    </div>
                    <textarea value={w.statement} onChange={e => updateWitness(i, 'statement', e.target.value)} placeholder="Brief statement..." style={{ ...inputStyle, resize: 'none', minHeight: 60 }} rows={2} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Submission control */}
            <div style={{ background: NB.black, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}`, padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', margin: '0 0 4px' }}>Submission Control</h3>
              <button onClick={() => canSubmit ? handleSubmit('submitted') : alert(!subject ? 'Select a subject.' : !title ? 'Enter a title.' : 'Enter a description.')} style={{ background: canSubmit ? NB.yellow : 'rgba(255,229,0,0.2)', border: `3px solid ${canSubmit ? NB.yellow : 'rgba(255,255,255,0.1)'}`, padding: '14px', fontFamily: 'inherit', fontWeight: 800, fontSize: '0.88rem', cursor: canSubmit ? 'pointer' : 'not-allowed', textTransform: 'uppercase', letterSpacing: '0.06em', color: NB.black, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {isSubmitting ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />} Submit & Anchor FIR
              </button>
              <button onClick={() => canSubmit ? handleSubmit('draft') : alert('Fill required fields first.')} style={{ background: 'rgba(255,255,255,0.1)', border: `2px solid rgba(255,255,255,0.2)`, padding: '10px', fontFamily: 'inherit', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Save size={14} /> Save Work Draft
              </button>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <Fingerprint size={14} color={NB.mint} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.4)' }}>Digital Integrity Log</span>
                </div>
                <div style={{ background: NB.cream, border: `2px solid rgba(255,229,0,0.3)`, padding: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', color: NB.blue, wordBreak: 'break-all', lineHeight: 1.7 }}>
                  [LEDGER_PENDING]: SHA-256 anchoring on submission. Status: UNTRUSTED_DRAFT.
                </div>
              </div>
            </div>

            {/* Evidence vault */}
            <div style={{ background: NB.white, border: `3px solid ${NB.black}`, boxShadow: `4px 4px 0 ${NB.black}` }}>
              <div style={{ padding: '12px 16px', borderBottom: `2px solid ${NB.black}`, background: NB.cream, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Upload size={14} /><h4 style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Evidence Vault</h4>
              </div>
              <div style={{ padding: '16px' }}>
                <label style={{ display: 'block', border: `2px dashed ${NB.black}`, padding: '24px', textAlign: 'center', cursor: 'pointer' }}>
                  <input type="file" style={{ display: 'none' }} multiple accept="image/*,video/*,application/pdf" onChange={e => { const files = Array.from(e.target.files || []); setEvidenceUrls(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]); }} />
                  <Eye size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6B6B6B', margin: 0 }}>Upload Scene Photos</p>
                </label>
                {evidenceUrls.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {evidenceUrls.map((_, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: NB.cream, border: `1.5px solid ${NB.black}`, padding: '6px 10px' }}>
                        <span style={{ fontSize: '0.72rem', fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>Evidence_File_{i + 1}.img</span>
                        <button onClick={() => setEvidenceUrls(p => p.filter((_, idx) => idx !== i))} style={{ background: NB.red, border: 'none', color: NB.white, width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
