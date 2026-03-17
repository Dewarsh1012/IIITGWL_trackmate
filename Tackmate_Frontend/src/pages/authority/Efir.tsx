import { useState, useEffect } from 'react';
import { 
  Trash2, Upload, Eye, 
  Send, Save, MapPin, 
  Calendar, FileText, Loader2, Fingerprint,
  Users, Mail, Phone, Info,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { Link, useSearchParams } from 'react-router-dom';

export default function AuthorityEfir() {
  const { user: authUser } = useAuth();
  const [params] = useSearchParams();
  const incidentId = params.get('incidentId');
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('draft');
  const [witnesses, setWitnesses] = useState<any[]>([]);
  const [subject, setSubject] = useState<any>(null);
  const [incident, setIncident] = useState<any>(null);
  const [searchId, setSearchId] = useState('');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [incidentType, setIncidentType] = useState('Theft/Larceny');
  const [location, setLocation] = useState('');
  const [incidentTime, setIncidentTime] = useState('');

  useEffect(() => {
    if (incidentId) {
      fetchIncident(incidentId);
    } else {
      setLoading(false);
    }
  }, [incidentId]);

  const fetchIncident = async (id: string) => {
    try {
      const res = await api.get(`/incidents/${id}`);
      if (res.data.success) {
        const inc = res.data.data;
        setIncident(inc);
        setTitle(`eFIR: ${inc.title}`);
        setDescription(inc.description || '');
        setIncidentType(inc.incident_type || 'General');
        setLocation(`${inc.latitude}, ${inc.longitude}`);
        setIncidentTime(new Date(inc.created_at).toISOString().slice(0, 16));
        if (inc.reporter) setSubject(inc.reporter);
      }
    } catch (err) {
      console.error('Failed to fetch incident:', err);
    } finally {
      setLoading(false);
    }
  };

  const findSubject = async () => {
    if (!searchId) return;
    try {
      const res = await api.get(`/profiles?search=${searchId}`);
      if (res.data.success && res.data.data.length > 0) {
        setSubject(res.data.data[0]);
      }
    } catch (err) {
      console.error('Failed to find subject:', err);
    }
  };

  const addWitness = () => {
    setWitnesses([...witnesses, { name: '', contact: '', statement: '' }]);
  };

  const updateWitness = (index: number, field: string, value: string) => {
    const newWitnesses = [...witnesses];
    newWitnesses[index][field] = value;
    setWitnesses(newWitnesses);
  };

  const removeWitness = (index: number) => {
    setWitnesses(witnesses.filter((_, i) => i !== index));
  };

  const handleSubmit = async (submitStatus: string) => {
    if (!subject || !title || !description) {
      alert('Subject, Title, and Description are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        user: subject._id,
        title,
        description,
        incident_type: incidentType,
        incident_location: location,
        incident_time: incidentTime,
        incident: incidentId || undefined,
        witness_statements: witnesses.filter(w => w.name && w.statement),
        status: submitStatus
      };

      const res = await api.post('/efirs', payload);
      if (res.data.success) {
        alert(`eFIR ${submitStatus === 'submitted' ? 'filed and anchored to blockchain' : 'saved as draft'}.`);
        setStatus(submitStatus);
        if (submitStatus === 'submitted') {
          // Reset or navigate
        }
      }
    } catch (err) {
      console.error('Failed to submit eFIR:', err);
      alert('Submission failed. Check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 'draft', label: 'Draft' },
    { id: 'submitted', label: 'Submitted' },
    { id: 'review', label: 'Under Review' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'closed', label: 'Closed' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-background-light dark:bg-[#0F172A] font-['Inter',_sans-serif] text-slate-900 dark:text-slate-100 min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/authority/dashboard" className="flex items-center gap-3 text-primary no-underline text-2xl font-bold italic">
              SafeTravel
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/authority/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm font-medium no-underline">Dashboard</Link>
              <Link to="/authority/efir" className="text-primary text-sm font-bold border-b-2 border-primary py-5 no-underline">E-FIR System</Link>
              <Link to="/authority/analytics" className="text-slate-600 dark:text-slate-400 hover:text-primary text-sm font-medium no-underline">Analytics</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold border border-white/5">
              {authUser?.full_name?.split(' ').map((n: string) => n[0]).join('')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="grid grid-cols-5 gap-4 mb-10">
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col gap-2">
              <div className={`h-1.5 w-full rounded-full ${status === step.id ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${status === step.id ? 'text-primary' : 'text-slate-500'}`}>{step.label}</p>
            </div>
          ))}
        </div>

        <h1 className="text-2xl font-bold mb-8 text-slate-900 dark:text-white flex items-center gap-3">
          <FileText className="size-8 text-primary" />
          Electronic FIR Filing
        </h1>
        
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
                <h3 className="font-bold flex items-center gap-2 m-0"><Users className="size-5 text-primary" /> Subject Information</h3>
                {!subject && (
                  <div className="flex gap-2">
                    <input 
                      value={searchId} 
                      onChange={e => setSearchId(e.target.value)}
                      className="text-xs bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-1.5 rounded outline-none" 
                      placeholder="Blockchain ID or Email"
                    />
                    <button onClick={findSubject} className="bg-primary text-white text-[10px] px-3 py-1.5 rounded font-bold uppercase">Search</button>
                  </div>
                )}
              </div>
              <div className="p-6">
                {subject ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                      <p className="font-bold text-slate-900 dark:text-white m-0">{subject.full_name}</p>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Blockchain Hash ID</label>
                      <code className="text-primary font-mono text-xs">{subject.blockchain_id || 'NOT_ASSIGNED'}</code>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Contact Details</label>
                      <p className="text-sm m-0 flex items-center gap-2"><Mail className="size-3" /> {subject.email}</p>
                      <p className="text-sm m-0 flex items-center gap-2 mt-1"><Phone className="size-3" /> {subject.phone || 'No phone'}</p>
                    </div>
                    <div className="flex items-end">
                      <button onClick={() => setSubject(null)} className="text-[10px] text-red-500 font-bold uppercase hover:underline">Change Subject</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <Fingerprint className="size-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm font-medium">No subject selected. Use search to find verified user.</p>
                  </div>
                )}
              </div>
            </section>
            
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-slate-50 dark:bg-slate-900/40 font-bold">
                <AlertTriangle className="size-5 text-primary" /> Incident Details
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">FIR Record Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none focus:ring-1 focus:ring-primary" placeholder="e.g. Theft at North Gate" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500">Incident Category</label>
                    <select value={incidentType} onChange={e => setIncidentType(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 outline-none">
                      <option>Theft/Larceny</option>
                      <option>Assault</option>
                      <option>Harassment</option>
                      <option>Accident</option>
                      <option>General Safety</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500">Detailed Narrative</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-1 focus:ring-primary min-h-[120px]" placeholder="Type technical narrative here..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><MapPin className="size-3" /> Location Ref</label>
                    <input value={location} onChange={e => setLocation(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2" placeholder="Coordinates or Zone name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar className="size-3" /> Incident Time</label>
                    <input type="datetime-local" value={incidentTime} onChange={e => setIncidentTime(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg px-4 py-2" />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/40">
                <h3 className="font-bold flex items-center gap-2 m-0"><Info className="size-5 text-primary" /> Witness Evidence</h3>
                <button onClick={addWitness} className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Save className="size-3" /> Add Member</button>
              </div>
              <div className="p-6">
                {witnesses.length > 0 ? (
                  <div className="space-y-4">
                    {witnesses.map((w: any, i: number) => (
                      <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-200 dark:border-slate-700 relative group">
                        <button onClick={() => removeWitness(i)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="size-4" /></button>
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <input 
                            placeholder="Witness Name" 
                            value={w.name} 
                            onChange={e => updateWitness(i, 'name', e.target.value)}
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded px-3 py-1 text-sm outline-none" 
                          />
                          <input 
                            placeholder="Contact/Phone" 
                            value={w.contact} 
                            onChange={e => updateWitness(i, 'contact', e.target.value)}
                            className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded px-3 py-1 text-sm outline-none" 
                          />
                        </div>
                        <textarea 
                          placeholder="Brief Statement..." 
                          value={w.statement} 
                          onChange={e => updateWitness(i, 'statement', e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded px-3 py-2 text-sm outline-none resize-none" 
                          rows={2} 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-500 text-xs italic">No witness statements captured yet.</div>
                )}
              </div>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-0">Submission Control</h3>
              
              <button 
                disabled={isSubmitting || !subject}
                onClick={() => handleSubmit('submitted')}
                className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.02]"
              >
                {isSubmitting ? <Loader2 className="animate-spin size-5" /> : <Send className="size-5" />}
                Submit & Anchor FIR
              </button>

              <button 
                disabled={isSubmitting || !subject}
                onClick={() => handleSubmit('draft')}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                <Save className="size-4" /> Save Work Draft
              </button>

              <div className="mt-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 mb-4">
                  <Fingerprint className="size-4 text-green-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Digital Integrity Log</span>
                </div>
                <div className="bg-[#0A0F1E] p-3 rounded-lg border border-slate-800 font-mono text-[9px] text-primary/70 break-all leading-relaxed">
                  [LEDGER_PENDING]: SHA-256 Anchoring will occur on submission. Current status: UNTRUSTED_DRAFT.
                </div>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 flex items-center gap-2">
                <Upload className="size-4 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider m-0">Evidence Vault</h4>
              </div>
              <div className="p-4">
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-400 hover:border-primary transition-all cursor-pointer">
                  <Eye className="size-6 mx-auto mb-2 opacity-30" />
                  <p className="text-[10px] font-bold">Upload Scene Photos</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
      
      <footer className="max-w-[1280px] mx-auto px-6 py-8 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em]">SafeTravel Cryptographic Protocol • Legal System Access Only</p>
      </footer>
    </div>
  );
}
