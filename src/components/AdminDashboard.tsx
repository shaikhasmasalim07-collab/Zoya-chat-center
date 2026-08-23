import React, { useState, useEffect, useMemo } from 'react';
import { Order, MenuItem, OrderStatus, Category } from '../types';
import { orderService } from '../services/orderService';
import { OrderCard } from './OrderCard';
import { MenuManager } from './MenuManager';
import { CategoryManager } from './CategoryManager';
import { CouponManager } from './CouponManager';
import { BannerManager } from './BannerManager';
import { InvoiceModal } from './InvoiceModal';
import {
  ChefHat,
  Volume2,
  VolumeX,
  Bell,
  BellRing,
  LayoutGrid,
  ShoppingBag,
  UtensilsCrossed,
  Layers,
  ArrowLeft,
  Search,
  Database,
  CheckCircle2,
  Clock,
  TrendingUp,
  Tag,
  Image as ImageIcon,
  Mail,
  ShieldCheck,
  X,
  History,
  Calendar,
  Filter,
  Receipt,
  FileText,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { playNewOrderAlertSound, playTapSound, unlockAudio } from '../utils/sound';

interface AdminDashboardProps {
  orders: Order[];
  menuItems: MenuItem[];
  categories: Category[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onUpdatePaymentStatus: (orderId: string, status: 'pending' | 'paid') => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  onToggleMenuAvailability: (id: string) => void;
  onResetMenu: () => void;
  onAddCategory: (name: string, iconName: string) => void;
  onDeleteCategory: (id: string) => void;
  onUpdateCategory: (id: string, name: string, iconName: string) => void;
  onResetCategories: () => void;
  onCloseAdmin: () => void;
  onEndSession?: () => void;
  adminEmail?: string;
  onResetSampleOrders: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

type AdminTab = 'orders' | 'history' | 'tables' | 'menu' | 'categories' | 'coupons' | 'banners' | 'firebase';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  menuItems,
  categories,
  onUpdateOrderStatus,
  onUpdatePaymentStatus,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onToggleMenuAvailability,
  onResetMenu,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onResetCategories,
  onCloseAdmin,
  onEndSession,
  adminEmail = 'shaikhshabib71@gmail.com',
  onResetSampleOrders,
  soundEnabled,
  onToggleSound,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('orders');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');
  const [latestAlertOrder, setLatestAlertOrder] = useState<Order | null>(null);
  const [isPlayingTestSound, setIsPlayingTestSound] = useState<boolean>(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Auto unlock audio and listen for live new incoming orders
  useEffect(() => {
    unlockAudio();
    const unsub = orderService.onNewOrder((newOrder) => {
      setLatestAlertOrder(newOrder);
      if (soundEnabled) {
        unlockAudio();
        playNewOrderAlertSound();
      }
    });

    return () => {
      unsub();
    };
  }, [soundEnabled]);

  // Auto dismiss alert toast after 14 seconds
  useEffect(() => {
    if (!latestAlertOrder) return;
    const timer = setTimeout(() => {
      setLatestAlertOrder(null);
    }, 14000);
    return () => clearTimeout(timer);
  }, [latestAlertOrder]);

  const handleTestSound = () => {
    setIsPlayingTestSound(true);
    unlockAudio();
    playNewOrderAlertSound();
    setTimeout(() => {
      setIsPlayingTestSound(false);
    }, 2000);
  };

  // Metrics
  const activeOrders = orders.filter(
    (o) => o.status !== 'completed' && o.status !== 'cancelled'
  );
  const newOrdersCount = orders.filter((o) => o.status === 'new').length;
  const preparingCount = orders.filter((o) => o.status === 'preparing' || o.status === 'accepted').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const totalSales = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    // Status filter
    if (statusFilter === 'active') {
      if (order.status === 'completed' || order.status === 'cancelled') return false;
    } else if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchTable = `table ${order.tableNumber}`.includes(q) || order.tableNumber.toString() === q;
      const matchItem = order.items.some((i) => i.name.toLowerCase().includes(q));
      if (!matchId && !matchTable && !matchItem) return false;
    }

    return true;
  });

  // Filtered historical orders (persistent history tab)
  const historicalOrders = useMemo(() => {
    return orders.filter((order) => {
      const orderDate = new Date(order.orderTime);
      const now = new Date();

      // Date filtering
      if (historyDateFilter === 'today') {
        const isToday =
          orderDate.getDate() === now.getDate() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (historyDateFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday =
          orderDate.getDate() === yesterday.getDate() &&
          orderDate.getMonth() === yesterday.getMonth() &&
          orderDate.getFullYear() === yesterday.getFullYear();
        if (!isYesterday) return false;
      } else if (historyDateFilter === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (orderDate < sevenDaysAgo) return false;
      }

      // Status filtering in history
      if (historyStatusFilter !== 'all') {
        if (historyStatusFilter === 'paid') {
          if (order.paymentStatus !== 'paid') return false;
        } else if (historyStatusFilter === 'pending_payment') {
          if (order.paymentStatus !== 'pending') return false;
        } else if (order.status !== historyStatusFilter) {
          return false;
        }
      }

      // Search filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = order.id.toLowerCase().includes(q);
        const matchTable = `table ${order.tableNumber}`.includes(q) || order.tableNumber.toString() === q;
        const matchCustomer = (order.customerName || '').toLowerCase().includes(q) || (order.customerPhone || '').includes(q);
        const matchItem = order.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchId && !matchTable && !matchItem && !matchCustomer) return false;
      }

      return true;
    });
  }, [orders, historyDateFilter, historyStatusFilter, searchQuery]);

  const historyTotalRevenue = historicalOrders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-[#E6E5E4] pb-12">
      {/* Admin Top Navbar */}
      <nav className="bg-[#516B84] text-white sticky top-0 z-40 px-3 py-2.5 sm:px-6 sm:py-3 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              id="admin-back-to-customer-btn"
              type="button"
              onClick={() => {
                playTapSound();
                onCloseAdmin();
              }}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors flex items-center gap-1 text-xs font-semibold shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Customer Menu</span>
            </button>

            <div className="h-4 w-px bg-white/20 shrink-0" />

            <div className="flex items-center gap-1.5 min-w-0">
              <ChefHat className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="font-bold text-sm sm:text-base tracking-tight font-['Outfit'] truncate">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Admin Email Identifier Badge & Single Device Lock & Sound Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-emerald-600/90 border border-emerald-400/40 px-2 sm:px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-semibold text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span className="truncate max-w-[120px] sm:max-w-none">{adminEmail}</span>
              <span className="hidden lg:inline text-[9px] bg-white/20 px-1 py-0.2 rounded font-normal">
                Single Phone Lock
              </span>
            </div>

            {/* Release Session / Logout button */}
            {onEndSession && (
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  onEndSession();
                }}
                className="px-2 py-1 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                title="End session and release admin lock for other phones"
              >
                <span>Logout</span>
              </button>
            )}

            {/* Test Sound button for phone check */}
            <button
              id="admin-test-sound-btn"
              type="button"
              onClick={handleTestSound}
              className={`p-1.5 sm:py-1.5 sm:px-2 rounded-xl text-xs flex items-center gap-1 transition-all border ${
                isPlayingTestSound
                  ? 'bg-amber-400 text-slate-900 border-amber-300 font-bold scale-105 shadow-sm'
                  : 'bg-white/15 hover:bg-white/25 text-white border-white/20'
              }`}
              title="Test loud kitchen order sound on this phone"
            >
              {isPlayingTestSound ? (
                <BellRing className="w-3.5 h-3.5 animate-bounce text-slate-900" />
              ) : (
                <Bell className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline text-xs font-semibold">
                {isPlayingTestSound ? 'Ringing...' : 'Test Sound'}
              </span>
            </button>

            {/* Audio chime toggle */}
            <button
              id="admin-sound-toggle-btn"
              type="button"
              onClick={() => {
                onToggleSound();
                playTapSound();
              }}
              className={`p-1.5 sm:p-2 rounded-xl text-xs flex items-center gap-1 transition-colors ${
                soundEnabled ? 'bg-emerald-600/90 text-white' : 'bg-white/10 text-white/70'
              }`}
              title={soundEnabled ? 'Order alert sound ON' : 'Order alert sound MUTED'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline text-xs font-medium">
                {soundEnabled ? 'Sound ON' : 'Muted'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Admin Content Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 pt-3 sm:pt-5 space-y-3.5 sm:space-y-4">
        {/* Live Incoming Order Alert Banner (Pop-up with Sound notification) */}
        {latestAlertOrder && (
          <div
            id="admin-live-order-alert-toast"
            className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg border-2 border-amber-300 animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center shrink-0 shadow-md">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-white/25 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    🔔 NAYA ORDER AAYA!
                  </span>
                  <span className="font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded font-bold">
                    #{latestAlertOrder.id}
                  </span>
                </div>
                <div className="text-base sm:text-lg font-bold font-['Outfit'] mt-0.5">
                  Table {latestAlertOrder.tableNumber} · ₹{latestAlertOrder.totalAmount}
                </div>
                <div className="text-xs text-white/90 truncate max-w-md">
                  {latestAlertOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setActiveTab('orders');
                  setStatusFilter('active');
                  setLatestAlertOrder(null);
                }}
                className="px-3.5 py-1.5 bg-white text-slate-900 hover:bg-amber-100 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>View Order</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  setLatestAlertOrder(null);
                }}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/20 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {/* Quick Stats Grid - Compact on Mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-[#d8d6d3] shadow-soft">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase">New Orders</span>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
              {newOrdersCount}
            </span>
            <span className="block text-[10px] text-blue-600 font-medium">Awaiting Chef</span>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-[#d8d6d3] shadow-soft">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase">Cooking</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
              {preparingCount}
            </span>
            <span className="block text-[10px] text-amber-700 font-medium">In Kitchen</span>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-[#d8d6d3] shadow-soft">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase">Ready</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-['Outfit']">
              {readyCount}
            </span>
            <span className="block text-[10px] text-emerald-700 font-medium">Ready to Serve</span>
          </div>

          <div className="bg-white p-2.5 sm:p-3.5 rounded-xl border border-[#d8d6d3] shadow-soft">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] sm:text-xs text-slate-500 font-semibold uppercase">Sales</span>
              <TrendingUp className="w-3.5 h-3.5 text-[#516B84]" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[#516B84] font-['Outfit']">
              ₹{totalSales}
            </span>
            <span className="block text-[10px] text-slate-500 font-medium">
              {orders.length} orders
            </span>
          </div>
        </div>

        {/* Admin Navigation Tabs - Horizontal scrolling with compact buttons */}
        <div className="bg-white rounded-xl p-1 border border-[#d8d6d3] shadow-soft flex gap-1 overflow-x-auto no-scrollbar">
          <button
            id="admin-tab-orders"
            type="button"
            onClick={() => {
              setActiveTab('orders');
              playTapSound();
            }}
            className={`flex-1 min-w-[95px] py-1.5 sm:py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-[#516B84] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#F7F7F6]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
            <span>Orders ({activeOrders.length})</span>
          </button>

          <button
            id="admin-tab-history"
            type="button"
            onClick={() => {
              setActiveTab('history');
              playTapSound();
            }}
            className={`flex-1 min-w-[105px] py-1.5 sm:py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-[#516B84] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#F7F7F6]'
            }`}
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>History ({orders.length})</span>
          </button>

          <button
            id="admin-tab-tables"
            type="button"
            onClick={() => {
              setActiveTab('tables');
              playTapSound();
            }}
            className={`flex-1 min-w-[95px] py-1.5 sm:py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tables'
                ? 'bg-[#516B84] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#F7F7F6]'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
            <span>Tables</span>
          </button>

          <button
            id="admin-tab-menu"
            type="button"
            onClick={() => {
              setActiveTab('menu');
              playTapSound();
            }}
            className={`flex-1 min-w-[105px] py-1.5 sm:py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-[#516B84] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#F7F7F6]'
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
            <span>Products</span>
          </button>

          <button
            id="admin-tab-categories"
            type="button"
            onClick={() => {
              setActiveTab('categories');
              playTapSound();
            }}
            className={`flex-1 min-w-[105px] py-1.5 sm:py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'bg-[#516B84] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#F7F7F6]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>Categories ({categories.length - 1})</span>
          </button>

          <button
            id="admin-tab-coupons"
            type="button"
            onClick={() => {
              setActiveTab('coupons');
              playTapSound();
            }}
            className={`flex-1 min-w-[95px] py-1.5 sm:py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'coupons'
                ? 'bg-[#516B84] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#F7F7F6]'
            }`}
          >
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span>Coupons</span>
          </button>

          <button
            id="admin-tab-banners"
            type="button"
            onClick={() => {
              setActiveTab('banners');
              playTapSound();
            }}
            className={`flex-1 min-w-[95px] py-1.5 sm:py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'banners'
                ? 'bg-[#516B84] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#F7F7F6]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Banners</span>
          </button>

          <button
            id="admin-tab-firebase"
            type="button"
            onClick={() => {
              setActiveTab('firebase');
              playTapSound();
            }}
            className={`flex-1 min-w-[90px] py-1.5 sm:py-2 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'firebase'
                ? 'bg-[#516B84] text-white shadow-xs'
                : 'text-slate-700 hover:bg-[#F7F7F6]'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>DB Sync</span>
          </button>
        </div>

        {/* Tab 1: Live Orders View */}
        {activeTab === 'orders' && (
          <div className="space-y-3 sm:space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#d8d6d3] shadow-soft flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {/* Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
                {[
                  { id: 'active', label: `Active (${activeOrders.length})` },
                  { id: 'new', label: `New (${newOrdersCount})` },
                  { id: 'preparing', label: `Cooking (${preparingCount})` },
                  { id: 'ready', label: `Ready (${readyCount})` },
                  { id: 'completed', label: `Done (${completedOrders.length})` },
                  { id: 'all', label: `All (${orders.length})` },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(pill.id);
                      playTapSound();
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-colors border ${
                      statusFilter === pill.id
                        ? 'bg-[#516B84] text-white border-[#516B84]'
                        : 'bg-[#F7F7F6] text-slate-700 border-slate-200 hover:bg-[#E6E5E4]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order ID, table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                />
              </div>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-[#d8d6d3] shadow-soft">
                <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm sm:text-base font-bold text-slate-700 font-['Outfit']">
                  No orders in this view
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                  New incoming customer orders placed at tables will appear here in real-time.
                </p>
                <button
                  type="button"
                  onClick={onResetSampleOrders}
                  className="px-3.5 py-1.5 bg-[#516B84] text-white rounded-lg text-xs font-semibold hover:bg-[#3E5367] transition-colors"
                >
                  Load Sample Orders
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onUpdateStatus={onUpdateOrderStatus}
                    onUpdatePayment={onUpdatePaymentStatus}
                    onOpenInvoice={(ord) => setSelectedInvoiceOrder(ord)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 1.5: Persistent Order History View */}
        {activeTab === 'history' && (
          <div className="space-y-3 sm:space-y-4 animate-fadeIn">
            {/* History Header & Firestore Save Indicator */}
            <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#d8d6d3] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-[#516B84] font-['Outfit']">
                    Saved Order History
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Permanent Cloud Firestore
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Saare past orders permanently saved rehte hain aur kabhi delete nahi hote.
                </p>
              </div>

              {/* Quick Summary Pill on Header */}
              <div className="flex items-center gap-2 bg-[#F7F7F6] px-3 py-2 rounded-xl border border-[#d8d6d3] self-start md:self-auto">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Filtered Total</span>
                  <span className="text-sm font-bold text-[#516B84] font-['Outfit']">₹{historyTotalRevenue}</span>
                </div>
                <div className="h-6 w-px bg-slate-300 mx-1" />
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Orders</span>
                  <span className="text-sm font-bold text-slate-800 font-['Outfit']">{historicalOrders.length}</span>
                </div>
              </div>
            </div>

            {/* Filter Bar: Date & Status & Search */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-[#d8d6d3] shadow-soft space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Date Filter Buttons */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Date:
                  </span>
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: 'yesterday', label: 'Yesterday' },
                    { id: 'week', label: 'Last 7 Days' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => {
                        setHistoryDateFilter(filter.id as any);
                        playTapSound();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        historyDateFilter === filter.id
                          ? 'bg-[#516B84] text-white border-[#516B84] shadow-xs'
                          : 'bg-[#F7F7F6] text-slate-700 border-slate-200 hover:bg-[#E6E5E4]'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> Status:
                  </span>
                  {[
                    { id: 'all', label: 'All Status' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'paid', label: 'Paid' },
                    { id: 'pending_payment', label: 'Pending Payment' },
                    { id: 'cancelled', label: 'Cancelled' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setHistoryStatusFilter(st.id);
                        playTapSound();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                        historyStatusFilter === st.id
                          ? 'bg-[#516B84] text-white border-[#516B84] shadow-xs'
                          : 'bg-[#F7F7F6] text-slate-700 border-slate-200 hover:bg-[#E6E5E4]'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* History Search Box */}
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search history by order ID (#ZC...), table number, dish name, customer phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-[#F7F7F6] border border-[#d8d6d3] rounded-lg focus:outline-none focus:border-[#516B84]"
                />
              </div>
            </div>

            {/* Historical Orders List Table */}
            {historicalOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 sm:p-12 text-center border border-[#d8d6d3] shadow-soft">
                <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="text-sm sm:text-base font-bold text-slate-700 font-['Outfit']">
                  No matching orders found in history
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                  Try clearing your search query or changing date filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryDateFilter('all');
                    setHistoryStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-3 py-1.5 bg-[#516B84] text-white rounded-lg text-xs font-semibold"
                >
                  Reset History Filters
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {historicalOrders.map((order) => {
                  const orderDate = new Date(order.orderTime);
                  const formattedTime = orderDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  });
                  const formattedDate = orderDate.toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl p-3 sm:p-4 border border-[#d8d6d3] shadow-soft hover:border-[#516B84] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      {/* Left: Basic Info & Items */}
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-[#516B84] bg-[#EBF0F5] px-2 py-0.5 rounded-md">
                            #{order.id}
                          </span>
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                            Table {order.tableNumber}
                          </span>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formattedDate} at {formattedTime}
                          </span>

                          {/* Status Pill */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              order.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {order.status}
                          </span>

                          {/* Payment Pill */}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              order.paymentStatus === 'paid'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {order.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                          </span>
                        </div>

                        {/* Items ordered list */}
                        <div className="text-xs text-slate-700 pt-1">
                          <span className="font-semibold text-slate-900">Items: </span>
                          {order.items.map((it, idx) => (
                            <span key={it.id || idx}>
                              {it.quantity}x {it.name} (₹{it.price * it.quantity})
                              {idx < order.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>

                        {/* Customer note or coupon */}
                        {(order.customerNotes || order.couponCode) && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-0.5">
                            {order.couponCode && (
                              <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-mono font-bold">
                                Coupon: {order.couponCode} (-₹{order.discountAmount || 0})
                              </span>
                            )}
                            {order.customerNotes && (
                              <span className="italic truncate">Note: "{order.customerNotes}"</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Bill Total & Invoice Generator Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-right">
                          <span className="text-lg font-bold text-[#516B84] font-['Outfit'] block">
                            ₹{order.totalAmount}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {order.totalItems} items · {order.paymentMethod === 'cash' ? 'Cash' : 'Online UPI'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            playTapSound();
                            setSelectedInvoiceOrder(order);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#516B84] hover:bg-[#3E5367] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>View Invoice</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Table Matrix View */}
        {activeTab === 'tables' && (
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#d8d6d3] shadow-soft space-y-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#516B84] font-['Outfit']">
                Restaurant Floor Matrix (10 Tables)
              </h3>
              <p className="text-xs text-slate-500">
                Visual status of active table sessions, pending food items, and total bills.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((tNum) => {
                const tableActiveOrders = orders.filter(
                  (o) => o.tableNumber === tNum && o.status !== 'completed' && o.status !== 'cancelled'
                );
                const isOccupied = tableActiveOrders.length > 0;
                const billTotal = tableActiveOrders.reduce((sum, o) => sum + o.totalAmount, 0);

                return (
                  <div
                    key={tNum}
                    className={`rounded-xl p-3 border text-center transition-all flex flex-col justify-between ${
                      isOccupied
                        ? 'bg-[#EBF0F5] border-[#516B84] shadow-xs'
                        : 'bg-[#F7F7F6] border-[#d8d6d3] opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400">
                          Table
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isOccupied ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                          }`}
                        />
                      </div>
                      <span className="text-2xl font-bold text-slate-800 font-['Outfit'] block mb-1">
                        {tNum}
                      </span>
                    </div>

                    <div className="pt-1.5 border-t border-slate-200/60 text-xs">
                      {isOccupied ? (
                        <>
                          <span className="font-bold text-[#516B84] block font-['Outfit'] text-xs">
                            ₹{billTotal}
                          </span>
                          <span className="text-[9px] text-slate-600 block">
                            {tableActiveOrders.length} {tableActiveOrders.length === 1 ? 'order' : 'orders'}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400">Available</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Menu / Products Catalog */}
        {activeTab === 'menu' && (
          <MenuManager
            items={menuItems}
            categories={categories}
            onAddItem={onAddMenuItem}
            onUpdateItem={onUpdateMenuItem}
            onDeleteItem={onDeleteMenuItem}
            onToggleAvailability={onToggleMenuAvailability}
            onResetMenu={onResetMenu}
            onAddCategory={onAddCategory}
          />
        )}

        {/* Tab 3.5: Categories Manager */}
        {activeTab === 'categories' && (
          <CategoryManager
            categories={categories}
            menuItems={menuItems}
            onAddCategory={onAddCategory}
            onDeleteCategory={onDeleteCategory}
            onUpdateCategory={onUpdateCategory}
            onResetCategories={onResetCategories}
          />
        )}

        {/* Tab 4: Coupons Manager */}
        {activeTab === 'coupons' && <CouponManager />}

        {/* Tab 5: Promo Banners Manager */}
        {activeTab === 'banners' && <BannerManager />}

        {/* Tab 6: Database & Firebase Architecture Information */}
        {activeTab === 'firebase' && (
          <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#d8d6d3] shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#516B84] font-['Outfit'] flex items-center gap-2">
                    <span>Firebase Cloud Firestore</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Connected
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Project: <strong className="text-slate-800">zoya-chat-center</strong> · Cloud Sync Active
                  </p>
                </div>
              </div>
            </div>

            {/* Quick config preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-[#F7F7F6] p-3 rounded-lg border border-[#d8d6d3]">
                <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Project ID</span>
                <span className="text-xs font-mono font-bold text-slate-800">zoya-chat-center</span>
              </div>
              <div className="bg-[#F7F7F6] p-3 rounded-lg border border-[#d8d6d3]">
                <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Collections</span>
                <span className="text-xs font-mono font-bold text-[#516B84]">/orders, /menu_items, /coupons, /promo_banners</span>
              </div>
              <div className="bg-[#F7F7F6] p-3 rounded-lg border border-[#d8d6d3]">
                <span className="text-[9px] uppercase font-bold text-slate-500 block mb-0.5">Real-time Stream</span>
                <span className="text-xs font-mono font-bold text-emerald-700">Firestore onSnapshot</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200 text-xs leading-relaxed space-y-1.5">
              <p className="font-semibold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Cloud Firestore is live!</span>
              </p>
              <p className="text-emerald-900 text-[11px]">
                Orders, Menu Products, Coupons, and Banners are saved in Firebase Firestore and automatically synchronized across all customer table devices and kitchen screens in real time.
              </p>
            </div>
          </div>
        )}

        {/* Invoice Generator & WhatsApp Modal */}
        {selectedInvoiceOrder && (
          <InvoiceModal
            order={selectedInvoiceOrder}
            isOpen={Boolean(selectedInvoiceOrder)}
            onClose={() => setSelectedInvoiceOrder(null)}
          />
        )}
      </div>
    </div>
  );
};
