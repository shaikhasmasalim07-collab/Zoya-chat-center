export interface TableItem {
  id: string; // e.g. "table_1", "1"
  tableNumber: number;
  label?: string; // e.g. "Main Floor", "AC Hall", "Family Cabin", "Outdoor", "Counter"
  capacity?: number; // e.g. 2, 4, 6
  isActive: boolean;
  isReserved?: boolean;
}

export type CategoryId = string;

export interface Category {
  id: string;
  name: string;
  iconName: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  image: string;
  images?: string[]; // Multiple photos gallery for this product
  isVeg: boolean;
  isAvailable: boolean;
  isPopular?: boolean;
  isSpicy?: boolean;
  preparationTime?: number; // in minutes
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
  specialNotes?: string;
}

export type OrderStatus = 'new' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderItemDetail {
  id: string;
  name: string;
  price: number;
  quantity: number;
  isVeg: boolean;
  specialNotes?: string;
}

export interface Order {
  id: string; // e.g. ZC1025
  tableNumber: number;
  customerName?: string;
  customerPhone?: string;
  items: OrderItemDetail[];
  totalAmount: number;
  subtotalAmount?: number;
  discountAmount?: number;
  couponCode?: string;
  totalItems: number;
  customerNotes?: string;
  orderTime: string; // ISO string
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid';
  paymentMethod?: 'online' | 'cash';
  selectedUpiApp?: 'phonepe' | 'gpay' | 'paytm' | 'generic_upi';
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number; // e.g., 20 for 20%, or 50 for ₹50 off
  minOrderAmount: number;
  maxDiscount?: number; // max cap for percentage discounts
  isActive: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  tag?: string;
  bgGradient: string; // e.g., 'from-[#516B84] to-[#3A4E60]'
  imageUrl?: string;
  isActive: boolean;
}

export interface AdminSession {
  isActive: boolean;
  activeSessionId: string | null;
  adminEmail: string | null;
  deviceInfo: string | null;
  startedAt: string | null;
  lastHeartbeat: string | null;
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  timing: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  instagramUrl: string;
  mapsUrl: string;
  totalTables: number;
}
