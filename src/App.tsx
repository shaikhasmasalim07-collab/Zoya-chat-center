import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { MenuItem, CategoryId, Category, CartItem, Order, OrderStatus, UserProfile } from './types';
import { menuService } from './services/menuService';
import { orderService } from './services/orderService';
import { categoryService } from './services/categoryService';
import { authService } from './services/authService';
import { Header } from './components/Header';
import { TableSelector } from './components/TableSelector';
import { CategoryTabs } from './components/CategoryTabs';
import { FoodCard } from './components/FoodCard';
import { CartSheet } from './components/CartSheet';
import { FloatingCartBar } from './components/FloatingCartBar';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderSuccessView } from './components/OrderSuccessView';
import { ActiveOrdersModal } from './components/ActiveOrdersModal';
import { PromoCarousel } from './components/PromoCarousel';
import { ReviewsSection } from './components/ReviewsSection';
import { AdminDashboard } from './components/AdminDashboard';
import { SplashScreen } from './components/SplashScreen';
import { Footer } from './components/Footer';
import { playNewOrderAlertSound, playTapSound, unlockAudio } from './utils/sound';
import { Search, Sparkles, Utensils, X } from 'lucide-react';
import { RESTAURANT_DETAILS } from './data/restaurantInfo';
import { PaymentAppType } from './utils/paymentUtils';
import { formatOrderWhatsAppInvoice, getWhatsAppDirectUrl } from './utils/invoiceGenerator';
import { firestoreSyncService } from './services/firestoreSyncService';

const TABLE_STORAGE_KEY = 'zoya_active_table_v1';
const CART_STORAGE_KEY = 'zoya_active_cart_v1';

