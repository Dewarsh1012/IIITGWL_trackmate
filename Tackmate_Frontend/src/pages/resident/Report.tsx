import { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import { useLocation } from '../../hooks/use-location';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
    { id: 'crime', label: 'Crime', icon: 'lock' },
    { id: 'accident', label: 'Accident', icon: 'directions_car' },
    { id: 'medical', label: 'Medical', icon: 'medical_services' },
    { id: 'infrastructure', label: 'Infrastructure', icon: 'handyman' },
    { id: 'missing_person', label: 'Missing Person', icon: 'person_search' },
    { id: 'suspicious', label: 'Suspicious Activity', icon: 'visibility' },
    { id: 'crowd', label: 'Crowd', icon: 'groups' },
    { id: 'disaster', label: 'Natural Disaster', icon: 'cyclone' },
    { id: 'fire', label: 'Fire', icon: 'local_fire_department' },
  ];

  return (
    <div className="flex flex-1 justify-center p-4 font-['Inter',_sans-serif] bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <div className="flex flex-col max-w-[800px] w-full flex-1">
        <div className="mb-8 mt-4">
          <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-slate-900 dark:text-white text-3xl font-black leading-tight tracking-tight m-0">Report an Incident</h1>
              <p className="text-slate-500 dark:text-slate-400 text-base font-normal m-0 mt-1">Please provide the initial details of the occurrence.</p>
            </div>
            <div className="text-right">
              <span className="text-primary font-bold text-sm bg-primary/10 px-3 py-1 rounded-full border border-primary/20">Step {step} of 3</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-6 justify-between items-center">
              <div className="flex gap-8">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'opacity-100' : 'opacity-50'}`}>
                  <span className={`flex items-center justify-center size-6 rounded-full text-xs font-bold ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>1</span>
                  <p className={`text-sm font-bold leading-normal m-0 ${step >= 1 ? 'text-primary' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>Incident Details</p>
                </div>
                <div className={`flex items-center gap-2 ${step >= 2 ? 'opacity-100' : 'opacity-50'}`}>
                  <span className={`flex items-center justify-center size-6 rounded-full text-xs font-bold ${step >= 2 ? 'bg-primary text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>2</span>
                  <p className={`text-sm font-bold leading-normal m-0 ${step >= 2 ? 'text-primary' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>Location</p>
                </div>
                <div className={`flex items-center gap-2 ${step >= 3 ? 'opacity-100' : 'opacity-50'}`}>
                  <span className={`flex items-center justify-center size-6 rounded-full text-xs font-bold ${step >= 3 ? 'bg-primary text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>3</span>
                  <p className={`text-sm font-bold leading-normal m-0 ${step >= 3 ? 'text-primary' : 'text-slate-600 dark:text-slate-300 font-medium'}`}>Evidence</p>
                </div>
              </div>
              <p className="text-slate-900 dark:text-white text-sm font-bold m-0">{Math.round((step / 3) * 100)}% Complete</p>
            </div>
            <div className="rounded-full bg-slate-200 dark:bg-slate-800 h-2 w-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-8">
          <div className="p-6 md:p-8">
            {step === 1 && (
              <>
                <h2 className="text-slate-900 dark:text-white text-xl font-bold mb-6 m-0">What are you reporting?</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
                  {types.map((type) => {
                    const selected = incidentType === type.id;
                    return (
                      <button 
                        key={type.id} 
                        type="button"
                        onClick={() => setValue('incident_type', type.id)}
                        className={`flex flex-col items-start gap-3 rounded-xl p-4 text-left transition-all border outline-none group
                          ${selected ? 'border-2 border-primary bg-primary/5 hover:shadow-md' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-primary/50 hover:bg-slate-100 dark:hover:bg-slate-800'}
                        `}
                      >
                        <div className={`p-2 rounded-lg shadow-sm transition-transform ${selected ? 'text-primary bg-white dark:bg-slate-800 group-hover:scale-110' : 'text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 group-hover:text-primary'}`}>
                          <span className="material-symbols-outlined text-[28px] m-0 leading-none">{type.icon}</span>
                        </div>
                        <h3 className={`text-sm font-bold m-0 ${selected ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{type.label}</h3>
                      </button>
                    )
                  })}
                </div>
                <div className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-slate-900 dark:text-white text-sm font-bold m-0" htmlFor="incident-title">Incident Title</label>
                    <input {...register('title', { required: true })} className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" id="incident-title" placeholder="Brief summary of the incident" type="text" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <label className="text-slate-900 dark:text-white text-sm font-bold m-0" htmlFor="description">Detailed Description</label>
                      <span className="text-amber-600 dark:text-amber-400 text-xs font-semibold bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">Min 20 chars</span>
                    </div>
                    <textarea {...register('description', { required: true })} className="w-full rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-900/5 text-slate-900 dark:text-white px-4 py-3 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" id="description" placeholder="Please provide as much detail as possible about what happened..." rows={5}></textarea>
                    <p className="text-slate-500 dark:text-slate-400 text-xs italic m-0">A detailed description helps our safety teams investigate faster.</p>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="py-8 text-center space-y-4">
                 <span className="material-symbols-outlined text-6xl text-primary">my_location</span>
                 <h2 className="text-xl font-bold">Auto-Capturing GPS Location</h2>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">We are tagging the incident with your current device location coordinates to ensure rapid response.</p>
                 <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-300 dark:border-slate-700 inline-block font-mono text-primary mt-6">
                   {lat ? `LAT: ${lat.toFixed(6)}, LNG: ${lng.toFixed(6)}` : 'Scanning Satellites...'}
                 </div>
              </div>
            )}

            {step === 3 && (
              <div className="py-8 text-center space-y-4">
                 <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-8 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                   <span className="material-symbols-outlined text-4xl text-slate-400 mb-4">cloud_upload</span>
                   <h3 className="text-lg font-bold mb-2">Upload Evidence</h3>
                   <p className="text-sm text-slate-500 mb-6">Attach photos, videos, or audio related to the incident. (Optional)</p>
                   <span className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-lg font-semibold text-sm">Browse Files</span>
                 </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 px-6 py-5 flex justify-between items-center">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors outline-none border-none">
                Back
              </button>
            ) : (
              <button type="button" onClick={() => navigate('/resident/dashboard')} className="px-6 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors outline-none border-none">
                Cancel
              </button>
            )}
            
            {step < 3 ? (
              <button type="button" onClick={() => setStep(step + 1)} className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95 outline-none border-none">
                Next <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            ) : (
               <button type="submit" disabled={isSubmitting} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-95 outline-none border-none">
                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Submit to Grid'}
                {!isSubmitting && <span className="material-symbols-outlined">done_all</span>}
              </button>
            )}
          </div>
        </form>

        <div className="flex justify-center items-center gap-2 text-slate-400 dark:text-slate-500 mb-10">
          <span className="material-symbols-outlined text-sm leading-none m-0">shield</span>
          <p className="text-xs uppercase tracking-widest font-bold m-0 mt-0.5">Encrypted & Secure Reporting</p>
        </div>
      </div>
    </div>
  );
}
