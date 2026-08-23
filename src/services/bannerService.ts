import { PromoBanner } from '../types';
import { db, USE_FIREBASE } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';

const BANNERS_STORAGE_KEY = 'zoya_banners_v1';
const BANNERS_CHANNEL = 'zoya_banners_sync_channel';

export const INITIAL_BANNERS: PromoBanner[] = [
  {
    id: 'banner-chaat-spl',
    title: 'Special Dahi Puri & Pav Bhaji Combo',
    subtitle: 'Crispy, freshly assembled & served hot to your table!',
    tag: '⚡ Chef Special',
    bgGradient: 'from-[#516B84] to-[#2B3A48]',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
  {
    id: 'banner-discount',
    title: 'Use Code ZOYA20 for 20% OFF',
    subtitle: 'Apply at checkout on orders above ₹199. Freshly made!',
    tag: '🏷️ Today Offer',
    bgGradient: 'from-amber-700 to-amber-900',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    isActive: true,
  },
];

class BannerService {
  private banners: PromoBanner[] = [];
  private listeners: Set<(banners: PromoBanner[]) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.loadInitialData();
    this.initBroadcast();
    if (USE_FIREBASE) {
      this.initFirestoreSync();
    }
  }

  private initBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(BANNERS_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'BANNERS_UPDATED') {
            this.banners = event.data.payload;
            this.notify();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error in bannerService:', e);
      }
    }
  }

  private initFirestoreSync() {
    try {
      const colRef = collection(db, 'promo_banners');
      this.unsubscribeFirestore = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const remote: PromoBanner[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remote.push({
                id: docSnap.id,
                title: data.title || '',
                subtitle: data.subtitle || '',
                tag: data.tag || '',
                bgGradient: data.bgGradient || 'from-[#516B84] to-[#2B3A48]',
                imageUrl: data.imageUrl || '',
                isActive: data.isActive ?? true,
              });
            });
            this.banners = remote;
            this.persistLocalOnly();
            this.notify();
          }
        },
        (err) => {
          console.warn('Firestore banners sync notice:', err.message);
        }
      );
    } catch (e) {
      console.warn('Failed to init Firestore banners sync:', e);
    }
  }

  private loadInitialData() {
    if (typeof window === 'undefined') {
      this.banners = [...INITIAL_BANNERS];
      return;
    }
    try {
      const stored = localStorage.getItem(BANNERS_STORAGE_KEY);
      if (stored) {
        this.banners = JSON.parse(stored);
      } else {
        this.banners = [...INITIAL_BANNERS];
        this.persistLocalOnly();
      }
    } catch (e) {
      this.banners = [...INITIAL_BANNERS];
    }
  }

  private persistLocalOnly() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(this.banners));
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'BANNERS_UPDATED',
          payload: this.banners,
        });
      }
    } catch (e) {
      console.error('Error saving banners locally:', e);
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb([...this.banners]));
  }

  public getBanners(): PromoBanner[] {
    return [...this.banners];
  }

  public getActiveBanners(): PromoBanner[] {
    return this.banners.filter((b) => b.isActive);
  }

  public async addBanner(banner: Omit<PromoBanner, 'id'>): Promise<PromoBanner> {
    const newBanner: PromoBanner = {
      ...banner,
      id: `banner-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.banners.unshift(newBanner);
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await setDoc(doc(db, 'promo_banners', newBanner.id), newBanner);
      } catch (err) {
        console.error('Error adding banner in Firestore:', err);
      }
    }

    return newBanner;
  }

  public async updateBanner(updated: PromoBanner): Promise<boolean> {
    const idx = this.banners.findIndex((b) => b.id === updated.id);
    if (idx === -1) return false;
    this.banners[idx] = { ...updated };
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await setDoc(doc(db, 'promo_banners', updated.id), updated);
      } catch (err) {
        console.error('Error updating banner in Firestore:', err);
      }
    }
    return true;
  }

  public async deleteBanner(id: string): Promise<boolean> {
    const prev = this.banners.length;
    this.banners = this.banners.filter((b) => b.id !== id);
    if (this.banners.length !== prev) {
      this.persistLocalOnly();
      this.notify();

      if (USE_FIREBASE) {
        try {
          await deleteDoc(doc(db, 'promo_banners', id));
        } catch (err) {
          console.error('Error deleting banner in Firestore:', err);
        }
      }
      return true;
    }
    return false;
  }

  public async toggleActive(id: string): Promise<boolean> {
    const b = this.banners.find((item) => item.id === id);
    if (!b) return false;
    b.isActive = !b.isActive;
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await updateDoc(doc(db, 'promo_banners', id), { isActive: b.isActive });
      } catch (err) {
        console.error('Error toggling banner status in Firestore:', err);
      }
    }
    return true;
  }

  public resetToDefault(): void {
    this.banners = [...INITIAL_BANNERS];
    this.persistLocalOnly();
    this.notify();
  }

  public subscribe(cb: (banners: PromoBanner[]) => void): () => void {
    this.listeners.add(cb);
    cb([...this.banners]);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const bannerService = new BannerService();
