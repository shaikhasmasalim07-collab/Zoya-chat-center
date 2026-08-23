import { Order, OrderItemDetail, OrderStatus } from '../types';
import { db, USE_FIREBASE } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore';

const ORDERS_STORAGE_KEY = 'zoya_orders_v1';
const ORDER_COUNTER_KEY = 'zoya_order_counter_v1';
const ORDERS_CHANNEL = 'zoya_orders_sync_channel';

// Initial sample orders for preview/admin demonstration
const INITIAL_DEMO_ORDERS: Order[] = [
  {
    id: 'ZC1021',
    tableNumber: 3,
    items: [
      { id: 'chaat-1', name: 'Special Dahi Puri', price: 60, quantity: 2, isVeg: true },
      { id: 'pav-1', name: 'Special Butter Pav Bhaji', price: 110, quantity: 1, isVeg: true, specialNotes: 'Extra spicy bhaji' },
    ],
    totalAmount: 230,
    totalItems: 3,
    customerNotes: 'Please serve quickly, thank you!',
    orderTime: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    status: 'preparing',
    paymentStatus: 'pending',
    paymentMethod: 'online',
    selectedUpiApp: 'phonepe',
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'ZC1022',
    tableNumber: 7,
    items: [
      { id: 'burger-2', name: 'Peri Peri Burger', price: 99, quantity: 2, isVeg: true },
      { id: 'fry-2', name: 'Peri Peri Fries', price: 85, quantity: 1, isVeg: true },
      { id: 'bev-2', name: 'Cold Coffee with Ice Cream', price: 60, quantity: 2, isVeg: true },
    ],
    totalAmount: 403,
    totalItems: 5,
    orderTime: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    status: 'accepted',
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'ZC1023',
    tableNumber: 2,
    items: [
      { id: 'momo-1', name: 'Kurkure Momos', price: 110, quantity: 1, isVeg: true },
      { id: 'chin-1', name: 'Veg Hakka Noodles', price: 100, quantity: 1, isVeg: true },
    ],
    totalAmount: 210,
    totalItems: 2,
    orderTime: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    status: 'new',
    paymentStatus: 'pending',
    paymentMethod: 'online',
    selectedUpiApp: 'gpay',
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
  }
];

