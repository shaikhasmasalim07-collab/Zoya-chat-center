import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Mail,
  User,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  UtensilsCrossed,
} from 'lucide-react';
import { authService } from '../services/authService';
import { UserProfile } from '../types';
import { playTapSound } from '../utils/sound';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  title?: string;
  subtitle?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Sign In to Post a Review',
  subtitle = 'Authentic taste reviews require verified customer login',
}) => {
  const [activeTab, setActiveTab] = useState<'google' | 'direct_gmail' | 'email_pass'>('google');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    playTapSound();

    try {
      const user = await authService.signInWithGoogle();
      setGoogleLoading(false);
      onSuccess(user);
    } catch (err: any) {
      setGoogleLoading(false);
      setError(err.message || 'Google popup sign-in asafal raha.');
    }
  };

  const handleDirectGmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    playTapSound();

    try {
      const user = await authService.loginWithDirectGmail(name, email);
      setLoading(false);
      onSuccess(user);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Login mein samasya aayi.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    playTapSound();

    try {
      let user: UserProfile;
      if (authMode === 'signup') {
        user = await authService.signUpWithEmail(name, email, password);
      } else {
        user = await authService.signInWithEmail(email, password);
      }
      setLoading(false);
      onSuccess(user);
    } catch (err: any) {
      setLoading(false);
      setError(err.message || 'Authentication error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25 }}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-[#d8d6d3] overflow-hidden flex flex-col"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 bg-slate-50/90 border-b border-[#d8d6d3] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#516B84] text-white flex items-center justify-center shadow-2xs">
              <UtensilsCrossed className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#1E293B] font-['Outfit']">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 line-clamp-1">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              playTapSound();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 space-y-4">
          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <span>{error}</span>
                {error.includes('Authorized Domains') && (
                  <p className="mt-1.5 text-[11px] text-rose-900 bg-rose-100/70 p-2 rounded-lg font-mono select-all">
                    Firebase Console &gt; Auth &gt; Settings &gt; Authorized domains mein add karein: <strong>{window.location.hostname}</strong>
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Top 1-Tap Quick Accounts Selection */}
          <div className="p-2.5 bg-slate-50 border border-slate-200/90 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              1-Tap Quick Verified Login:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={async () => {
                  playTapSound();
                  setLoading(true);
                  setError(null);
                  try {
                    const u = await authService.loginWithDirectGmail('Saleem Shaikh', 'saleemshaikh3010@gmail.com');
                    setLoading(false);
                    onSuccess(u);
                  } catch (e: any) {
                    setLoading(false);
                    setError(e.message);
                  }
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-98"
              >
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                  SS
                </div>
                <div className="min-w-0">
                  <span className="block font-bold text-slate-800 text-[11px] leading-tight">Saleem Shaikh</span>
                  <span className="block text-[10px] text-slate-500 truncate leading-tight font-mono">saleemshaikh3010@gmail.com</span>
                </div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  playTapSound();
                  setLoading(true);
                  setError(null);
                  try {
                    const u = await authService.loginWithDirectGmail('Shabib Shaikh', 'shaikhshabib71@gmail.com');
                    setLoading(false);
                    onSuccess(u);
                  } catch (e: any) {
                    setLoading(false);
                    setError(e.message);
                  }
                }}
                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-left transition-all text-xs font-semibold shadow-2xs cursor-pointer active:scale-98"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0">
                  SS
                </div>
                <div className="min-w-0">
                  <span className="block font-bold text-slate-800 text-[11px] leading-tight">Shabib Shaikh</span>
                  <span className="block text-[10px] text-slate-500 truncate leading-tight font-mono">shaikhshabib71@gmail.com</span>
                </div>
              </button>
            </div>
          </div>

          {/* Top Auth Mode Tabs */}
          <div className="grid grid-cols-3 bg-slate-100 p-1 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setActiveTab('google');
                setError(null);
              }}
              className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all truncate ${
                activeTab === 'google'
                  ? 'bg-white text-[#516B84] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Google Popup
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setActiveTab('direct_gmail');
                setError(null);
              }}
              className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all truncate ${
                activeTab === 'direct_gmail'
                  ? 'bg-white text-[#516B84] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Direct Gmail
            </button>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setActiveTab('email_pass');
                setError(null);
              }}
              className={`py-1.5 px-2 rounded-lg text-[11px] sm:text-xs font-bold transition-all truncate ${
                activeTab === 'email_pass'
                  ? 'bg-white text-[#516B84] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Email & Pass
            </button>
          </div>

          {/* TAB 1: Google OAuth Popup */}
          {activeTab === 'google' && (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-600 text-center">
                Firebase Google OAuth popup ke dwara official Google account se authenticate karein:
              </p>
              <motion.button
                id="google-signin-btn"
                type="button"
                disabled={googleLoading || loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 text-slate-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-3 shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {googleLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Connecting Google OAuth...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>Sign in with Google Account</span>
                  </>
                )}
              </motion.button>
              <p className="text-[11px] text-slate-400 text-center">
                Agar popup block ho ya domain authorize na ho, to upar <strong>"Direct Gmail"</strong> tab use karein.
              </p>
            </div>
          )}

          {/* TAB 2: Direct Real Gmail Authentication */}
          {activeTab === 'direct_gmail' && (
            <form onSubmit={handleDirectGmailLogin} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aapka Real Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Asma Salim"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Aapka Gmail / Email ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. shaikhasmasalim07@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Instant Gmail Login & Continue</span>
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* TAB 3: Email & Password */}
          {activeTab === 'email_pass' && (
            <div className="space-y-3 pt-1">
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-1 rounded-md transition-all ${
                    authMode === 'signin' ? 'bg-white text-[#516B84] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-1 rounded-md transition-all ${
                    authMode === 'signup' ? 'bg-white text-[#516B84] shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Sign Up (New Account)
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                {authMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Aapka Naam
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Asma Salim"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#516B84] hover:bg-[#3E5367] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-soft transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span>Kripya intazar karein...</span>
                  ) : (
                    <>
                      <span>{authMode === 'signup' ? 'Create Account & Continue' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>
            </div>
          )}

          {/* Privacy Note */}
          <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 100% verified customer dining reviews</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
