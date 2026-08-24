import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { playTapSound } from '../utils/sound';
import { ADMIN_EMAILS } from '../data/restaurantInfo';
import { adminSessionService } from '../services/adminSessionService';
import { authService, isAuthorizedAdminEmail } from '../services/authService';
import { AdminSession } from '../types';

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

  // Google Sign-in with Admin auto-check
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    playTapSound();

    try {
      const user = await authService.signInWithGoogle();
      if (!user) {
        setIsLoading(false);
        return;
      }

      if (!user.isAdmin || !isAuthorizedAdminEmail(user.email)) {
        setIsLoading(false);
        setError(`Access Denied: '${user.email || 'Your account'}' is not an authorized administrator. Only verified owner emails can access.`);
        return;
      }

      await adminSessionService.startSession(user.email);
      setIsLoading(false);
      onSuccess(user.email);
    } catch (e: any) {
      setIsLoading(false);
      setError(e.message || 'Google sign-in failed. Please try again.');
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-[#E6E5E4] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-[#516B84] font-['Outfit'] mb-0.5">
          Owner Admin Verification
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Sign in with an authorized Google administrator account
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

        {/* Google Sign In Button */}
        <button
          id="admin-google-auth-popup-btn"
          type="button"
          disabled={isLoading}
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-3 rounded-xl bg-white border border-slate-300 hover:border-[#516B84] hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-98 disabled:opacity-75 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#516B84]" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <span>Sign in with Google</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400 mt-3 font-mono">
          Authorized: {ADMIN_EMAILS.join(', ')}
        </p>

        {/* Security Footer Note */}
        <div className="mt-3.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 leading-snug">
          🔒 Real-time single device lock active · Instant sync across all phones
        </div>
      </div>
    </div>
  );
};


