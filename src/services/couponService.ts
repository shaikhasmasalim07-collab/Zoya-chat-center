import { Coupon } from '../types';
import { db, USE_FIREBASE } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';

const COUPONS_STORAGE_KEY = 'zoya_coupons_v1';
const COUPONS_CHANNEL = 'zoya_coupons_sync_channel';

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'c-welcome20',
    code: 'ZOYA20',
    description: '20% OFF on all orders above ₹199',
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmount: 199,
    maxDiscount: 100,
    isActive: true,
  },
  {
    id: 'c-flat50',
    code: 'FLAT50',
    description: 'Flat ₹50 OFF on orders above ₹299',
    discountType: 'flat',
    discountValue: 50,
    minOrderAmount: 299,
    isActive: true,
  },
  {
    id: 'c-chaat10',
    code: 'CHAAT10',
    description: '10% instant discount on orders above ₹100',
    discountType: 'percentage',
    discountValue: 10,
    minOrderAmount: 100,
    maxDiscount: 50,
    isActive: true,
  },
];

class CouponService {
  private coupons: Coupon[] = [];
  private listeners: Set<(coupons: Coupon[]) => void> = new Set();
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
        this.broadcastChannel = new BroadcastChannel(COUPONS_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'COUPONS_UPDATED') {
            this.coupons = event.data.payload;
            this.notify();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error in couponService:', e);
      }
    }
  }

  private initFirestoreSync() {
    try {
      const colRef = collection(db, 'coupons');
      this.unsubscribeFirestore = onSnapshot(
        colRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const remote: Coupon[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remote.push({
                id: docSnap.id,
                code: (data.code || '').toUpperCase(),
                description: data.description || '',
                discountType: data.discountType === 'flat' ? 'flat' : 'percentage',
                discountValue: Number(data.discountValue) || 0,
                minOrderAmount: Number(data.minOrderAmount) || 0,
                maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
                isActive: data.isActive ?? true,
              });
            });
            this.coupons = remote;
            this.persistLocalOnly();
            this.notify();
          }
        },
        (err) => {
          console.warn('Firestore coupons sync notice:', err.message);
        }
      );
    } catch (e) {
      console.warn('Failed to init Firestore coupons sync:', e);
    }
  }

  private loadInitialData() {
    if (typeof window === 'undefined') {
      this.coupons = [...INITIAL_COUPONS];
      return;
    }
    try {
      const stored = localStorage.getItem(COUPONS_STORAGE_KEY);
      if (stored) {
        this.coupons = JSON.parse(stored);
      } else {
        this.coupons = [...INITIAL_COUPONS];
        this.persistLocalOnly();
      }
    } catch (e) {
      this.coupons = [...INITIAL_COUPONS];
    }
  }

  private persistLocalOnly() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(this.coupons));
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'COUPONS_UPDATED',
          payload: this.coupons,
        });
      }
    } catch (e) {
      console.error('Error saving coupons locally:', e);
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb([...this.coupons]));
  }

  public getCoupons(): Coupon[] {
    return [...this.coupons];
  }

  public getActiveCoupons(): Coupon[] {
    return this.coupons.filter((c) => c.isActive);
  }

  public getCouponByCode(code: string): Coupon | undefined {
    const clean = code.trim().toUpperCase();
    return this.coupons.find((c) => c.code.toUpperCase() === clean && c.isActive);
  }

  public validateCoupon(code: string, subtotal: number): { valid: boolean; discount: number; error?: string; coupon?: Coupon } {
    const cleanCode = code.trim().toUpperCase();
    const coupon = this.coupons.find((c) => c.code.toUpperCase() === cleanCode && c.isActive);

    if (!coupon) {
      return { valid: false, discount: 0, error: 'Invalid or expired coupon code.' };
    }

    if (subtotal < coupon.minOrderAmount) {
      return {
        valid: false,
        discount: 0,
        error: `Minimum order amount for ${coupon.code} is ₹${coupon.minOrderAmount}.`,
      };
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    // Discount cannot exceed subtotal
    discount = Math.min(discount, subtotal);

    return { valid: true, discount, coupon };
  }

  public async addCoupon(coupon: Omit<Coupon, 'id'>): Promise<Coupon> {
    const newCoupon: Coupon = {
      ...coupon,
      id: `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: coupon.code.trim().toUpperCase(),
    };
    this.coupons.unshift(newCoupon);
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await setDoc(doc(db, 'coupons', newCoupon.id), newCoupon);
      } catch (err) {
        console.error('Error adding coupon to Firestore:', err);
      }
    }

    return newCoupon;
  }

  public async updateCoupon(updated: Coupon): Promise<boolean> {
    const idx = this.coupons.findIndex((c) => c.id === updated.id);
    if (idx === -1) return false;

    const formatted: Coupon = {
      ...updated,
      code: updated.code.trim().toUpperCase(),
    };

    this.coupons[idx] = formatted;
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await setDoc(doc(db, 'coupons', formatted.id), formatted);
      } catch (err) {
        console.error('Error updating coupon in Firestore:', err);
      }
    }
    return true;
  }

  public async deleteCoupon(id: string): Promise<boolean> {
    const prev = this.coupons.length;
    this.coupons = this.coupons.filter((c) => c.id !== id);
    if (this.coupons.length !== prev) {
      this.persistLocalOnly();
      this.notify();

      if (USE_FIREBASE) {
        try {
          await deleteDoc(doc(db, 'coupons', id));
        } catch (err) {
          console.error('Error deleting coupon in Firestore:', err);
        }
      }
      return true;
    }
    return false;
  }

  public async toggleActive(id: string): Promise<boolean> {
    const coupon = this.coupons.find((c) => c.id === id);
    if (!coupon) return false;
    coupon.isActive = !coupon.isActive;
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await updateDoc(doc(db, 'coupons', id), { isActive: coupon.isActive });
      } catch (err) {
        console.error('Error updating coupon status in Firestore:', err);
      }
    }
    return true;
  }

  public resetToDefault(): void {
    this.coupons = [...INITIAL_COUPONS];
    this.persistLocalOnly();
    this.notify();
  }

  public subscribe(cb: (coupons: Coupon[]) => void): () => void {
    this.listeners.add(cb);
    cb([...this.coupons]);
    return () => {
      this.listeners.delete(cb);
    };
  }
}

export const couponService = new CouponService();
