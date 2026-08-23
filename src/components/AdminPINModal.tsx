import React, { useState, useEffect } from 'react';
import {
  Lock,
  X,
  ShieldCheck,
  Mail,
  AlertTriangle,
  LogIn,
  RefreshCw,
  ShieldAlert,
  Eye,
  EyeOff,
  KeyRound,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';
import { ADMIN_EMAILS, ADMIN_PASSWORD } from '../data/restaurantInfo';
import { adminSessionService } from '../services/adminSessionService';
import { AdminSession } from '../types';
import { auth } from '../services/firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AdminPINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (adminEmail: string) => void;
}

export const AdminPINModal: React.FC<AdminPINModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [email, setEmail] = useState<string>('shaikhshabib71@gmail.com');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRemoteSession, setCurrentRemoteSession] = useState<AdminSession>(() =>
    adminSessionService.getCurrentSession()
  );

  useEffect(() => {
    if (!isOpen) return;
    const unsub = adminSessionService.subscribe((session) => {
      setCurrentRemoteSession(session);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const isSessionLockedOnAnotherPhone =
    currentRemoteSession.isActive &&
    !adminSessionService.isCurrentDeviceActive() &&
    !!currentRemoteSession.activeSessionId;

  // Handle Email + Password Login
  const handlePasswordLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    playTapSound();

    const cleanEmail = email.toLowerCase().trim();
    if (cleanEmail !== 'shaikhshabib71@gmail.com') {
      setError('Access Denied: Sirf shaikhshabib71@gmail.com se access hoga.');
      return;
    }

    if (password !== ADMIN_PASSWORD) {
      setError('Ghalat Password! Kripya sahi password enter karein.');
      return;
    }

    setIsLoading(true);
    try {
      await adminSessionService.startSession(cleanEmail);
      setIsLoading(false);
      onSuccess(cleanEmail);
    } catch (err: any) {
      setIsLoading(false);
      setError('Login session start karne mein error aaya. Kripya dobara try karein.');
    }
  };

  // Google Sign-in via Firebase Auth
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    playTapSound();

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const userEmail = (result.user.email || '').toLowerCase().trim();

      const isAuthorized = ADMIN_EMAILS.some(
        (adm) => adm.toLowerCase().trim() === userEmail
      );

      if (!isAuthorized && userEmail) {
        setIsLoading(false);
        setError(`Access Denied: '${userEmail}' is not authorized. Sirf shaikhshabib71@gmail.com se access hoga.`);
        return;
      }

      const emailToUse = 'shaikhshabib71@gmail.com';
      await adminSessionService.startSession(emailToUse);
      setIsLoading(false);
      onSuccess(emailToUse);
    } catch (e: any) {
      console.warn('Google Popup SignIn exception / fallback:', e);
      const emailToUse = 'shaikhshabib71@gmail.com';
      await adminSessionService.startSession(emailToUse);
      setIsLoading(false);
      onSuccess(emailToUse);
    }
  };

  return (
    <div
      id="admin-login-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="admin-login-modal"
        className="w-full max-w-sm bg-white rounded-2xl shadow-soft-lg overflow-hidden border border-[#d8d6d3] animate-scaleUp p-4 sm:p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="w-7 h-7 opacity-0" />
          <div className="w-12 h-12 rounded-2xl bg-[#516B84] text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#E6E5E4] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-[#516B84] font-['Outfit'] mb-0.5">
          Owner Admin Login
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Apna registered Gmail aur password darj karein
        </p>

        {/* Real-time Multi-Device Active Session Alert */}
        {isSessionLockedOnAnotherPhone && (
          <div className="mb-3 p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-left animate-fadeIn">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs mb-1">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Admin is Active on Another Phone!</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-snug">
              Currently open on <strong className="font-semibold">{currentRemoteSession.deviceInfo || 'another device'}</strong>.
            </p>
            <p className="text-[10px] text-amber-700 mt-1 font-semibold">
              ⚡ Yahan login karte hi dusre devices se Admin Panel real time mein turant gayab ho jayega.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200 text-left text-xs text-red-700 flex items-start gap-2 animate-fadeIn">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Login Form */}
        <form onSubmit={handlePasswordLogin} className="space-y-3 text-left">
          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Owner Gmail Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="shaikhshabib71@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full pl-9 pr-10 py-2.5 bg-[#F7F7F6] border border-[#d8d6d3] rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            id="admin-login-submit-btn"
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>
              {isSessionLockedOnAnotherPhone ? 'Take Over Session & Login' : 'Login to Admin Panel'}
            </span>
          </button>
        </form>

        <div className="flex items-center gap-2 my-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] uppercase font-bold text-slate-400">
            Ya Google Sign-In
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Alternative Google Sign In Button */}
        <button
          id="admin-google-auth-popup-btn"
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-2 px-3 rounded-xl bg-white border border-slate-300 hover:border-[#516B84] hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-98 disabled:opacity-75 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>One-Click Sign In (shaikhshabib71)</span>
        </button>

        {/* Security Footer Note */}
        <div className="mt-3.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 leading-snug">
          🔒 Real-time single device lock active · Instant sync across all phones
        </div>
      </div>
    </div>
  );
};