export default function App() {
  // State: 2.5-second Splash Screen on initial load
  const [showSplash, setShowSplash] = useState(true);

  // State: Table selection
  const [selectedTable, setSelectedTable] = useState<number | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(TABLE_STORAGE_KEY);
      return stored ? parseInt(stored, 10) : null;
    } catch {
      return null;
    }
  });
  const [isChangingTable, setIsChangingTable] = useState(false);

  // State: Menu & Categories & Filtering
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => menuService.getMenuItems());
  const [categories, setCategories] = useState<Category[]>(() => categoryService.getCategories());
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);

  // State: Cart
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pendingCustomerNotes, setPendingCustomerNotes] = useState('');
  const [pendingCustomerName, setPendingCustomerName] = useState<string | undefined>(undefined);
  const [pendingCustomerPhone, setPendingCustomerPhone] = useState<string | undefined>(undefined);
  const [pendingDiscountAmount, setPendingDiscountAmount] = useState(0);
  const [pendingCouponCode, setPendingCouponCode] = useState<string | undefined>(undefined);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<'online' | 'cash'>('online');
  const [pendingSelectedUpiApp, setPendingSelectedUpiApp] = useState<PaymentAppType>('phonepe');

  // State: Orders & Real-time lifecycle
  const [orders, setOrders] = useState<Order[]>(() => orderService.getOrders());
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [activeSuccessOrder, setActiveSuccessOrder] = useState<Order | null>(null);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // State: User Auth & Admin Panel
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => authService.getCurrentUser());
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Sync menu, categories, and orders
  useEffect(() => {
    firestoreSyncService.autoSeedIfEmpty();

    const unsubAuth = authService.subscribe((user) => {
      setCurrentUser(user);
    });

    const unsubMenu = menuService.subscribe((items) => {
      setMenuItems(items);
    });

    const unsubCategories = categoryService.subscribe((cats) => {
      setCategories(cats);
    });

    const unsubOrders = orderService.subscribe((allOrders) => {
      setOrders(allOrders);

      // Keep active success order updated with latest status from kitchen
      setActiveSuccessOrder((prev) => {
        if (!prev) return null;
        const updated = allOrders.find((o) => o.id === prev.id);
        return updated || prev;
      });
    });

    const unsubNewOrderAudio = orderService.onNewOrder((_newOrder) => {
      if (soundEnabled) {
        unlockAudio();
        playNewOrderAlertSound();
      }
    });

    return () => {
      unsubAuth();
      unsubMenu();
      unsubCategories();
      unsubOrders();
      unsubNewOrderAudio();
    };
  }, [soundEnabled]);

  // Persist Table and Cart changes
  useEffect(() => {
    try {
      if (selectedTable !== null) {
        localStorage.setItem(TABLE_STORAGE_KEY, selectedTable.toString());
      } else {
        localStorage.removeItem(TABLE_STORAGE_KEY);
      }
    } catch (e) {
      // Ignore storage errors in restrictive environments
    }
  }, [selectedTable]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      // Ignore storage errors
    }
  }, [cartItems]);

  // Active orders for this table
  const activeOrdersForTable = useMemo(() => {
    if (selectedTable === null) return [];
    return orders.filter(
      (o) => o.tableNumber === selectedTable && o.status !== 'completed' && o.status !== 'cancelled'
    );
  }, [orders, selectedTable]);

  const allOrdersForTable = useMemo(() => {
    if (selectedTable === null) return [];
    return orders.filter((o) => o.tableNumber === selectedTable);
  }, [orders, selectedTable]);

  // Cart calculations
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, ci) => sum + ci.quantity, 0);
  }, [cartItems]);

  const totalCartAmount = useMemo(() => {
    return cartItems.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0);
  }, [cartItems]);

  // Category items count lookup
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: menuItems.length,
    };
    categories.forEach((cat) => {
      if (cat.id !== 'all') {
        counts[cat.id] = menuItems.filter((m) => m.category === cat.id).length;
      }
    });
    return counts;
  }, [menuItems, categories]);

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      // Veg filter
      if (vegOnly && !item.isVeg) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesDesc = item.description.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [menuItems, activeCategory, vegOnly, searchQuery]);

  // Cart Actions
  const handleAddToCart = (item: MenuItem, quantity: number) => {
    setCartItems((prev) => {
      const existingIndex = prev.findIndex((ci) => ci.item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      } else {
        return [...prev, { item, quantity }];
      }
    });
  };

  const handleUpdateCartQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveCartItem(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity: newQuantity } : ci))
    );
  };

  const handleRemoveCartItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((ci) => ci.item.id !== itemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Order Placement
  const handleProceedToConfirm = (
    customerNotes?: string,
    discountAmount: number = 0,
    couponCode?: string,
    paymentMethod: 'online' | 'cash' = 'online',
    selectedUpiApp: PaymentAppType = 'phonepe',
    customerName?: string,
    customerPhone?: string
  ) => {
    setPendingCustomerNotes(customerNotes || '');
    setPendingCustomerName(customerName?.trim() || undefined);
    setPendingCustomerPhone(customerPhone?.trim() || undefined);
    setPendingDiscountAmount(discountAmount);
    setPendingCouponCode(couponCode);
    setPendingPaymentMethod(paymentMethod);
    setPendingSelectedUpiApp(selectedUpiApp);
    setIsCartOpen(false);
    setIsConfirmModalOpen(true);
  };

  const handleFinalConfirmOrder = async () => {
    if (selectedTable === null || cartItems.length === 0 || isSubmittingOrder) return;

    setIsSubmittingOrder(true);

    try {
      const orderItems = cartItems.map((ci) => ({
        id: ci.item.id,
        name: ci.item.name,
        price: ci.item.price,
        quantity: ci.quantity,
        isVeg: ci.item.isVeg,
        specialNotes: ci.specialNotes,
      }));

      const newOrder = await orderService.createOrder(
        selectedTable,
        orderItems,
        pendingCustomerNotes,
        pendingDiscountAmount,
        pendingCouponCode,
        pendingPaymentMethod,
        pendingSelectedUpiApp,
        pendingCustomerName,
        pendingCustomerPhone
      );

      // Instant UI transition - zero delays or getting stuck
      setCartItems([]);
      setIsConfirmModalOpen(false);
      setIsSubmittingOrder(false);
      setActiveSuccessOrder(newOrder);
      playNewOrderAlertSound();

      // Direct WhatsApp Integration: Send full formatted order details directly to owner WhatsApp
      try {
        const waMessage = formatOrderWhatsAppInvoice(newOrder, pendingCustomerName, pendingCustomerPhone);
        const waUrl = getWhatsAppDirectUrl(RESTAURANT_DETAILS.whatsapp, waMessage);
        
        // Open WhatsApp directly in new window/tab or app
        window.open(waUrl, '_blank');
      } catch (waErr) {
        console.warn('Could not auto-open WhatsApp URL:', waErr);
      }
    } catch (err) {
      console.error('Failed to submit order:', err);
      setIsSubmittingOrder(false);
    }
  };

  // Table confirmation
  const handleTableConfirm = (tableNum: number) => {
    setSelectedTable(tableNum);
    setIsChangingTable(false);
  };

  // Admin Actions
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await orderService.updateOrderStatus(orderId, status);
  };

  const handleUpdatePaymentStatus = async (orderId: string, status: 'pending' | 'paid') => {
    await orderService.updatePaymentStatus(orderId, status);
  };

  const handleAddMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    await menuService.addMenuItem(item);
  };

  const handleUpdateMenuItem = async (item: MenuItem) => {
    await menuService.updateMenuItem(item);
  };

  const handleDeleteMenuItem = async (id: string) => {
    await menuService.deleteMenuItem(id);
  };

  const handleToggleMenuAvailability = async (id: string) => {
    await menuService.toggleAvailability(id);
  };

  const handleResetMenu = () => {
    menuService.resetToDefault();
  };

  const handleAddCategory = async (name: string, iconName: string) => {
    await categoryService.addCategory(name, iconName);
  };

  const handleDeleteCategory = async (id: string) => {
    await categoryService.deleteCategory(id);
  };

  const handleUpdateCategory = async (id: string, name: string, iconName: string) => {
    await categoryService.updateCategory(id, name, iconName);
  };

  const handleResetCategories = () => {
    categoryService.resetToDefault();
  };

  const handleResetSampleOrders = () => {
    orderService.resetToSampleOrders();
  };

  // If Admin Panel is opened by authorized admin
  if (isAdminOpen) {
    return (
      <AdminDashboard
        orders={orders}
        menuItems={menuItems}
        categories={categories}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onUpdatePaymentStatus={handleUpdatePaymentStatus}
        onAddMenuItem={handleAddMenuItem}
        onUpdateMenuItem={handleUpdateMenuItem}
        onDeleteMenuItem={handleDeleteMenuItem}
        onToggleMenuAvailability={handleToggleMenuAvailability}
        onResetMenu={handleResetMenu}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        onUpdateCategory={handleUpdateCategory}
        onResetCategories={handleResetCategories}
        onCloseAdmin={() => setIsAdminOpen(false)}
        onEndSession={() => {
          authService.logout();
          setIsAdminOpen(false);
        }}
        adminEmail={currentUser?.email || 'shaikhshabib71@gmail.com'}
        onResetSampleOrders={handleResetSampleOrders}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((prev) => !prev)}
      />
    );
  }

  return (
    <div id="zoya-app-root" className="min-h-screen flex flex-col bg-[#E6E5E4] text-[#1E293B]">
      {/* Top Header (Clean customer topbar without admin buttons) */}
      <Header
        tableNumber={selectedTable}
        cartItemCount={totalCartCount}
        activeOrderCount={activeOrdersForTable.length}
        onOpenCart={() => {
          playTapSound();
          setIsCartOpen(true);
        }}
        onSelectTable={() => {
          playTapSound();
          setIsChangingTable(true);
        }}
        onOpenOrderTracker={() => {
          playTapSound();
          setIsOrderTrackerOpen(true);
        }}
      />

      {/* Main Content Flow */}
      <main className="flex-grow">
        {/* Step 1: Table Selector (if no table selected or user clicked change table) */}
        {(selectedTable === null || isChangingTable) ? (
          <TableSelector
            currentTable={selectedTable}
            totalTables={10}
            onConfirmTable={handleTableConfirm}
            onCancel={selectedTable !== null ? () => setIsChangingTable(false) : undefined}
          />
        ) : activeSuccessOrder ? (
          /* Step 3: Order Placed Successfully Screen */
          <OrderSuccessView
            order={activeSuccessOrder}
            onOrderMore={() => setActiveSuccessOrder(null)}
            onRefreshStatus={() => {
              const updated = orderService.getOrderById(activeSuccessOrder.id);
              if (updated) setActiveSuccessOrder(updated);
            }}
          />
        ) : (
          /* Step 2: Food Menu Browsing */
          <div id="food-menu-page" className="animate-fadeIn">
            {/* Search & Welcome Sub-Header */}
            <div className="max-w-5xl mx-auto px-3 sm:px-4 pt-3 pb-1.5">
              {/* Promo Banner Carousel */}
              <PromoCarousel />

              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl font-bold text-[#516B84] font-['Outfit'] truncate">
                    Menu · Table {selectedTable}
                  </h1>
                  <p className="text-[11px] text-slate-500 truncate">
                    Fresh chaats & snacks prepared hot
                  </p>
                </div>

                {/* Quick Pure-Veg Filter Toggle */}
                <button
                  id="pure-veg-filter-btn"
                  type="button"
                  onClick={() => {
                    playTapSound();
                    setVegOnly((v) => !v);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 border transition-all shrink-0 ${
                    vegOnly
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-[#d8d6d3] hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      vegOnly ? 'bg-white' : 'bg-emerald-600'
                    }`}
                  />
                  <span>Veg Only</span>
                </button>
              </div>

              {/* Search Bar - Compact */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="food-search-input"
                  type="text"
                  placeholder="Search chaats, pav bhaji, burger, momos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-8 py-2 text-xs sm:text-sm bg-white border border-[#d8d6d3] rounded-xl shadow-xs focus:outline-none focus:border-[#516B84] focus:ring-1 focus:ring-[#516B84] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category Navigation Pills */}
            <CategoryTabs
              categories={categories}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              categoryCounts={categoryCounts}
            />

            {/* Menu Items Grid - 2 columns on mobile for screen coverage, 3 on desktop */}
            <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-5">
              {filteredMenuItems.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-[#d8d6d3] shadow-soft my-3">
                  <Utensils className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <h3 className="text-sm font-bold text-slate-700 font-['Outfit'] mb-1">
                    No items found
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mb-3">
                    We couldn't find any dish matching your search.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setActiveCategory('all');
                      setVegOnly(false);
                    }}
                    className="px-3.5 py-1.5 bg-[#516B84] text-white text-xs font-semibold rounded-lg hover:bg-[#3E5367] transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div
                  id="food-items-grid"
                  className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-4 pb-20"
                >
                  {filteredMenuItems.map((item) => {
                    const cartItem = cartItems.find((ci) => ci.item.id === item.id);
                    const cartQty = cartItem ? cartItem.quantity : 0;

                    return (
                      <FoodCard
                        key={item.id}
                        item={item}
                        cartQuantity={cartQty}
                        onAddToCart={handleAddToCart}
                        onUpdateCartQuantity={(foodItem, newQty) =>
                          handleUpdateCartQuantity(foodItem.id, newQty)
                        }
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Sticky on Mobile) */}
      {!activeSuccessOrder && selectedTable !== null && (
        <FloatingCartBar
          itemCount={totalCartCount}
          totalAmount={totalCartAmount}
          onOpenCart={() => setIsCartOpen(true)}
          tableNumber={selectedTable}
        />
      )}

      {/* Cart Bottom Sheet Modal */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableNumber={selectedTable}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToConfirm={handleProceedToConfirm}
        onSelectTable={() => {
          setIsCartOpen(false);
          setIsChangingTable(true);
        }}
      />

      {/* Order Confirmation Step */}
      {selectedTable !== null && (
        <OrderConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          tableNumber={selectedTable}
          items={cartItems}
          customerNotes={pendingCustomerNotes}
          customerName={pendingCustomerName}
          customerPhone={pendingCustomerPhone}
          discountAmount={pendingDiscountAmount}
          couponCode={pendingCouponCode}
          paymentMethod={pendingPaymentMethod}
          selectedUpiApp={pendingSelectedUpiApp}
          onChangePaymentMethod={setPendingPaymentMethod}
          onSelectUpiApp={setPendingSelectedUpiApp}
          isSubmitting={isSubmittingOrder}
          onConfirm={handleFinalConfirmOrder}
        />
      )}

      {/* Active Table Orders Status Tracker Modal */}
      {selectedTable !== null && (
        <ActiveOrdersModal
          isOpen={isOrderTrackerOpen}
          onClose={() => setIsOrderTrackerOpen(false)}
          orders={allOrdersForTable}
          tableNumber={selectedTable}
          onOrderMore={() => {
            setIsOrderTrackerOpen(false);
            setActiveSuccessOrder(null);
          }}
        />
      )}

      {/* Customer Reviews & Feedback Section (Above Contact Details / Footer) */}
      <ReviewsSection
        tableNumber={selectedTable}
        menuItems={menuItems}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Minimalist Footer with Direct Contact Links */}
      <Footer />

      {/* 2.5-Second Opening Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            durationMs={2500}
            onFinish={() => setShowSplash(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
