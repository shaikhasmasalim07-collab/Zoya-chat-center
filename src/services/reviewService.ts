import { CustomerReview, UserProfile } from '../types';
import { db, USE_FIREBASE } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';

const REVIEWS_STORAGE_KEY = 'zoya_customer_reviews_v1';
const REVIEWS_COLLECTION = 'reviews';

const INITIAL_REVIEWS: CustomerReview[] = [
  {
    id: 'rev_1',
    name: 'Aafiya Khan',
    rating: 5,
    comment: 'The Special Dahi Puri and Cheese Pav Bhaji were incredibly fresh and bursting with authentic flavors! Super clean ambience and very fast digital ordering at Table 3.',
    dishName: 'Special Dahi Puri',
    tags: ['Super Crispy', 'Authentic Taste', 'Hygiene 10/10'],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    likesCount: 14,
    tableNumber: 3,
    isVerified: true,
    authProvider: 'google',
  },
  {
    id: 'rev_2',
    name: 'Rahul Sharma',
    rating: 5,
    comment: 'Best chaat center in the city! Ordered via QR code at table, within 6 minutes hot crispy Sev Puri and grilled sandwich arrived. Highly recommend for family snacking.',
    dishName: 'Special Sev Puri',
    tags: ['Fast Table Delivery', 'Family Friendly'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    likesCount: 9,
    tableNumber: 6,
    isVerified: true,
    authProvider: 'google',
  },
  {
    id: 'rev_3',
    name: 'Zubair Shaikh',
    rating: 5,
    comment: 'Zoya Chat Center never disappoints. The Pani Puri water has the perfect spicy tangy punch, and the Cold Coffee with ice cream is pure bliss!',
    dishName: 'Crispy Pani Puri (6 Pcs)',
    tags: ['Super Crispy', 'Must Try', 'Affordable Price'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    likesCount: 22,
    tableNumber: 2,
    isVerified: true,
    authProvider: 'password',
  },
  {
    id: 'rev_4',
    name: 'Pooja Patil',
    rating: 4,
    comment: 'Delicious Masala Pav and Veg Grilled Sandwich. Loved the seamless digital invoice on WhatsApp and instant UPI payment.',
    dishName: 'Butter Cheese Pav Bhaji',
    tags: ['Authentic Spices', 'Great Ambience'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    likesCount: 7,
    tableNumber: 5,
    isVerified: true,
    authProvider: 'google',
  },
  {
    id: 'rev_5',
    name: 'Mohd. Imran',
    rating: 5,
    comment: 'Kolkata Style Jhalmuri and Dahi Vada are top tier. Always neat and tidy, staff is extremely polite.',
    dishName: 'Royal Dahi Vada',
    tags: ['Hygiene 10/10', 'Authentic Taste'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    likesCount: 16,
    tableNumber: 1,
    isVerified: true,
    authProvider: 'password',
  },
];

class ReviewService {
  private reviews: CustomerReview[] = [];
  private listeners: ((reviews: CustomerReview[]) => void)[] = [];
  private firestoreUnsub: (() => void) | null = null;

  constructor() {
    this.loadReviews();
    this.initFirestoreSync();
  }

  private loadReviews() {
    if (typeof window === 'undefined') {
      this.reviews = [...INITIAL_REVIEWS];
      return;
    }
    try {
      const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.reviews = parsed;
          return;
        }
      }
    } catch {
      // Fallback
    }
    this.reviews = [...INITIAL_REVIEWS];
    this.saveReviews();
  }

  private initFirestoreSync() {
    if (!USE_FIREBASE || !db) return;

    try {
      const reviewsRef = collection(db, REVIEWS_COLLECTION);
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));

      this.firestoreUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteReviews: CustomerReview[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as CustomerReview;
              remoteReviews.push({ ...data, id: docSnap.id });
            });
            this.reviews = remoteReviews;
            this.saveReviewsLocallyOnly();
            this.notify();
          }
        },
        (error) => {
          console.warn('[ReviewService] Firestore sync listener note:', error.message);
        }
      );
    } catch (e) {
      console.warn('[ReviewService] Firestore init error:', e);
    }
  }

  private saveReviewsLocallyOnly() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(this.reviews));
      } catch (e) {
        console.error('Failed to save reviews to localStorage', e);
      }
    }
  }

  private saveReviews() {
    this.saveReviewsLocallyOnly();
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.reviews]));
  }

  public getReviews(): CustomerReview[] {
    return [...this.reviews];
  }

  public async addReview(
    reviewData: {
      rating: number;
      comment: string;
      dishName?: string;
      tags?: string[];
      tableNumber?: number;
    },
    user: UserProfile
  ): Promise<CustomerReview> {
    const newReview: CustomerReview = {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: user.name.trim() || 'Verified Customer',
      rating: Math.max(1, Math.min(5, reviewData.rating)),
      comment: reviewData.comment.trim(),
      dishName: reviewData.dishName?.trim(),
      tags: reviewData.tags || [],
      createdAt: new Date().toISOString(),
      likesCount: 0,
      tableNumber: reviewData.tableNumber,
      isVerified: true,
      userId: user.uid,
      userEmail: user.email,
      userPhotoUrl: user.photoUrl,
      authProvider: user.provider,
    };

    // 1. Instant local update
    this.reviews = [newReview, ...this.reviews];
    this.saveReviews();

    // 2. Sync to Firestore if online
    if (USE_FIREBASE && db) {
      try {
        const docRef = doc(db, REVIEWS_COLLECTION, newReview.id);
        await setDoc(docRef, newReview);
      } catch (err) {
        console.warn('[ReviewService] Could not persist review to Firestore, saved locally:', err);
      }
    }

    return newReview;
  }

  public async likeReview(id: string): Promise<void> {
    const target = this.reviews.find((r) => r.id === id);
    if (target) {
      target.likesCount = (target.likesCount || 0) + 1;
      this.saveReviews();

      if (USE_FIREBASE && db) {
        try {
          const docRef = doc(db, REVIEWS_COLLECTION, id);
          await updateDoc(docRef, { likesCount: target.likesCount });
        } catch {
          // Fallback ignore
        }
      }
    }
  }

  public async deleteReview(id: string): Promise<void> {
    this.reviews = this.reviews.filter((r) => r.id !== id);
    this.saveReviews();

    if (USE_FIREBASE && db) {
      try {
        const docRef = doc(db, REVIEWS_COLLECTION, id);
        await deleteDoc(docRef);
      } catch (e) {
        console.warn('[ReviewService] Could not delete from Firestore:', e);
      }
    }
  }

  public subscribe(listener: (reviews: CustomerReview[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.reviews]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const reviewService = new ReviewService();
