import { CATEGORIES as INITIAL_CATEGORIES } from '../data/initialMenu';
import { Category } from '../types';
import { db, USE_FIREBASE } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

const CATEGORY_STORAGE_KEY = 'zoya_categories_v1';
const CATEGORY_CHANNEL = 'zoya_category_sync_channel';

class CategoryService {
  private categories: Category[] = [];
  private listeners: Set<(categories: Category[]) => void> = new Set();
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
        this.broadcastChannel = new BroadcastChannel(CATEGORY_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'CATEGORIES_UPDATED') {
            this.categories = event.data.payload;
            this.notify();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel category sync error:', e);
      }
    }
  }

  private initFirestoreSync() {
    try {
      const categoryRef = collection(db, 'categories');
      this.unsubscribeFirestore = onSnapshot(
        categoryRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteCats: Category[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remoteCats.push({
                id: docSnap.id,
                name: data.name || docSnap.id,
                iconName: data.iconName || 'Utensils',
              });
            });
            // Ensure 'all' is at the front
            const hasAll = remoteCats.some((c) => c.id === 'all');
            if (!hasAll) {
              remoteCats.unshift({ id: 'all', name: 'All', iconName: 'Utensils' });
            }
            this.categories = remoteCats;
            this.persistLocalOnly();
            this.notify();
          }
        },
        (error) => {
          console.warn('Firestore categories sync notice:', error.message);
        }
      );
    } catch (err) {
      console.warn('Failed to setup Firestore category sync:', err);
    }
  }

  private loadInitialData() {
    if (typeof window === 'undefined') {
      this.categories = [...INITIAL_CATEGORIES];
      return;
    }

    try {
      const stored = localStorage.getItem(CATEGORY_STORAGE_KEY);
      if (stored) {
        this.categories = JSON.parse(stored);
      } else {
        this.categories = [...INITIAL_CATEGORIES];
        this.persistLocalOnly();
      }
    } catch (e) {
      console.error('Error reading categories from localStorage:', e);
      this.categories = [...INITIAL_CATEGORIES];
    }
  }

  private persistLocalOnly() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(this.categories));
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'CATEGORIES_UPDATED',
          payload: this.categories,
        });
      }
    } catch (e) {
      console.error('Error saving categories to localStorage:', e);
    }
  }

  private notify() {
    this.listeners.forEach((callback) => callback([...this.categories]));
  }

  public getCategories(): Category[] {
    return [...this.categories];
  }

  public async addCategory(name: string, iconName: string = 'Utensils'): Promise<Category> {
    const trimmedName = name.trim();
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    const id = slug || `cat-${Date.now()}`;

    // Check if category ID or name already exists
    const existing = this.categories.find(
      (c) => c.id.toLowerCase() === id.toLowerCase() || c.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existing) {
      return existing;
    }

    const newCat: Category = {
      id,
      name: trimmedName,
      iconName: iconName || 'Utensils',
    };

    this.categories.push(newCat);
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await setDoc(doc(db, 'categories', newCat.id), newCat);
      } catch (err) {
        console.error('Error saving category to Firestore:', err);
      }
    }

    return newCat;
  }

  public async updateCategory(id: string, name: string, iconName: string): Promise<boolean> {
    const index = this.categories.findIndex((c) => c.id === id);
    if (index === -1) return false;

    this.categories[index] = {
      ...this.categories[index],
      name: name.trim(),
      iconName: iconName || this.categories[index].iconName,
    };

    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await setDoc(doc(db, 'categories', id), this.categories[index]);
      } catch (err) {
        console.error('Error updating category in Firestore:', err);
      }
    }

    return true;
  }

  public async deleteCategory(id: string): Promise<boolean> {
    if (id === 'all') return false; // Prevent deleting 'All'

    const prevLength = this.categories.length;
    this.categories = this.categories.filter((c) => c.id !== id);
    if (this.categories.length !== prevLength) {
      this.persistLocalOnly();
      this.notify();

      if (USE_FIREBASE) {
        try {
          await deleteDoc(doc(db, 'categories', id));
        } catch (err) {
          console.error('Error deleting category from Firestore:', err);
        }
      }
      return true;
    }
    return false;
  }

  public resetToDefault(): void {
    this.categories = [...INITIAL_CATEGORIES];
    this.persistLocalOnly();
    this.notify();
  }

  public subscribe(callback: (categories: Category[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.categories]);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const categoryService = new CategoryService();
