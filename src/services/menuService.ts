import { INITIAL_MENU_ITEMS } from '../data/initialMenu';
import { MenuItem } from '../types';
import { db, USE_FIREBASE } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';

const MENU_STORAGE_KEY = 'zoya_menu_items_v1';
const MENU_CHANNEL = 'zoya_menu_sync_channel';

class MenuService {
  private items: MenuItem[] = [];
  private listeners: Set<(items: MenuItem[]) => void> = new Set();
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
        this.broadcastChannel = new BroadcastChannel(MENU_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'MENU_UPDATED') {
            this.items = event.data.payload;
            this.notify();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  private initFirestoreSync() {
    try {
      const menuRef = collection(db, 'menu_items');
      this.unsubscribeFirestore = onSnapshot(
        menuRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteItems: MenuItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remoteItems.push({
                id: docSnap.id,
                name: data.name || '',
                description: data.description || '',
                price: Number(data.price) || 0,
                category: data.category || 'chaat',
                image: data.image || '',
                images: Array.isArray(data.images) ? data.images : (data.image ? [data.image] : []),
                isVeg: data.isVeg ?? true,
                isAvailable: data.isAvailable ?? true,
                isPopular: !!data.isPopular,
                isSpicy: !!data.isSpicy,
                preparationTime: Number(data.preparationTime) || 8,
              });
            });
            this.items = remoteItems;
            this.persistLocalOnly();
            this.notify();
          }
        },
        (error) => {
          console.warn('Firestore menu items sync notice:', error.message);
        }
      );
    } catch (err) {
      console.warn('Failed to setup Firestore menu sync:', err);
    }
  }

  private loadInitialData() {
    if (typeof window === 'undefined') {
      this.items = [...INITIAL_MENU_ITEMS];
      return;
    }

    try {
      const stored = localStorage.getItem(MENU_STORAGE_KEY);
      if (stored) {
        this.items = JSON.parse(stored);
      } else {
        this.items = [...INITIAL_MENU_ITEMS];
        this.persistLocalOnly();
      }
    } catch (e) {
      console.error('Error reading menu from localStorage:', e);
      this.items = [...INITIAL_MENU_ITEMS];
    }
  }

  private persistLocalOnly() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(this.items));
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'MENU_UPDATED',
          payload: this.items,
        });
      }
    } catch (e) {
      console.error('Error saving menu to localStorage:', e);
    }
  }

  private notify() {
    this.listeners.forEach((callback) => callback([...this.items]));
  }

  public getMenuItems(): MenuItem[] {
    return [...this.items];
  }

  public getAvailableItems(): MenuItem[] {
    return this.items.filter((item) => item.isAvailable);
  }

  public getItemById(id: string): MenuItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  public async addMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.items.unshift(newItem);
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await setDoc(doc(db, 'menu_items', newItem.id), newItem);
      } catch (err) {
        console.error('Error saving menu item to Firestore:', err);
      }
    }

    return newItem;
  }

  public async updateMenuItem(updatedItem: MenuItem): Promise<boolean> {
    const index = this.items.findIndex((item) => item.id === updatedItem.id);
    if (index === -1) return false;
    this.items[index] = { ...updatedItem };
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await setDoc(doc(db, 'menu_items', updatedItem.id), updatedItem);
      } catch (err) {
        console.error('Error updating menu item in Firestore:', err);
      }
    }

    return true;
  }

  public async deleteMenuItem(id: string): Promise<boolean> {
    const prevLength = this.items.length;
    this.items = this.items.filter((item) => item.id !== id);
    if (this.items.length !== prevLength) {
      this.persistLocalOnly();
      this.notify();

      if (USE_FIREBASE) {
        try {
          await deleteDoc(doc(db, 'menu_items', id));
        } catch (err) {
          console.error('Error deleting menu item from Firestore:', err);
        }
      }
      return true;
    }
    return false;
  }

  public async toggleAvailability(id: string): Promise<boolean> {
    const item = this.items.find((i) => i.id === id);
    if (!item) return false;
    item.isAvailable = !item.isAvailable;
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await updateDoc(doc(db, 'menu_items', id), {
          isAvailable: item.isAvailable,
        });
      } catch (err) {
        console.error('Error updating item availability in Firestore:', err);
      }
    }

    return true;
  }

  public resetToDefault(): void {
    this.items = [...INITIAL_MENU_ITEMS];
    this.persistLocalOnly();
    this.notify();
  }

  public subscribe(callback: (items: MenuItem[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.items]);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const menuService = new MenuService();
