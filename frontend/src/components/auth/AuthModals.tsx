import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2, Lock, Mail, User, Building, Phone, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const { signIn, signUp, requestPasswordReset, enterDemoMode } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error: err } = await signIn(email, password);
      if (err) {
        setError(err.message || 'Invalid email or password. Please verify your credentials.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check network connectivity.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await signUp({
        email,
        password,
        fullName,
        farmName: farmName || 'My Livestock Farm',
        phone
      });
      if (err) {
        setError(err.message || 'Registration failed. Please check your details.');
      } else {
        setSuccessMsg('Account created successfully! Welcome to VET-AI.');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const { error: err } = await requestPasswordReset(email);
      if (err) {
        setError(err.message || 'Could not send reset email.');
      } else {
        setSuccessMsg(`Password reset instructions sent to ${email}. Please check your inbox.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Password reset request failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    enterDemoMode();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-[#E5EAF0] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header with close button */}
        <div className="relative px-6 pt-6 pb-4 border-b border-[#E5EAF0] bg-[#F7F9FC]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#16845B] text-white shadow-md shadow-emerald-900/10">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#172033]">
                {mode === 'login' && 'Farmer Sign In'}
                {mode === 'signup' && 'Register Farmer Account'}
                {mode === 'forgot' && 'Reset Password'}
              </h2>
              <p className="text-xs text-[#667085]">
                {mode === 'login' && 'Access herd telemetry and clinical intelligence'}
                {mode === 'signup' && 'Join VET-AI for real-time livestock health monitoring'}
                {mode === 'forgot' && 'Enter your email to receive recovery instructions'}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        <div className="px-6 pt-4">
          {error && (
            <div className="p-3 mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 mb-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 pt-2">
          {/* LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@greenvalley.farm"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] focus:ring-2 focus:ring-emerald-500/10 text-[#172033]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#172033]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); }}
                    className="text-xs text-[#16845B] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] focus:ring-2 focus:ring-emerald-500/10 text-[#172033]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#16845B] hover:bg-[#126b49] text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Authenticating...' : 'Sign In as Farmer'}
              </button>

              <div className="pt-2 text-center border-t border-[#E5EAF0]">
                <p className="text-xs text-[#667085]">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError(null); }}
                    className="font-semibold text-[#16845B] hover:underline"
                  >
                    Register new farm
                  </button>
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDemoAccess}
                  className="w-full py-2 px-3 text-xs font-medium text-slate-700 bg-[#F1F5F9] hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-colors"
                >
                  🌾 Explore in Demo Mode (No Login Required)
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Farmer Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Miller"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Farm Name
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="Green Valley Dairy"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Contact Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 019"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@greenvalleydairy.com"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Password (min. 6)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172033] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#16845B] hover:bg-[#126b49] text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Creating Farmer Account...' : 'Register Farm & Sign In'}
              </button>

              <div className="pt-2 text-center border-t border-[#E5EAF0]">
                <p className="text-xs text-[#667085]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError(null); }}
                    className="font-semibold text-[#16845B] hover:underline"
                  >
                    Sign in here
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="farmer@greenvalley.farm"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#16845B] hover:bg-[#126b49] text-white font-medium text-sm rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? 'Sending Instructions...' : 'Send Password Reset Email'}
              </button>

              <div className="pt-2 text-center border-t border-[#E5EAF0]">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                  className="text-xs font-semibold text-[#16845B] hover:underline"
                >
                  ← Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
