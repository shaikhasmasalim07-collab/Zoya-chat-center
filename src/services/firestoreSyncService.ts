import { db, USE_FIREBASE, firebaseConfig } from './firebaseConfig';
import { doc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { INITIAL_MENU_ITEMS, CATEGORIES } from '../data/initialMenu';
import { INITIAL_BANNERS } from './bannerService';
import { INITIAL_COUPONS } from './couponService';
import { menuService } from './menuService';
import { categoryService } from './categoryService';
import { couponService } from './couponService';
import { bannerService } from './bannerService';
import { reviewService } from './reviewService';
import { orderService } from './orderService';

export interface SyncStats {
  menuItems: number;
  categories: number;
  coupons: number;
  banners: number;
  reviews: number;
  orders: number;
  lastSynced?: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  errorMessage?: string;
}

class FirestoreSyncService {
  /**
   * Automatically seed initial data if Firestore collections are empty on first run
   */
  public async autoSeedIfEmpty(): Promise<void> {
    if (!USE_FIREBASE) return;

    try {
      // Check menu_items collection
      const menuSnap = await getDocs(collection(db, 'menu_items'));
      if (menuSnap.empty) {
        console.log('[Firestore] Seeding initial menu items to Firestore...');
        for (const item of INITIAL_MENU_ITEMS) {
          await setDoc(doc(db, 'menu_items', item.id), item);
        }
      }

      // Check categories collection
      const catSnap = await getDocs(collection(db, 'categories'));
      if (catSnap.empty) {
        console.log('[Firestore] Seeding initial categories to Firestore...');
        for (const cat of CATEGORIES) {
          await setDoc(doc(db, 'categories', cat.id), cat);
        }
      }

      // Check promo_banners collection
      const bannerSnap = await getDocs(collection(db, 'promo_banners'));
      if (bannerSnap.empty) {
        console.log('[Firestore] Seeding initial promo banners to Firestore...');
        for (const banner of INITIAL_BANNERS) {
          await setDoc(doc(db, 'promo_banners', banner.id), banner);
        }
      }

      // Check coupons collection
      const couponSnap = await getDocs(collection(db, 'coupons'));
      if (couponSnap.empty) {
        console.log('[Firestore] Seeding initial coupons to Firestore...');
        for (const coupon of INITIAL_COUPONS) {
          await setDoc(doc(db, 'coupons', coupon.id), coupon);
        }
      }

      console.log('[Firestore] All data collections verified with Firestore.');
    } catch (error: any) {
      console.warn('[Firestore] Auto-seed note:', error.message || error);
    }
  }

  /**
   * Push all current active data (Menu, Categories, Coupons, Banners, Reviews, Orders) to Firestore
   */
  public async pushAllDataToFirestore(): Promise<SyncStats> {
    if (!USE_FIREBASE) {
      throw new Error('Firebase is not enabled');
    }

    try {
      const currentMenu = menuService.getMenuItems();
      const currentCats = categoryService.getCategories();
      const currentCoupons = couponService.getCoupons();
      const currentBanners = bannerService.getBanners();
      const currentReviews = reviewService.getReviews();
      const currentOrders = orderService.getOrders();

      // 1. Sync Menu Items
      for (const item of currentMenu) {
        await setDoc(doc(db, 'menu_items', item.id), item);
      }

      // 2. Sync Categories
      for (const cat of currentCats) {
        await setDoc(doc(db, 'categories', cat.id), cat);
      }

      // 3. Sync Coupons
      for (const coupon of currentCoupons) {
        await setDoc(doc(db, 'coupons', coupon.id), coupon);
      }

      // 4. Sync Banners
      for (const banner of currentBanners) {
        await setDoc(doc(db, 'promo_banners', banner.id), banner);
      }

      // 5. Sync Reviews
      for (const rev of currentReviews) {
        await setDoc(doc(db, 'reviews', rev.id), rev);
      }

      // 6. Sync Orders
      for (const ord of currentOrders) {
        await setDoc(doc(db, 'orders', ord.id), ord);
      }

      const stats: SyncStats = {
        menuItems: currentMenu.length,
        categories: currentCats.length,
        coupons: currentCoupons.length,
        banners: currentBanners.length,
        reviews: currentReviews.length,
        orders: currentOrders.length,
        lastSynced: new Date().toLocaleTimeString(),
        status: 'success',
      };

      console.log('[Firestore] Successfully pushed all data to Firestore:', stats);
      return stats;
    } catch (err: any) {
      console.error('[Firestore] Push all data failed:', err);
      throw new Error(err.message || 'Failed to sync data to Firestore');
    }
  }
}

export const firestoreSyncService = new FirestoreSyncService();
