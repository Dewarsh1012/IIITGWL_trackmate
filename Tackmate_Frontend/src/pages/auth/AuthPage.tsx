import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { loginSchema, touristRegisterSchema, residentRegisterSchema, businessRegisterSchema, authorityRegisterSchema } from './schemas';
import { Loader2, Copy, Check } from 'lucide-react';

export default function AuthPage() {
  const [params] = useSearchParams();
  const initRole = params.get('role') as any || 'tourist';
  
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [role, setRole] = useState(initRole);
  const [blockchainId, setBlockchainId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login, register: authRegister } = useAuth();
  const navigate = useNavigate();

  const handleCopy = () => {
    if (blockchainId) {
      navigator.clipboard.writeText(blockchainId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const onLogin = async (data: any) => {
    try {
      setErrorMsg('');
      const user = await login(data.email, data.password);
      navigate(`/${user.role}/dashboard`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed');
    }
  };

  const onRegister = async (data: any) => {
    try {
      setErrorMsg('');
      const payload: any = { ...data, role };
      if (role === 'tourist') {
        payload.start_date = data.trip_start_date;
        payload.end_date = data.trip_end_date;
        delete payload.trip_start_date;
        delete payload.trip_end_date;
      }
      // Remove confirm_password — backend doesn't expect it
      delete payload.confirm_password;
      const { blockchainId: newBcId } = await authRegister(payload);
      setBlockchainId(newBcId);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Registration failed');
    }
  };

  if (blockchainId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background-light dark:bg-background-dark">
        <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
        
        <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-2xl relative z-10 p-8 text-center text-white">
          <div className="flex justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-5xl">fingerprint</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Digital Identity Issued</h2>
          <p className="text-slate-400 mb-8 text-sm">Your cryptographic blockchain identifier has been generated. Keep this safe, authorities will use it to verify you.</p>
          
          <div className="flex items-center justify-between bg-slate-900 border border-slate-700 p-4 rounded-lg mb-8">
            <span className="font-mono text-lg text-green-400 truncate">{blockchainId}</span>
            <button onClick={handleCopy} className="p-2 text-slate-400 hover:text-white transition-colors">
              {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
            </button>
          </div>

          <button onClick={() => navigate(`/${role}/dashboard`)} className="w-full py-4 bg-gradient-to-r from-primary to-blue-600 rounded-lg font-bold text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2">
            Enter Dashboard <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white">
            <span className="material-symbols-outlined block">shield_person</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">SafeTravel <span className="text-primary text-sm align-top">v3.0</span></h1>
        </Link>
        <Link to="/" className="text-sm font-medium hover:text-primary transition-colors text-slate-400 hidden sm:block">Back to Home</Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-72 h-72 bg-primary/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
        
        <div className="w-full max-w-2xl bg-[#1e293b]/70 backdrop-blur-[12px] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative z-10">
          <div className="flex border-b border-slate-700/50">
            <button onClick={() => setMode('register')} className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider border-b-2 transition-colors ${mode === 'register' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Register
            </button>
            <button onClick={() => setMode('login')} className={`flex-1 py-4 text-center font-bold text-sm uppercase tracking-wider border-b-2 transition-colors ${mode === 'login' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                Sign In
            </button>
          </div>
          
          <div className="p-8">
            {errorMsg && (
              <div className="mb-6 bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-lg text-sm text-center">
                {errorMsg}
              </div>
            )}

            {mode === 'login' ? (
              <LoginForm onSubmit={onLogin} />
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">person_search</span>
                  Select Your Role
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                  <RoleSelectCard active={role === 'tourist'} icon="map" title="Tourist" subtitle="Visitor" onClick={() => setRole('tourist')} />
                  <RoleSelectCard active={role === 'resident'} icon="home" title="Resident" subtitle="Local" onClick={() => setRole('resident')} />
                  <RoleSelectCard active={role === 'business'} icon="business_center" title="Business" subtitle="Service" onClick={() => setRole('business')} />
                  <RoleSelectCard active={role === 'authority'} icon="policy" title="Authority" subtitle="Gov Agency" onClick={() => setRole('authority')} />
                </div>
                <RegisterForm key={role} role={role} onSubmit={onRegister} />
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function RoleSelectCard({ active, icon, title, subtitle, onClick }: any) {
  return (
    <button onClick={onClick} type="button" className={`group flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${active ? 'border-primary bg-slate-800/40 shadow-[0_0_15px_rgba(26,87,219,0.4)]' : 'border-slate-700 bg-slate-800/20 hover:border-slate-500'}`}>
      <span className={`material-symbols-outlined text-3xl transition-colors ${active ? 'text-primary' : 'text-slate-400 group-hover:text-primary'}`}>{icon}</span>
      <div className="text-center">
        <p className={`text-sm font-bold ${active ? 'text-white' : 'text-slate-300'}`}>{title}</p>
        <p className="text-[10px] text-slate-400">{subtitle}</p>
      </div>
    </button>
  );
}

function LoginForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Email Address</label>
        <input {...register('email')} type="email" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600" placeholder="john@example.com" />
        {errors.email && <span className="text-xs text-red-400">{errors.email.message as string}</span>}
      </div>
      <div className="flex flex-col gap-1.5 mt-4">
        <label className="text-sm font-medium text-slate-300">Password</label>
        <input {...register('password')} type="password" className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600" placeholder="••••••••" />
        {errors.password && <span className="text-xs text-red-400">{errors.password.message as string}</span>}
      </div>
      <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-8 bg-gradient-to-r from-primary to-blue-600 rounded-lg font-bold text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2">
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Authenticate System'}
        {!isSubmitting && <span className="material-symbols-outlined">login</span>}
      </button>
    </form>
  );
}

function RegisterForm({ role, onSubmit }: { role: string, onSubmit: (data: any) => void }) {
  const schema = {
    tourist: touristRegisterSchema,
    resident: residentRegisterSchema,
    business: businessRegisterSchema,
    authority: authorityRegisterSchema
  }[role];

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema as any)
  });

  const InputClass = "w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-slate-600";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Full Name</label>
          <input {...register('full_name')} className={InputClass} placeholder="Legal Name" />
          {errors.full_name && <span className="text-xs text-red-400">{errors.full_name.message as string}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Phone Number</label>
          <input {...register('phone')} className={InputClass} placeholder="+1 234 567 890" />
          {errors.phone && <span className="text-xs text-red-400">{errors.phone.message as string}</span>}
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-slate-300">Email Address</label>
        <input {...register('email')} type="email" className={InputClass} placeholder="john@example.com" />
        {errors.email && <span className="text-xs text-red-400">{errors.email.message as string}</span>}
      </div>

      {role === 'tourist' && (
        <div className="space-y-5 p-5 bg-slate-900/30 rounded-xl border border-slate-700/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300 text-blue-300">ID Type</label>
              <select {...register('id_type')} className={`${InputClass} [color-scheme:dark]`}>
                <option value="aadhaar">Aadhaar</option>
                <option value="passport">Passport</option>
                <option value="voter_id">Voter ID</option>
                <option value="driving_license">Driving License</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300 text-blue-300">ID Number</label>
              <input {...register('id_number')} className={InputClass} placeholder="For blockchain verification" />
              {errors.id_number && <span className="text-xs text-red-400">{errors.id_number.message as string}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-300 text-blue-300">Destination Region</label>
            <input {...register('destination_region')} className={InputClass} placeholder="e.g. Tawang District" />
            {errors.destination_region && <span className="text-xs text-red-400">{errors.destination_region.message as string}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300 text-blue-300">Trip Start Date</label>
              <input {...register('trip_start_date')} type="date" className={`${InputClass} [color-scheme:dark]`} />
              {errors.trip_start_date && <span className="text-xs text-red-400">{errors.trip_start_date.message as string}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300 text-blue-300">Trip End Date</label>
              <input {...register('trip_end_date')} type="date" className={`${InputClass} [color-scheme:dark]`} />
              {errors.trip_end_date && <span className="text-xs text-red-400">{errors.trip_end_date.message as string}</span>}
            </div>
          </div>
        </div>
      )}

      {role === 'resident' && (
        <div className="flex flex-col gap-1.5 p-5 bg-slate-900/30 rounded-xl border border-slate-700/50">
          <label className="text-sm font-medium text-green-400">Ward Assignment (ID)</label>
          <input {...register('ward_id')} className={InputClass} placeholder="Enter your Ward ID" />
          <p className="text-xs text-slate-500 mt-1">Required to link you to neighborhood alerts.</p>
          {errors.ward_id && <span className="text-xs text-red-400">{errors.ward_id.message as string}</span>}
        </div>
      )}

      {role === 'business' && (
        <div className="space-y-5 p-5 bg-slate-900/30 rounded-xl border border-slate-700/50">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-amber-400">Business Name</label>
            <input {...register('business_name')} className={InputClass} placeholder="Official Registered Name" />
            {errors.business_name && <span className="text-xs text-red-400">{errors.business_name.message as string}</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-amber-400">Category</label>
              <select {...register('category')} className={`${InputClass} [color-scheme:dark]`}>
                <option value="accommodation">Accommodation</option>
                <option value="food_beverage">Food & Beverage</option>
                <option value="tour_operator">Tour Operator</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-amber-400">Ward ID</label>
              <input {...register('ward_id')} className={InputClass} placeholder="24-char ID" />
              {errors.ward_id && <span className="text-xs text-red-400">{errors.ward_id.message as string}</span>}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-amber-400">Business Address</label>
            <input {...register('address')} className={InputClass} />
            {errors.address && <span className="text-xs text-red-400">{errors.address.message as string}</span>}
          </div>
        </div>
      )}

      {role === 'authority' && (
        <div className="space-y-5 p-5 bg-slate-900/30 rounded-xl border border-slate-700/50">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-purple-400">Department</label>
              <input {...register('department')} className={InputClass} placeholder="e.g. Police" />
              {errors.department && <span className="text-xs text-red-400">{errors.department.message as string}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-purple-400">Designation</label>
              <input {...register('designation')} className={InputClass} placeholder="e.g. Inspector" />
              {errors.designation && <span className="text-xs text-red-400">{errors.designation.message as string}</span>}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Password</label>
          <input {...register('password')} type="password" className={InputClass} placeholder="••••••••" />
          {errors.password && <span className="text-xs text-red-400">{errors.password.message as string}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Confirm Password</label>
          <input {...register('confirm_password')} type="password" className={InputClass} placeholder="••••••••" />
          {errors.confirm_password && <span className="text-xs text-red-400">{errors.confirm_password.message as string}</span>}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting} className="w-full py-4 mt-6 bg-gradient-to-r from-primary to-blue-600 rounded-lg font-bold text-white shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all flex items-center justify-center gap-2">
        {isSubmitting ? <Loader2 className="animate-spin" /> : 'Create Account'}
        {!isSubmitting && <span className="material-symbols-outlined">arrow_forward</span>}
      </button>
    </form>
  );
}