class OrderService {
  private orders: Order[] = [];
  private listeners: Set<(orders: Order[]) => void> = new Set();
  private newOrderListeners: Set<(order: Order) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private currentCounter = 1024;
  private isFirestoreConnected = false;
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
        this.broadcastChannel = new BroadcastChannel(ORDERS_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'ORDERS_UPDATED') {
            this.orders = event.data.payload;
            this.notify();
          } else if (event.data?.type === 'NEW_ORDER_CREATED') {
            const order: Order = event.data.payload;
            this.newOrderListeners.forEach((cb) => cb(order));
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }
  }

  private initFirestoreSync() {
    try {
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, orderBy('orderTime', 'desc'));

      let initialLoadDone = false;

      this.unsubscribeFirestore = onSnapshot(
        ordersQuery,
        (snapshot) => {
          this.isFirestoreConnected = true;
          const remoteOrders: Order[] = [];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            remoteOrders.push({
              id: docSnap.id,
              tableNumber: Number(data.tableNumber) || 1,
              customerName: data.customerName || undefined,
              customerPhone: data.customerPhone || undefined,
              items: data.items || [],
              totalAmount: Number(data.totalAmount) || 0,
              subtotalAmount: data.subtotalAmount ? Number(data.subtotalAmount) : Number(data.totalAmount) || 0,
              discountAmount: data.discountAmount ? Number(data.discountAmount) : 0,
              couponCode: data.couponCode || undefined,
              totalItems: Number(data.totalItems) || 0,
              customerNotes: data.customerNotes || undefined,
              orderTime: data.orderTime || new Date().toISOString(),
              status: data.status || 'new',
              paymentStatus: data.paymentStatus || 'pending',
              paymentMethod: data.paymentMethod || 'online',
              selectedUpiApp: data.selectedUpiApp || undefined,
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          });

          // Detect new orders for audio alert after initial load
          if (initialLoadDone && snapshot.docChanges) {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const newDocData = change.doc.data();
                const newOrderObj: Order = {
                  id: change.doc.id,
                  tableNumber: Number(newDocData.tableNumber) || 1,
                  customerName: newDocData.customerName || undefined,
                  customerPhone: newDocData.customerPhone || undefined,
                  items: newDocData.items || [],
                  totalAmount: Number(newDocData.totalAmount) || 0,
                  totalItems: Number(newDocData.totalItems) || 0,
                  customerNotes: newDocData.customerNotes || undefined,
                  orderTime: newDocData.orderTime || new Date().toISOString(),
                  status: newDocData.status || 'new',
                  paymentStatus: newDocData.paymentStatus || 'pending',
                  updatedAt: newDocData.updatedAt || new Date().toISOString(),
                };
                this.newOrderListeners.forEach((cb) => cb(newOrderObj));
              }
            });
          }

          if (remoteOrders.length > 0 || initialLoadDone) {
            this.orders = remoteOrders;
            this.persistLocalOnly();
            this.notify();
          }

          initialLoadDone = true;
        },
        (error) => {
          console.warn('Firestore orders sync notice (will use local storage sync):', error.message);
          this.isFirestoreConnected = false;
        }
      );
    } catch (err) {
      console.warn('Failed to initialize Firestore listener:', err);
    }
  }

  private loadInitialData() {
    if (typeof window === 'undefined') {
      this.orders = [...INITIAL_DEMO_ORDERS];
      return;
    }

    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      const storedCounter = localStorage.getItem(ORDER_COUNTER_KEY);

      if (storedCounter) {
        this.currentCounter = parseInt(storedCounter, 10) || 1024;
      }

      if (stored) {
        this.orders = JSON.parse(stored);
      } else {
        this.orders = [...INITIAL_DEMO_ORDERS];
        this.persistLocalOnly();
      }
    } catch (e) {
      console.error('Error reading orders from localStorage:', e);
      this.orders = [...INITIAL_DEMO_ORDERS];
    }
  }

  private persistLocalOnly() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.orders));
      localStorage.setItem(ORDER_COUNTER_KEY, this.currentCounter.toString());
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'ORDERS_UPDATED',
          payload: this.orders,
        });
      }
    } catch (e) {
      console.error('Error saving orders locally:', e);
    }
  }

  private notify() {
    this.listeners.forEach((callback) => callback([...this.orders]));
  }

  private generateOrderId(): string {
    const timestampSuffix = Date.now().toString().slice(-4);
    this.currentCounter += 1;
    return `ZC${this.currentCounter > 9999 ? timestampSuffix : this.currentCounter}`;
  }

  public getOrders(): Order[] {
    return [...this.orders];
  }

  public isCloudConnected(): boolean {
    return this.isFirestoreConnected;
  }

  public getActiveOrdersForTable(tableNumber: number): Order[] {
    return this.orders.filter(
      (order) => order.tableNumber === tableNumber && order.status !== 'completed' && order.status !== 'cancelled'
    );
  }

  public getAllOrdersForTable(tableNumber: number): Order[] {
    return this.orders.filter((order) => order.tableNumber === tableNumber);
  }

  public getOrderById(orderId: string): Order | undefined {
    return this.orders.find((order) => order.id === orderId);
  }

  public async createOrder(
    tableNumber: number,
    items: OrderItemDetail[],
    customerNotes?: string,
    discountAmount: number = 0,
    couponCode?: string,
    paymentMethod: 'online' | 'cash' = 'online',
    selectedUpiApp?: 'phonepe' | 'gpay' | 'paytm' | 'generic_upi',
    customerName?: string,
    customerPhone?: string
  ): Promise<Order> {
    const subtotalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = Math.max(0, subtotalAmount - discountAmount);
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: this.generateOrderId(),
      tableNumber,
      customerName: customerName?.trim() || undefined,
      customerPhone: customerPhone?.trim() || undefined,
      items,
      subtotalAmount,
      discountAmount,
      couponCode: couponCode || undefined,
      totalAmount,
      totalItems,
      customerNotes: customerNotes?.trim() || undefined,
      orderTime: now,
      status: 'new',
      paymentStatus: 'pending',
      paymentMethod,
      selectedUpiApp,
      updatedAt: now,
    };

    // Optimistic Local update (Instantaneous)
    this.orders.unshift(newOrder);
    this.persistLocalOnly();
    this.notify();

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'NEW_ORDER_CREATED',
          payload: newOrder,
        });
      } catch (e) {
        console.warn('BroadcastChannel error:', e);
      }
    }

    this.newOrderListeners.forEach((cb) => {
      try {
        cb(newOrder);
      } catch (e) {
        console.warn('Listener error:', e);
      }
    });

    // Save to Firestore Cloud Database in background (non-blocking so UI never hangs on 'Sending')
    if (USE_FIREBASE) {
      const orderPayload: Record<string, any> = {
        id: newOrder.id,
        tableNumber: newOrder.tableNumber,
        customerName: newOrder.customerName || '',
        customerPhone: newOrder.customerPhone || '',
        items: newOrder.items.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          isVeg: it.isVeg,
          specialNotes: it.specialNotes || '',
        })),
        subtotalAmount: newOrder.subtotalAmount,
        discountAmount: newOrder.discountAmount || 0,
        couponCode: newOrder.couponCode || '',
        totalAmount: newOrder.totalAmount,
        totalItems: newOrder.totalItems,
        customerNotes: newOrder.customerNotes || '',
        orderTime: newOrder.orderTime,
        status: newOrder.status,
        paymentStatus: newOrder.paymentStatus,
        paymentMethod: newOrder.paymentMethod || 'online',
        selectedUpiApp: newOrder.selectedUpiApp || '',
        updatedAt: newOrder.updatedAt,
      };

      setDoc(doc(db, 'orders', newOrder.id), orderPayload)
        .then(() => {
          console.log(`✅ Order ${newOrder.id} saved to Firestore.`);
        })
        .catch((err) => {
          console.warn('Background Firestore save notice (order is safe locally):', err);
        });
    }

    return newOrder;
  }

  public async updatePaymentMethod(
    orderId: string,
    paymentMethod: 'online' | 'cash',
    selectedUpiApp?: 'phonepe' | 'gpay' | 'paytm' | 'generic_upi'
  ): Promise<boolean> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return false;

    const now = new Date().toISOString();
    order.paymentMethod = paymentMethod;
    if (selectedUpiApp) {
      order.selectedUpiApp = selectedUpiApp;
    }
    order.updatedAt = now;
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          paymentMethod,
          ...(selectedUpiApp ? { selectedUpiApp } : {}),
          updatedAt: now,
        });
      } catch (err) {
        console.error('Error updating paymentMethod in Firestore:', err);
      }
    }

    return true;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return false;

    const now = new Date().toISOString();
    order.status = status;
    order.updatedAt = now;
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          status,
          updatedAt: now,
        });
        console.log(`✅ Order ${orderId} status updated to ${status} in Firestore.`);
      } catch (err) {
        console.error('Error updating order status in Firestore:', err);
      }
    }

    return true;
  }

  public async updatePaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid'): Promise<boolean> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return false;

    const now = new Date().toISOString();
    order.paymentStatus = paymentStatus;
    order.updatedAt = now;
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        await updateDoc(doc(db, 'orders', orderId), {
          paymentStatus,
          updatedAt: now,
        });
      } catch (err) {
        console.error('Error updating payment status in Firestore:', err);
      }
    }

    return true;
  }

  public async resetToSampleOrders(): Promise<void> {
    this.orders = [...INITIAL_DEMO_ORDERS];
    this.currentCounter = 1024;
    this.persistLocalOnly();
    this.notify();

    if (USE_FIREBASE) {
      try {
        for (const o of INITIAL_DEMO_ORDERS) {
          await setDoc(doc(db, 'orders', o.id), {
            ...o,
            customerNotes: o.customerNotes || '',
          });
        }
      } catch (e) {
        console.warn('Notice saving sample orders to Firestore:', e);
      }
    }
  }

  public subscribe(callback: (orders: Order[]) => void): () => void {
    this.listeners.add(callback);
    callback([...this.orders]);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public onNewOrder(callback: (order: Order) => void): () => void {
    this.newOrderListeners.add(callback);
    return () => {
      this.newOrderListeners.delete(callback);
    };
  }
}

export const orderService = new OrderService();
