import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase Firestore & Authentication Configuration for Zoya Chat Center
 * Connected to Firebase project: seventh-service-671nt-bbfc5
 */
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {} as Record<string, string | undefined>;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyB7wGhRuI2VoZI7AaLEv5WIdLQP8KWE7Rw",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "seventh-service-671nt-bbfc5.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "seventh-service-671nt-bbfc5",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "seventh-service-671nt-bbfc5.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "546343706814",
  appId: env.VITE_FIREBASE_APP_ID || "1:546343706814:web:dcaebc25f67accd1567eef"
};

// Enable live Firestore connection
export const USE_FIREBASE = true;

let appInstance: FirebaseApp;
let dbInstance: Firestore;
let authInstance: Auth;

try {
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(appInstance);
  authInstance = getAuth(appInstance);
  console.log('[Firebase] Successfully connected to Firebase Project:', firebaseConfig.projectId);
} catch (e) {
  console.warn('[Firebase] Initialization error fallback:', e);
  appInstance = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  dbInstance = getFirestore(appInstance);
  authInstance = getAuth(appInstance);
}

export const app = appInstance;
export const db = dbInstance;
export const auth = authInstance;
