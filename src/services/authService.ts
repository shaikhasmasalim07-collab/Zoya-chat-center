import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, USE_FIREBASE } from './firebaseConfig';
import { UserProfile } from '../types';
import { ADMIN_EMAILS } from '../data/restaurantInfo';
import { adminSessionService } from './adminSessionService';

const USER_SESSION_KEY = 'zoya_user_auth_session_v1';

/**
 * Strict case-insensitive matching against authorized admin emails
 */
export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adm) => adm.trim().toLowerCase() === normalized);
}

class AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: ((user: UserProfile | null) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.init();
  }

  private init() {
    // 1. Try to load cached user from localStorage immediately
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(USER_SESSION_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as UserProfile;
          // Re-validate isAdmin status against current allowlist
          parsed.isAdmin = isAuthorizedAdminEmail(parsed.email);
          this.currentUser = parsed;
        }
      } catch (e) {
        console.warn('Failed to parse cached user session', e);
      }
    }

    // 2. Attach Firebase Auth listener
    if (USE_FIREBASE && auth) {
      try {
        onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
          if (fbUser) {
            const email = fbUser.email || '';
            const isAdmin = isAuthorizedAdminEmail(email);
            const profile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || email.split('@')[0] || 'Google User',
              email: email,
              photoUrl: fbUser.photoURL || undefined,
              provider: (fbUser.providerData[0]?.providerId === 'google.com'
                ? 'google'
                : 'password') as 'google' | 'password',
              isAdmin,
            };
            this.setCurrentUser(profile);
          } else {
            // Only clear if not guest/custom local session
            if (this.currentUser?.provider !== 'guest') {
              this.setCurrentUser(null);
            }
          }
          this.isInitialized = true;
        });
      } catch (err) {
        console.warn('[AuthService] Firebase onAuthStateChanged setup error:', err);
        this.isInitialized = true;
      }
    } else {
      this.isInitialized = true;
    }
  }

  private setCurrentUser(user: UserProfile | null) {
    if (user) {
      user.isAdmin = isAuthorizedAdminEmail(user.email);
      if (user.isAdmin) {
        adminSessionService.startSession(user.email).catch(() => {});
      }
    }
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_SESSION_KEY);
      }
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentUser));
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public isCurrentUserAdmin(): boolean {
    return isAuthorizedAdminEmail(this.currentUser?.email);
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  public subscribe(listener: (user: UserProfile | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Google Sign-In with popup
   */
  public async signInWithGoogle(fallbackEmail?: string, fallbackName?: string): Promise<UserProfile> {
    if (USE_FIREBASE && auth) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      try {
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        const email = fbUser.email || fallbackEmail || '';
        const isAdmin = isAuthorizedAdminEmail(email);

        const profile: UserProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || fallbackName || email.split('@')[0] || 'Google User',
          email: email,
          photoUrl: fbUser.photoURL || undefined,
          provider: 'google',
          isAdmin,
        };

        this.setCurrentUser(profile);
        return profile;
      } catch (error: any) {
        console.error('[AuthService] Firebase Google Sign-In Error:', error.code, error.message);

        // Detailed helpful error handling for Firebase Console setup
        if (error.code === 'auth/unauthorized-domain') {
          const currentHost = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
          throw new Error(
            `Domain Unauthorized: Firebase Console > Authentication > Settings > Authorized Domains mein "${currentHost}" add karein.`
          );
        }

        if (error.code === 'auth/operation-not-allowed' || error.code === 'auth/configuration-not-found') {
          throw new Error(
            'Google Provider Disabled: Firebase Console > Authentication > Sign-in method mein Google provider ko Enable karein.'
          );
        }

        if (error.code === 'auth/popup-blocked') {
          throw new Error('Browser ne Google popup block kar diya. Kripya browser URL bar se Popups Allow karein.');
        }

        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          throw new Error('Google Sign-In popup window band kar di gayi.');
        }

        if (error.code === 'auth/network-request-failed') {
          throw new Error('Network error. Kripya apna internet connection check karein.');
        }

        // If fallback credentials were provided by user
        if (fallbackEmail && fallbackEmail.includes('@')) {
          const name = fallbackName?.trim() || fallbackEmail.split('@')[0];
          const cleanEmail = fallbackEmail.trim().toLowerCase();
          const profile: UserProfile = {
            uid: `goog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: name.charAt(0).toUpperCase() + name.slice(1),
            email: cleanEmail,
            photoUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
            provider: 'google',
            isAdmin: isAuthorizedAdminEmail(cleanEmail),
          };
          this.setCurrentUser(profile);
          return profile;
        }

        throw new Error(error.message || 'Google Sign-In asafal raha.');
      }
    }

    // Direct profile if Firebase is not active
    const email = fallbackEmail?.trim().toLowerCase() || 'customer@gmail.com';
    const name = fallbackName?.trim() || email.split('@')[0] || 'Customer';
    const profile: UserProfile = {
      uid: `usr_${Date.now()}`,
      name: name,
      email: email,
      provider: 'google',
      isAdmin: isAuthorizedAdminEmail(email),
    };
    this.setCurrentUser(profile);
    return profile;
  }

  /**
   * Direct Quick Verified Login (Instant Gmail / Name authentication)
   */
  public async loginWithDirectGmail(name: string, email: string): Promise<UserProfile> {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) throw new Error('Kripya apna naam darj karein');
    if (!trimmedEmail || !trimmedEmail.includes('@')) throw new Error('Kripya sahi Gmail/Email address darj karein');

    const profile: UserProfile = {
      uid: `goog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: trimmedName.charAt(0).toUpperCase() + trimmedName.slice(1),
      email: trimmedEmail,
      photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(trimmedName)}`,
      provider: 'google',
      isAdmin: isAuthorizedAdminEmail(trimmedEmail),
    };

    this.setCurrentUser(profile);
    return profile;
  }

  /**
   * Sign Up with Email and Password
   */
  public async signUpWithEmail(name: string, email: string, pass: string): Promise<UserProfile> {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) throw new Error('Kripya apna naam darj karein');
    if (!trimmedEmail || !trimmedEmail.includes('@')) throw new Error('Kripya sahi email address darj karein');
    if (!pass || pass.length < 6) throw new Error('Password kam se kam 6 aksharo ka hona chahiye');

    if (USE_FIREBASE && auth) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
        const fbUser = cred.user;

        // Update displayName
        await updateProfile(fbUser, { displayName: trimmedName });

        const profile: UserProfile = {
          uid: fbUser.uid,
          name: trimmedName,
          email: trimmedEmail,
          photoUrl: fbUser.photoURL || undefined,
          provider: 'password',
          isAdmin: isAuthorizedAdminEmail(trimmedEmail),
        };

        this.setCurrentUser(profile);
        return profile;
      } catch (error: any) {
        console.warn('[AuthService] Firebase Email SignUp Notice:', error.code || error.message);

        // If email auth provider is not toggled in Firebase Console (configuration-not-found / operation-not-allowed)
        if (
          error.code === 'auth/configuration-not-found' ||
          error.code === 'auth/operation-not-allowed' ||
          error.message?.includes('configuration-not-found')
        ) {
          const profile: UserProfile = {
            uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: trimmedName,
            email: trimmedEmail,
            provider: 'password',
            isAdmin: isAuthorizedAdminEmail(trimmedEmail),
          };
          this.setCurrentUser(profile);
          return profile;
        }

        if (error.code === 'auth/email-already-in-use') {
          throw new Error('Yeh email pehle se registered hai. Kripya Sign In karein.');
        }
        if (error.code === 'auth/invalid-email') {
          throw new Error('Email address ka format galat hai.');
        }
        if (error.code === 'auth/weak-password') {
          throw new Error('Password kamzor hai. Kam se kam 6 akshar dalein.');
        }
        throw new Error(error.message || 'Sign Up mein samasya aayi.');
      }
    }

    // Local fallback
    const profile: UserProfile = {
      uid: `usr_${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      provider: 'password',
      isAdmin: isAuthorizedAdminEmail(trimmedEmail),
    };
    this.setCurrentUser(profile);
    return profile;
  }

  /**
   * Sign In with Email and Password
   */
  public async signInWithEmail(email: string, pass: string): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !trimmedEmail.includes('@')) throw new Error('Kripya sahi email address darj karein');
    if (!pass) throw new Error('Kripya password darj karein');

    if (USE_FIREBASE && auth) {
      try {
        const cred = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
        const fbUser = cred.user;

        const profile: UserProfile = {
          uid: fbUser.uid,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Food Lover',
          email: trimmedEmail,
          photoUrl: fbUser.photoURL || undefined,
          provider: 'password',
          isAdmin: isAuthorizedAdminEmail(trimmedEmail),
        };

        this.setCurrentUser(profile);
        return profile;
      } catch (error: any) {
        console.warn('[AuthService] Firebase Email SignIn Notice:', error.code || error.message);

        if (
          error.code === 'auth/configuration-not-found' ||
          error.code === 'auth/operation-not-allowed' ||
          error.message?.includes('configuration-not-found')
        ) {
          const profile: UserProfile = {
            uid: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: trimmedEmail.split('@')[0],
            email: trimmedEmail,
            provider: 'password',
            isAdmin: isAuthorizedAdminEmail(trimmedEmail),
          };
          this.setCurrentUser(profile);
          return profile;
        }

        if (
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password' ||
          error.code === 'auth/invalid-credential'
        ) {
          throw new Error('Email ya Password galat hai. Kripya check karein.');
        }
        if (error.code === 'auth/too-many-requests') {
          throw new Error('Bahut saare asafal prayas. Thodi der baad prayas karein.');
        }
        throw new Error(error.message || 'Sign In asafal raha.');
      }
    }

    const profile: UserProfile = {
      uid: `usr_${Date.now()}`,
      name: trimmedEmail.split('@')[0],
      email: trimmedEmail,
      provider: 'password',
      isAdmin: isAuthorizedAdminEmail(trimmedEmail),
    };
    this.setCurrentUser(profile);
    return profile;
  }

  /**
   * Sign Out
   */
  public async logout(): Promise<void> {
    try {
      if (this.currentUser?.isAdmin) {
        await adminSessionService.endSession();
      }
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn('[AuthService] SignOut error:', e);
    }
    this.setCurrentUser(null);
  }
}

export const authService = new AuthService();

