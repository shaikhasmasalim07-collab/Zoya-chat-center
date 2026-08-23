import { AdminSession } from '../types';
import { db, USE_FIREBASE } from './firebaseConfig';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

const ADMIN_SESSION_STORAGE_KEY = 'zoya_admin_session_id_v1';
const ADMIN_SESSION_DATA_KEY = 'zoya_admin_session_data_v1';
const ADMIN_SESSION_CHANNEL = 'zoya_admin_session_sync_channel';
const FIRESTORE_DOC_PATH = ['system_status', 'admin_session'] as const;

class AdminSessionService {
  private currentSessionId: string | null = null;
  private currentSession: AdminSession = {
    isActive: false,
    activeSessionId: null,
    adminEmail: null,
    deviceInfo: null,
    startedAt: null,
    lastHeartbeat: null,
  };
  private listeners: Set<(session: AdminSession, isCurrentDeviceActive: boolean) => void> = new Set();
  private kickOutListeners: Set<(remoteEmail: string | null, reason: string) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.initLocalState();
    this.initBroadcast();
    if (USE_FIREBASE && db) {
      this.initFirestoreSync();
    }
  }

  private initLocalState() {
    if (typeof window === 'undefined') return;
    try {
      this.currentSessionId =
        sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ||
        localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      const stored = localStorage.getItem(ADMIN_SESSION_DATA_KEY);
      if (stored) {
        this.currentSession = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Error reading admin session local data', e);
    }
  }

  private initBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(ADMIN_SESSION_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'ADMIN_SESSION_CHANGE') {
            this.handleSessionUpdate(event.data.payload);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error in AdminSessionService:', e);
      }
    }
  }

  private initFirestoreSync() {
    if (!USE_FIREBASE || !db) return;
    try {
      const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
      this.unsubscribeFirestore = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as AdminSession;
            this.handleSessionUpdate(data);
          } else {
            // Document doesn't exist yet
            this.handleSessionUpdate({
              isActive: false,
              activeSessionId: null,
              adminEmail: null,
              deviceInfo: null,
              startedAt: null,
              lastHeartbeat: null,
            });
          }
        },
        (error) => {
          console.warn('Firestore admin_session onSnapshot notice:', error.message);
        }
      );
    } catch (e) {
      console.warn('Error setting up Firestore admin_session listener:', e);
    }
  }

  private handleSessionUpdate(incoming: AdminSession) {
    this.currentSession = incoming;

    // Check if another phone/device took over while this device thought it had active admin session
    if (
      incoming.isActive &&
      incoming.activeSessionId &&
      this.currentSessionId &&
      incoming.activeSessionId !== this.currentSessionId
    ) {
      // Another device logged in! Real-time force kick-out from this device.
      console.warn(`[Real-time Admin Lock] Session taken over by another phone (${incoming.adminEmail})`);
      this.currentSessionId = null;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
          localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
        } catch (e) {}
      }
      this.stopHeartbeat();
      this.kickOutListeners.forEach((cb) => cb(incoming.adminEmail, 'Admin logged in from another phone'));
    }

    // Persist locally
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_SESSION_DATA_KEY, JSON.stringify(incoming));
      } catch (e) {}
    }

    this.notify();
  }

  private notify() {
    const isCurrentDeviceActive = !!(
      this.currentSession.isActive &&
      this.currentSessionId &&
      this.currentSession.activeSessionId === this.currentSessionId
    );

    this.listeners.forEach((cb) => cb(this.currentSession, isCurrentDeviceActive));
  }

  private broadcast(session: AdminSession) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'ADMIN_SESSION_CHANGE',
          payload: session,
        });
      } catch (e) {
        console.warn('Broadcast error:', e);
      }
    }
  }

  private getDeviceDescription(): string {
    if (typeof navigator === 'undefined') return 'Web Browser';
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const platform = isMobile ? 'Mobile Phone' : 'Desktop / Tablet';
    return `${platform} (${navigator.platform || 'Online'})`;
  }

  /**
   * Start an exclusive admin session on this phone
   */
  public async startSession(email: string): Promise<string> {
    const newSessionId = `adm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    const device = this.getDeviceDescription();

    this.currentSessionId = newSessionId;
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, newSessionId);
        localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, newSessionId);
      } catch (e) {}
    }

    const sessionPayload: AdminSession = {
      isActive: true,
      activeSessionId: newSessionId,
      adminEmail: email,
      deviceInfo: device,
      startedAt: nowIso,
      lastHeartbeat: nowIso,
    };

    this.currentSession = sessionPayload;
    this.broadcast(sessionPayload);
    this.notify();

    // Start active heartbeat
    this.startHeartbeat(newSessionId, email);

    // Save to Firestore if available
    if (USE_FIREBASE && db) {
      try {
        const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
        await setDoc(docRef, sessionPayload, { merge: true });
      } catch (e) {
        console.warn('Error saving admin session to Firestore:', e);
      }
    }

    return newSessionId;
  }

  /**
   * End current admin session (logout/close) and release lock
   */
  public async endSession(): Promise<void> {
    this.stopHeartbeat();
    this.currentSessionId = null;

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
        localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      } catch (e) {}
    }

    const emptySession: AdminSession = {
      isActive: false,
      activeSessionId: null,
      adminEmail: null,
      deviceInfo: null,
      startedAt: null,
      lastHeartbeat: null,
    };

    this.currentSession = emptySession;
    this.broadcast(emptySession);
    this.notify();

    if (USE_FIREBASE && db) {
      try {
        const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
        await setDoc(docRef, emptySession, { merge: true });
      } catch (e) {
        console.warn('Error clearing admin session from Firestore:', e);
      }
    }
  }

  private startHeartbeat(sessionId: string, _email: string) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      if (this.currentSessionId === sessionId && this.currentSession.isActive) {
        const nowIso = new Date().toISOString();
        this.currentSession.lastHeartbeat = nowIso;
        if (USE_FIREBASE && db) {
          try {
            const docRef = doc(db, FIRESTORE_DOC_PATH[0], FIRESTORE_DOC_PATH[1]);
            await setDoc(docRef, { lastHeartbeat: nowIso }, { merge: true });
          } catch (e) {
            // Heartbeat non-fatal
          }
        }
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public isSessionActiveOnAnotherDevice(): boolean {
    if (!this.currentSession.isActive || !this.currentSession.activeSessionId) {
      return false;
    }
    return this.currentSession.activeSessionId !== this.currentSessionId;
  }

  public isCurrentDeviceActive(): boolean {
    return !!(
      this.currentSession.isActive &&
      this.currentSessionId &&
      this.currentSession.activeSessionId === this.currentSessionId
    );
  }

  public getCurrentSession(): AdminSession {
    return { ...this.currentSession };
  }

  public subscribe(callback: (session: AdminSession, isCurrentDeviceActive: boolean) => void): () => void {
    this.listeners.add(callback);
    callback(this.currentSession, this.isCurrentDeviceActive());
    return () => {
      this.listeners.delete(callback);
    };
  }

  public onKickOut(callback: (remoteEmail: string | null, reason: string) => void): () => void {
    this.kickOutListeners.add(callback);
    return () => {
      this.kickOutListeners.delete(callback);
    };
  }
}

export const adminSessionService = new AdminSessionService();
