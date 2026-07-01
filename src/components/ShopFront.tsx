/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Bell, Globe, Search, Star, Trash2, Plus, Minus, 
  Check, Truck, Tag, Sparkles, X, ChevronRight, Eye, ShieldCheck, Heart 
} from 'lucide-react';
import { db } from '../dbSeed';
import { Product, CartItem, Order, Coupon, Notification, BannerConfig } from '../types';

interface ShopFrontProps {
  lang: 'en' | 'bn';
  setLang: (l: 'en' | 'bn') => void;
  currency: 'USD' | 'BDT';
  setCurrency: (c: 'USD' | 'BDT') => void;
  onAdminLoginClick: () => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export default function ShopFront({ 
  lang, 
  setLang, 
  currency, 
  setCurrency, 
  onAdminLoginClick,
  notifications,
  setNotifications
}: ShopFrontProps) {
  // Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [banner, setBanner] = useState<BannerConfig | null>(null);

  // Operational States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  
  // Checkout States
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('N/A');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [bkashNumber, setBkashNumber] = useState('');
  const [bkashTrx, setBkashTrx] = useState('');
  const [nagadNumber, setNagadNumber] = useState('');
  const [nagadTrx, setNagadTrx] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<{
    bkash_number: string;
    nagad_number: string;
    delivery_inside_dhaka?: number;
    delivery_outside_dhaka?: number;
  }>({
    bkash_number: '01951869220',
    nagad_number: '01984680100',
    delivery_inside_dhaka: 70,
    delivery_outside_dhaka: 130
  });

  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Post-order Tracking State
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Load from local storage
  useEffect(() => {
    const refreshData = () => {
      setProducts(db.getProducts());
      setCoupons(db.getCoupons());
      setBanner(db.getBanner());
      setPaymentSettings(db.getPaymentSettings());
    };

    refreshData();
    
    // Load local cart if exists
    const storedCart = window.localStorage.getItem('wzone_cart');
    if (storedCart) {
      try { setCart(JSON.parse(storedCart)); } catch (e) {}
    }

    window.addEventListener('wzone-db-synced', refreshData);
    return () => {
      window.removeEventListener('wzone-db-synced', refreshData);
    };
  }, [isCheckoutOpen, placedOrder]);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    window.localStorage.setItem('wzone_cart', JSON.stringify(newCart));
  };

  // Cart operations
  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) {
        alert(lang === 'en' ? 'Cannot add more. Stock limit reached.' : 'আর যোগ করা যাবে না। স্টক শেষ।');
        return;
      }
      const updated = cart.map(item => 
        item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      saveCart(updated);
    } else {
      if (product.stock <= 0) {
        alert(lang === 'en' ? 'Product is out of stock.' : 'পণ্যটি স্টকে নেই।');
        return;
      }
      saveCart([...cart, { product, quantity: 1 }]);
    }
    // Beautiful slide-in notice
    setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    const updated = cart.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.product.stock) {
          alert(lang === 'en' ? 'Stock limit reached.' : 'স্টকের সর্বোচ্চ সীমা স্পর্শ করেছেন।');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[];
    saveCart(updated);
  };

  const removeFromCart = (productId: string) => {
    const updated = cart.filter(item => item.product.id !== productId);
    saveCart(updated);
  };

  // Coupons
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');
    
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const coupon = coupons.find(c => c.code === code && c.is_active);
    if (coupon) {
      setAppliedCoupon(coupon);
      setCouponSuccess(
        lang === 'en' 
          ? `Success! Coupon applied: ${coupon.discount_percent}% Discount.` 
          : `সফল হয়েছে! কুপন যুক্ত হয়েছে: ${coupon.discount_percent}% ডিসকাউন্ট।`
      );
    } else {
      setAppliedCoupon(null);
      setCouponError(
        lang === 'en' ? 'Invalid or inactive coupon code.' : 'ভুল অথবা নিষ্ক্রিয় কুপন কোড।'
      );
    }
  };

  // Calc Pricing
  const getSubtotal = () => {
    return cart.reduce((sum, item) => {
      const price = currency === 'USD' ? item.product.price_usd : item.product.price_bdt;
      return sum + (price * item.quantity);
    }, 0);
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    return getSubtotal() * (appliedCoupon.discount_percent / 100);
  };

  const getShippingFee = () => {
    if (cart.length === 0) return 0;
    // Free shipping over $50 or 5000 BDT, otherwise standard charge
    const subtotal = getSubtotal();
    if (currency === 'USD') {
      return subtotal >= 50 ? 0 : 5;
    } else {
      const charge = deliveryLocation === 'inside_dhaka'
        ? (paymentSettings.delivery_inside_dhaka ?? 70)
        : (paymentSettings.delivery_outside_dhaka ?? 130);
      return subtotal >= 5000 ? 0 : charge;
    }
  };

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount() + getShippingFee();
  };

  // Checkout submission
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Create a new Order matching the DB Schema
    const orderId = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
    const itemsList = cart.map(item => ({
      product_id: item.product.id,
      name_en: item.product.name_en,
      name_bn: item.product.name_bn,
      price_usd: item.product.price_usd,
      price_bdt: item.product.price_bdt,
      quantity: item.quantity,
    }));

    // Calculate total values independently to store accurately
    const activeShippingFee = deliveryLocation === 'inside_dhaka'
      ? (paymentSettings.delivery_inside_dhaka ?? 70)
      : (paymentSettings.delivery_outside_dhaka ?? 130);

    const totalUSD = currency === 'USD' 
      ? getTotal() 
      : (getSubtotal() - getDiscountAmount()) * (1 / 116) + (getSubtotal() >= 5000 ? 0 : 5); // approximate conversion
    const totalBDT = currency === 'BDT'
      ? getTotal()
      : (getSubtotal() - getDiscountAmount()) * 116 + (getSubtotal() >= 50 ? 0 : activeShippingFee);

    const paymentDetails = paymentMethod === 'bKash' 
      ? `bKash Wallet: ${bkashNumber}, TrxID: ${bkashTrx}` 
      : paymentMethod === 'Nagad' 
      ? `Nagad Wallet: ${nagadNumber}, TrxID: ${nagadTrx}` 
      : 'Cash on Delivery';

    const locationLabel = deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka (ঢাকার ভিতরে)' : 'Outside Dhaka (ঢাকার বাহিরে)';
    const fullShippingAddress = `[Area: ${locationLabel}] ${shippingAddress}`;

    const newOrder: Order = {
      id: orderId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      shipping_address: fullShippingAddress,
      payment_method: paymentMethod,
      payment_details: paymentDetails,
      items: itemsList,
      total_usd: Math.round(totalUSD * 100) / 100,
      total_bdt: Math.round(totalBDT),
      status: 'pending',
      estimated_delivery: lang === 'en' ? '3 to 5 business days' : '৩ থেকে ৫ কার্যদিবস',
      coupon_applied: appliedCoupon?.code || undefined,
      discount_percent: appliedCoupon?.discount_percent || 0,
      created_at: new Date().toISOString()
    };

    // Save to orders db
    const currentOrders = db.getOrders();
    db.setOrders([newOrder, ...currentOrders]);

    // Deduct inventory stock
    const currentProducts = db.getProducts();
    const updatedProducts = currentProducts.map(p => {
      const purchased = cart.find(item => item.product.id === p.id);
      if (purchased) {
        return { ...p, stock: Math.max(0, p.stock - purchased.quantity) };
      }
      return p;
    });
    db.setProducts(updatedProducts);

    // Create checkout success notification
    const newNotif: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title_en: 'New Order Placed!',
      title_bn: 'নতুন অর্ডার প্লেস হয়েছে!',
      message_en: `Thank you, ${customerName}. Order ${orderId} has been successfully recorded.`,
      message_bn: `ধন্যবাদ, ${customerName}। আপনার অর্ডার ${orderId} সফলভাবে সম্পন্ন হয়েছে।`,
      time: 'Just now',
      type: 'success',
      read: false
    };
    const nextNotifs = [newNotif, ...db.getNotifications()];
    db.setNotifications(nextNotifs);
    setNotifications(nextNotifs);

    // Clear cart and state
    setCart([]);
    window.localStorage.removeItem('wzone_cart');
    setAppliedCoupon(null);
    setCouponInput('');
    setPlacedOrder(newOrder);

    // Reset checkout forms
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setShippingAddress('');
    setIsCheckoutOpen(false);
  };

  const markAllNotificationsAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    db.setNotifications(updated);
    setNotifications(updated);
  };

  // Filter & Search Products
  const categories = ['All', 'Wallets', 'Belts', 'Bags', 'Accessories'];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const name = lang === 'en' ? p.name_en.toLowerCase() : p.name_bn.toLowerCase();
    const desc = lang === 'en' ? p.description_en.toLowerCase() : p.description_bn.toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase()) || desc.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-950 flex flex-col" id="shop-front-root">
      {/* Dynamic Announcement Header */}
      <div className="bg-amber-950 text-amber-100 text-[11px] font-mono tracking-widest text-center py-2 px-4 uppercase flex items-center justify-center gap-1.5 border-b border-amber-900">
        <Sparkles className="w-3.5 h-3.5 animate-bounce text-amber-400" />
        {lang === 'en' 
          ? 'Lifetime warranty on 100% full-grain leather. Code: EID2026' 
          : '১০০% আসল চামড়ায় আজীবন ওয়ারেন্টি। ব্যবহার করুন: EID2026'}
      </div>

      {/* Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm px-4 sm:px-8 py-4 flex items-center justify-between">
        {/* Luxury Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-amber-950 rounded-xl flex items-center justify-center border border-amber-800 shadow-lg shadow-amber-950/10">
            <span className="font-serif font-bold text-amber-100 text-lg tracking-widest">WZ</span>
          </div>
          <div>
            <h1 className="font-serif font-black tracking-widest text-stone-900 text-lg sm:text-xl uppercase">
              WALLET ZONE
            </h1>
            <p className="text-[9px] text-amber-800 font-mono tracking-widest uppercase">
              {lang === 'en' ? 'Royal Handcrafted Goods' : 'রাজকীয় হস্তশিল্প সমাহার'}
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 rounded-xl hover:bg-stone-100 text-xs font-semibold text-stone-700 transition-colors"
            title="Toggle Language"
            id="lang-toggle"
          >
            <Globe className="w-3.5 h-3.5 text-stone-500" />
            <span>{lang === 'en' ? 'ENGLISH' : 'বাংলা'}</span>
          </button>



          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAllNotificationsAsRead();
              }}
              className="p-2 border border-stone-200 rounded-xl hover:bg-stone-100 text-stone-700 relative transition-colors"
              id="notif-toggle"
            >
              <Bell className="w-4.5 h-4.5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-700 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-stone-200 rounded-2xl shadow-xl py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 pb-2 border-b border-stone-100 flex items-center justify-between">
                  <h4 className="font-serif font-bold text-sm text-stone-900">
                    {lang === 'en' ? 'Boutique Updates' : 'বুটিক আপডেট'}
                  </h4>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-stone-400 hover:text-stone-600 text-xs font-medium"
                  >
                    {lang === 'en' ? 'Close' : 'বন্ধ করুন'}
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-stone-50">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-stone-400 text-xs">
                      {lang === 'en' ? 'No recent notifications' : 'কোন সাম্প্রতিক নোটিফিকেশন নেই'}
                    </div>
                  ) : (
                    notifications.map((n, idx) => (
                      <div key={`${n.id}-${idx}`} className="p-3.5 hover:bg-stone-50 transition-colors">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            n.type === 'success' ? 'bg-emerald-500' : n.type === 'alert' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                          <h5 className="font-semibold text-xs text-stone-800">
                            {lang === 'en' ? n.title_en : n.title_bn}
                          </h5>
                          <span className="text-[10px] text-stone-400 ml-auto font-mono">{n.time}</span>
                        </div>
                        <p className="text-stone-500 text-[11px] leading-normal">
                          {lang === 'en' ? n.message_en : n.message_bn}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Cart Icon trigger */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-stone-100 hover:bg-stone-800 rounded-xl transition-all shadow-md font-medium text-xs sm:text-sm"
            id="cart-trigger"
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline font-semibold">
              {lang === 'en' ? 'Boutique Cart' : 'শপিং ব্যাগ'}
            </span>
            <span className="font-mono bg-amber-400 text-stone-950 font-bold px-1.5 py-0.5 rounded-md text-[10px]">
              {cart.reduce((sum, i) => sum + i.quantity, 0)}
            </span>
          </button>

          {/* Admin Panel Link */}
          <button
            onClick={onAdminLoginClick}
            className="text-stone-500 hover:text-amber-800 text-xs font-semibold uppercase tracking-wider pl-2 border-l border-stone-200 transition-colors"
            id="admin-login-btn"
          >
            {lang === 'en' ? 'Admin Portal' : 'অ্যাডমিন পোর্টাল'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1">
        {/* Placed Order Success Modal Banner */}
        {placedOrder && (
          <div className="bg-emerald-50 border-b border-emerald-200 p-6 flex flex-col items-center text-center animate-in fade-in duration-300">
            <span className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center border border-emerald-200 mb-3">
              <Check className="w-6 h-6" />
            </span>
            <h2 className="font-serif font-bold text-lg sm:text-2xl text-emerald-950 mb-1">
              {lang === 'en' ? 'Thank You For Your Royal Order!' : 'আপনার রাজকীয় অর্ডারের জন্য ধন্যবাদ!'}
            </h2>
            <p className="text-stone-600 text-xs sm:text-sm max-w-xl mb-4">
              {lang === 'en' 
                ? `Your order has been recorded with ID ${placedOrder.id}. We have initialized handcrafted packaging inside our signature wooden boutique case.` 
                : `আপনার অর্ডারটি আইডি ${placedOrder.id} এর অধীনে নথিভুক্ত করা হয়েছে। আমরা আমাদের সিগনেচার কাঠের বাক্সে পণ্যটির হস্তশিল্প প্যাকেজিং শুরু করেছি।`}
            </p>
            <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-6 w-full max-w-md text-left shadow-md">
              <div className="flex justify-between border-b border-stone-100 pb-2 mb-3">
                <span className="text-xs font-semibold text-stone-500 uppercase">{lang === 'en' ? 'Invoice ID' : 'ইনভয়েস আইডি'}</span>
                <span className="text-xs font-mono font-bold text-stone-800">{placedOrder.id}</span>
              </div>
              <div className="space-y-2 mb-3">
                {placedOrder.items.map((i, index) => (
                  <div key={index} className="flex justify-between text-xs">
                    <span className="text-stone-700">{lang === 'en' ? i.name_en : i.name_bn} (x{i.quantity})</span>
                    <span className="font-mono text-stone-800">
                      {currency === 'USD' ? `$${i.price_usd * i.quantity}` : `৳${i.price_bdt * i.quantity}`}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 pt-3 flex justify-between font-bold text-sm text-stone-900">
                <span>{lang === 'en' ? 'Paid Total' : 'পরিশোধিত মোট'}</span>
                <span className="font-mono text-amber-900">
                  {currency === 'USD' ? `$${placedOrder.total_usd}` : `৳${placedOrder.total_bdt}`}
                </span>
              </div>
              <p className="text-[10px] text-stone-400 mt-3 text-center uppercase tracking-widest font-mono">
                {lang === 'en' ? `Estimated Delivery: ${placedOrder.estimated_delivery}` : `সম্ভাব্য ডেলিভারি: ${placedOrder.estimated_delivery}`}
              </p>
            </div>
            <button
              onClick={() => setPlacedOrder(null)}
              className="mt-4 text-xs font-bold text-stone-600 hover:text-stone-900 underline uppercase tracking-wider"
            >
              {lang === 'en' ? 'Dismiss Window' : 'উইন্ডো বন্ধ করুন'}
            </button>
          </div>
        )}

        {/* Premium Banner Configuration Spot */}
        {banner && (
          <section className="relative h-[420px] bg-stone-950 text-white overflow-hidden flex items-center">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src={banner.image} 
                alt="Royal Leather Collection Banner"
                className="w-full h-full object-cover opacity-35 filter saturate-[0.8]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/85 to-transparent" />
            </div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-12 flex flex-col items-start max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-[10px] font-semibold uppercase tracking-widest border border-amber-400/30 mb-4 animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {lang === 'en' ? 'Bespoke Craftsmanship' : 'হস্তনির্মিত শৈল্পিকতা'}
              </span>
              <h2 className="font-serif font-black text-3xl sm:text-5xl leading-tight tracking-wider text-amber-100 mb-4 uppercase">
                {lang === 'en' ? banner.title_en : banner.title_bn}
              </h2>
              <p className="text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
                {lang === 'en' ? banner.subtitle_en : banner.subtitle_bn}
              </p>
              <div className="flex gap-4">
                <a
                  href="#catalog"
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl text-sm transition-all duration-200 transform hover:translate-y-[-2px] uppercase shadow-lg shadow-amber-400/10"
                >
                  {lang === 'en' ? 'Browse Catalog' : 'ক্যাটালগ দেখুন'}
                </a>
                <button
                  onClick={() => {
                    const activeChat = document.getElementById('chat-toggle-btn');
                    if (activeChat) activeChat.click();
                  }}
                  className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-amber-100 font-bold rounded-xl text-sm border border-stone-800 transition-all duration-200 uppercase"
                >
                  {lang === 'en' ? 'Consult Expert' : 'বিশেষজ্ঞের পরামর্শ নিন'}
                </button>
              </div>
            </div>

            {/* Subtle floating branding details */}
            <div className="absolute bottom-4 right-8 hidden md:block z-10 text-right font-mono text-[9px] text-stone-500 uppercase tracking-widest">
              <div>WALLET ZONE INC. CO.</div>
              <div>DHAKA, BANGLADESH</div>
            </div>
          </section>
        )}

        {/* Categories Rail and Search Section */}
        <section className="bg-white border-b border-stone-200 sticky top-18 z-20 shadow-sm" id="catalog">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter Rails */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map(cat => {
                const isActive = selectedCategory === cat;
                // Bilingual label mapping
                let label = cat;
                if (cat === 'All') label = lang === 'en' ? 'All Masterpieces' : 'সব মাস্টারপিস';
                else if (cat === 'Wallets') label = lang === 'en' ? 'Wallets' : 'মানিব্যাগ';
                else if (cat === 'Belts') label = lang === 'en' ? 'Belts' : 'বেল্ট';
                else if (cat === 'Bags') label = lang === 'en' ? 'Bags' : 'ব্যাগ';
                else if (cat === 'Accessories') label = lang === 'en' ? 'Accessories' : 'অ্যাকসেসরিজ';

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${
                      isActive 
                        ? 'bg-amber-950 text-amber-100 shadow' 
                        : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/60'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'en' ? 'Search premium collections...' : 'প্রিমিয়াম পণ্য খুঁজুন...'}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2 pl-10 pr-4 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

          </div>
        </section>

        {/* Products Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-8 py-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-stone-900 tracking-wide">
                {lang === 'en' ? 'Featured Handcrafted Masterpieces' : 'বৈশিষ্ট্যযুক্ত হস্তশিল্পের মাস্টারপিস'}
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                {lang === 'en' 
                  ? `Showing ${filteredProducts.length} premium models of ${selectedCategory} category.` 
                  : `${selectedCategory} ক্যাটাগরির ${filteredProducts.length}টি প্রিমিয়াম মডেল প্রদর্শন করা হচ্ছে।`}
              </p>
            </div>
            
            {/* Genuine Guarantee Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 rounded-xl border border-amber-200/50 text-[10px] uppercase tracking-widest font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-800" />
              {lang === 'en' ? '100% Genuine Export Certified' : '১০০% খাঁটি লেদার গ্যারান্টি'}
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-2xl p-16 text-center shadow-sm">
              <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-serif font-bold text-lg text-stone-800 mb-1">
                {lang === 'en' ? 'No Masterpieces Found' : 'কোন পণ্য খুঁজে পাওয়া যায়নি'}
              </h4>
              <p className="text-stone-500 text-sm max-w-sm mx-auto mb-4">
                {lang === 'en' 
                  ? 'We currently do not have matching products for this filter. Browse other categories!' 
                  : 'আমাদের কাছে এই ফিল্টারের জন্য কোনো পণ্য বর্তমানে নেই। অনুগ্রহ করে অন্য ক্যাটাগরি ব্রাউজ করুন!'}
              </p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
              >
                {lang === 'en' ? 'Reset Filters' : 'ফিল্টার রিসেট করুন'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map(product => {
                const outOfStock = product.stock <= 0;
                const lowStock = product.stock > 0 && product.stock <= 5;
                
                return (
                  <div
                    key={product.id}
                    className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full transform hover:translate-y-[-4px]"
                    id={`product-${product.id}`}
                  >
                    {/* Image Area */}
                    <div className="relative aspect-video sm:aspect-square bg-stone-100 overflow-hidden">
                      <img
                        src={product.image}
                        alt={lang === 'en' ? product.name_en : product.name_bn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-stone-900/0 transition-colors" />

                      {/* Stock Badges */}
                      {outOfStock ? (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                          {lang === 'en' ? 'Sold Out' : 'স্টক শেষ'}
                        </span>
                      ) : lowStock ? (
                        <span className="absolute top-3 left-3 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-md animate-pulse">
                          {lang === 'en' ? `Only ${product.stock} Left` : `মাত্র ${product.stock}টি বাকি`}
                        </span>
                      ) : null}

                      {/* Category Badge */}
                      <span className="absolute bottom-3 left-3 bg-stone-900/80 backdrop-blur-md text-amber-100 text-[9px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg">
                        {lang === 'en' ? product.category_label_en : product.category_label_bn}
                      </span>
                    </div>

                    {/* Info Area */}
                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${
                              i < Math.floor(product.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                            }`} 
                          />
                        ))}
                        <span className="text-[11px] font-mono font-semibold text-stone-500 ml-1">
                          {product.rating}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-lg text-stone-900 mb-1 group-hover:text-amber-900 transition-colors">
                        {lang === 'en' ? product.name_en : product.name_bn}
                      </h4>

                      <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed mb-4 flex-1">
                        {lang === 'en' ? product.description_en : product.description_bn}
                      </p>

                      {/* Specs pills (first 2) */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {(lang === 'en' ? product.specs_en : product.specs_bn).slice(0, 2).map((spec, i) => (
                          <span key={i} className="bg-stone-50 text-stone-500 text-[10px] font-medium px-2 py-0.5 rounded-md border border-stone-100">
                            {spec}
                          </span>
                        ))}
                      </div>

                      {/* Price & Action footer */}
                      <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                            {lang === 'en' ? 'Bespoke Price' : 'মূল্য'}
                          </div>
                          <div className="font-mono text-base font-bold text-amber-950">
                            {currency === 'USD' ? `$${product.price_usd}` : `৳${product.price_bdt}`}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {/* Quick View Button */}
                          <button
                            onClick={() => setQuickViewProduct(product)}
                            className="p-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition-colors"
                            title="Quick View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Add to Cart Button */}
                          <button
                            onClick={() => addToCart(product)}
                            disabled={outOfStock}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 ${
                              outOfStock 
                                ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
                                : 'bg-stone-950 text-white hover:bg-amber-950 shadow-sm'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{lang === 'en' ? 'Add' : 'কিনুন'}</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Brand values footer banner */}
      <section className="bg-stone-100 border-t border-stone-200 py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <span className="w-10 h-10 bg-amber-100 text-amber-950 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h5 className="font-serif font-bold text-stone-900 text-base">
                {lang === 'en' ? 'Lifetime Durability' : 'আজীবন স্থায়িত্ব ওয়ারেন্টি'}
              </h5>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                {lang === 'en' 
                  ? 'All Wallet Zone luxury products are made from top-tier full-grain exports with zero synthetic layers.'
                  : 'ওয়ালেট জোনের সব বিলাসবহুল পণ্য খাঁটি চামড়া থেকে তৈরি, যার মধ্যে কৃত্রিমতার কোনো স্পর্শ নেই।'}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <span className="w-10 h-10 bg-amber-100 text-amber-950 rounded-full flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </span>
            <div>
              <h5 className="font-serif font-bold text-stone-900 text-base">
                {lang === 'en' ? 'Nationwide Safe Shipping' : 'দেশব্যাপী নিরাপদ শিপিং'}
              </h5>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                {lang === 'en' 
                  ? 'Free express packaging and delivery on orders above $50 or ৳5000 inside secure boutique boxes.'
                  : '৫০ ডলার বা ৫০০০ টাকার বেশি অর্ডারে ফ্রী ডেলিভারি এবং বিশেষ কাঠের বাক্সে প্যাকেজিং সুবিধা।'}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
            <span className="w-10 h-10 bg-amber-100 text-amber-950 rounded-full flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h5 className="font-serif font-bold text-stone-900 text-base">
                {lang === 'en' ? 'Craftsmanship of Heritage' : 'ঐতিহ্যবাহী হাতের কাজ'}
              </h5>
              <p className="text-stone-500 text-xs mt-1 leading-relaxed">
                {lang === 'en' 
                  ? 'Each wallet, belt, and bag represents hours of handcrafted work by veteran Bangladeshi leather artisans.'
                  : 'প্রতিটি ওয়ালেট, বেল্ট ও ব্যাগ আমাদের দক্ষ চামড়া কারিগরদের নিপুণ হাতের কাজের ফসল।'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Footer */}
      <footer className="bg-stone-950 text-stone-400 py-12 px-6 text-center border-t border-amber-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 border-b border-stone-900 pb-8 mb-8">
          <div className="text-left">
            <span className="font-serif font-bold text-white text-xl tracking-wider uppercase">WALLET ZONE</span>
            <p className="text-xs text-stone-500 mt-1">{lang === 'en' ? '100% Full-grain Export Quality Leather Goods' : '১০০% খাঁটি ফুল-গ্রেইন রপ্তানি মানের চামড়ার বুটিক'}</p>
          </div>
          <div className="flex gap-6 text-xs font-semibold">
            <a href="#catalog" className="hover:text-white transition-colors">{lang === 'en' ? 'Shop Collections' : 'কালেকশন সমূহ'}</a>
            <button onClick={onAdminLoginClick} className="hover:text-white transition-colors">{lang === 'en' ? 'Portal' : 'অ্যাডমিন গেটওয়ে'}</button>
          </div>
        </div>
        <p className="text-stone-600 text-xs">
          &copy; 2026 Wallet Zone Luxury Co. All rights reserved. Registered under Public Schema.
        </p>
      </footer>

      {/* QUICK VIEW PRODUCT MODAL */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full border border-stone-200 animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto">
            {/* Image section */}
            <div className="md:w-1/2 bg-stone-100 relative">
              <img 
                src={quickViewProduct.image} 
                alt={quickViewProduct.name_en}
                className="w-full h-full min-h-[300px] object-cover"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 bg-stone-900/80 text-white p-2 rounded-full hover:bg-stone-950/100 md:hidden"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Section */}
            <div className="md:w-1/2 p-6 sm:p-8 flex flex-col relative">
              <button 
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-4 right-4 bg-stone-100 text-stone-600 p-2 rounded-full hover:bg-stone-200 hidden md:block"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="inline-block bg-amber-100 text-amber-950 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mb-3 self-start border border-amber-200/50">
                {lang === 'en' ? quickViewProduct.category_label_en : quickViewProduct.category_label_bn}
              </span>

              <h3 className="font-serif font-bold text-2xl text-stone-900 mb-2">
                {lang === 'en' ? quickViewProduct.name_en : quickViewProduct.name_bn}
              </h3>

              <div className="flex items-center gap-1.5 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${
                      i < Math.floor(quickViewProduct.rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'
                    }`} 
                  />
                ))}
                <span className="text-xs text-stone-500 font-semibold font-mono">({quickViewProduct.rating} / 5.0 Rating)</span>
              </div>

              <div className="text-sm text-stone-600 leading-relaxed mb-6">
                {lang === 'en' ? quickViewProduct.description_en : quickViewProduct.description_bn}
              </div>

              <div className="mb-6">
                <h5 className="font-semibold text-xs text-stone-700 uppercase tracking-wider mb-2">
                  {lang === 'en' ? 'Bespoke Specifications' : 'পণ্য বিবরণী'}
                </h5>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
                  {(lang === 'en' ? quickViewProduct.specs_en : quickViewProduct.specs_bn).map((spec, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-amber-700 rounded-full shrink-0" />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto border-t border-stone-100 pt-6 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    {lang === 'en' ? 'Bespoke Price' : 'মূল্য'}
                  </div>
                  <div className="font-mono text-2xl font-bold text-amber-950">
                    {currency === 'USD' ? `$${quickViewProduct.price_usd}` : `৳${quickViewProduct.price_bdt}`}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      addToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    disabled={quickViewProduct.stock <= 0}
                    className="px-6 py-3 bg-amber-950 text-amber-100 hover:bg-amber-900 disabled:bg-stone-100 disabled:text-stone-400 font-bold rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{quickViewProduct.stock <= 0 ? (lang === 'en' ? 'Out of Stock' : 'স্টক শেষ') : (lang === 'en' ? 'Add To Bag' : 'ব্যাগ-এ রাখুন')}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* BOUTIQUE CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex justify-end">
          <div className="bg-stone-50 w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Cart Header */}
            <div className="bg-amber-950 text-amber-100 p-5 flex items-center justify-between border-b border-amber-900">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif font-bold text-lg">
                  {lang === 'en' ? 'Your Boutique Cart' : 'আপনার শপিং ব্যাগ'}
                </h3>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="text-stone-300 hover:text-white p-1 rounded-full hover:bg-amber-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Body */}
            {isCheckoutOpen ? (
              /* Checkout Form Panel */
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center gap-2 mb-6 text-stone-500 text-xs">
                  <button onClick={() => setIsCheckoutOpen(false)} className="hover:underline font-semibold uppercase text-amber-950">
                    {lang === 'en' ? '← Back to Cart' : '← ব্যাগে ফিরে যান'}
                  </button>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="uppercase">{lang === 'en' ? 'Secure Checkout' : 'নিরাপদ চেকআউট'}</span>
                </div>

                <h4 className="font-serif font-bold text-stone-900 text-lg mb-4 uppercase tracking-wide border-b border-stone-200 pb-2">
                  {lang === 'en' ? 'Delivery Address & Payment' : 'ডেলিভারি ঠিকানা ও পেমেন্ট'}
                </h4>

                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div>
                    <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                      {lang === 'en' ? 'Your Full Name' : 'আপনার পূর্ণ নাম'}
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g. Faisal Ahmed' : 'উদাঃ ফয়সাল আহমেদ'}
                      className="w-full bg-white border border-stone-300 rounded-xl py-2 px-3 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                        {lang === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="e.g. 017XXXXXXXX"
                        className="w-full bg-white border border-stone-300 rounded-xl py-2 px-3 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                      {lang === 'en' ? 'Detailed Shipping Address' : 'শিপিং ঠিকানা'}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g. House #12, Road #4, Dhanmondi, Dhaka' : 'উদাঃ বাসা #১২, রোড #৪, ধানমন্ডি, ঢাকা'}
                      className="w-full bg-white border border-stone-300 rounded-xl py-2 px-3 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                    />
                  </div>

                  {/* Delivery Location / Delivery Charge Options */}
                  <div className="border-t border-stone-200/60 pt-4">
                    <label className="block text-stone-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                      {lang === 'en' ? 'Delivery Area & Charge' : 'ডেলিভারি এরিয়া ও চার্জ'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeliveryLocation('inside_dhaka')}
                        className={`p-3 border rounded-xl text-left flex flex-col justify-between transition-all ${
                          deliveryLocation === 'inside_dhaka'
                            ? 'bg-amber-950/5 border-amber-950 ring-1 ring-amber-950'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs text-stone-900">
                            {lang === 'en' ? 'Inside Dhaka' : 'ঢাকার ভিতরে'}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            deliveryLocation === 'inside_dhaka' ? 'border-amber-950 bg-amber-950' : 'border-stone-300'
                          }`}>
                            {deliveryLocation === 'inside_dhaka' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-semibold font-mono">
                          {lang === 'en' ? 'Delivery Fee' : 'ডেলিভারি চার্জ'}: ৳{paymentSettings.delivery_inside_dhaka ?? 70}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeliveryLocation('outside_dhaka')}
                        className={`p-3 border rounded-xl text-left flex flex-col justify-between transition-all ${
                          deliveryLocation === 'outside_dhaka'
                            ? 'bg-amber-950/5 border-amber-950 ring-1 ring-amber-950'
                            : 'bg-white border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-xs text-stone-900">
                            {lang === 'en' ? 'Outside Dhaka' : 'ঢাকার বাহিরে'}
                          </span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            deliveryLocation === 'outside_dhaka' ? 'border-amber-950 bg-amber-950' : 'border-stone-300'
                          }`}>
                            {deliveryLocation === 'outside_dhaka' && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 font-semibold font-mono">
                          {lang === 'en' ? 'Delivery Fee' : 'ডেলিভারি চার্জ'}: ৳{paymentSettings.delivery_outside_dhaka ?? 130}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="border-t border-stone-200 pt-4">
                    <label className="block text-stone-700 text-xs font-semibold mb-2 uppercase tracking-wider">
                      {lang === 'en' ? 'Choose Payment Option' : 'পেমেন্ট পদ্ধতি নির্বাচন করুন'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Cash on Delivery', 'bKash', 'Nagad'].map(method => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2 px-3 border rounded-xl text-xs font-bold transition-all uppercase ${
                            paymentMethod === method 
                              ? 'bg-amber-950 text-amber-100 border-amber-950' 
                              : 'bg-white text-stone-600 border-stone-200'
                          }`}
                        >
                          {method === 'Cash on Delivery' 
                            ? (lang === 'en' ? 'COD' : 'ক্যাশ অন ডেলিভারি') 
                            : method === 'bKash' 
                            ? (lang === 'en' ? 'bKash' : 'বিকাশ') 
                            : (lang === 'en' ? 'Nagad' : 'নগদ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Details Inputs */}
                  {paymentMethod === 'bKash' && (
                    <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
                      <p className="text-[11px] text-amber-900 leading-normal font-medium">
                        {lang === 'en'
                          ? `Send Money / Payment to Wallet Zone bKash number: ${paymentSettings.bkash_number}. Input details below:`
                          : `আমাদের বিকাশ নম্বর: ${paymentSettings.bkash_number} তে পেমেন্ট/সেন্ড মানি করে নিচের তথ্য দিন:`}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'en' ? 'bKash Mobile Number' : 'বিকাশ মোবাইল নম্বর'}
                            value={bkashNumber}
                            onChange={(e) => setBkashNumber(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl py-1.5 px-3 text-stone-800 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'en' ? 'bKash Transaction ID' : 'বিকাশ ট্রানজেকশন আইডি'}
                            value={bkashTrx}
                            onChange={(e) => setBkashTrx(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl py-1.5 px-3 text-stone-800 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentMethod === 'Nagad' && (
                    <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-3 animate-in fade-in duration-200">
                      <p className="text-[11px] text-amber-900 leading-normal font-medium">
                        {lang === 'en'
                          ? `Send Money / Payment to Wallet Zone Nagad number: ${paymentSettings.nagad_number}. Input details below:`
                          : `আমাদের নগদ নম্বর: ${paymentSettings.nagad_number} তে পেমেন্ট/সেন্ড মানি করে নিচের তথ্য দিন:`}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'en' ? 'Nagad Mobile Number' : 'নগদ মোবাইল নম্বর'}
                            value={nagadNumber}
                            onChange={(e) => setNagadNumber(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl py-1.5 px-3 text-stone-800 text-xs focus:outline-none"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'en' ? 'Nagad Transaction ID' : 'নগদ ট্রানজেকশন আইডি'}
                            value={nagadTrx}
                            onChange={(e) => setNagadTrx(e.target.value)}
                            className="w-full bg-white border border-stone-300 rounded-xl py-1.5 px-3 text-stone-800 text-xs focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-stone-100 p-4 rounded-2xl">
                    <div className="flex justify-between font-bold text-sm text-stone-900">
                      <span>{lang === 'en' ? 'Amount To Pay' : 'সর্বমোট পরিশোধীয় মূল্য'}</span>
                      <span className="font-mono text-amber-950">
                        {currency === 'USD' ? `$${getTotal()}` : `৳${getTotal()}`}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-stone-950 text-white hover:bg-amber-950 rounded-xl font-bold uppercase text-xs tracking-widest shadow transition-all duration-200"
                  >
                    {lang === 'en' ? 'Place Royal Order' : 'অর্ডার সম্পন্ন করুন'}
                  </button>
                </form>
              </div>
            ) : (
              /* Core Cart Items List */
              <>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                      <ShoppingBag className="w-12 h-12 text-stone-300 mb-3" />
                      <h4 className="font-serif font-bold text-stone-800 text-base">
                        {lang === 'en' ? 'Your cart is completely empty' : 'আপনার শপিং ব্যাগ একদম খালি'}
                      </h4>
                      <p className="text-stone-400 text-xs max-w-xs mt-1 mb-4">
                        {lang === 'en' 
                          ? 'Browse our handcrafted collections of wallets, belts, and luxury leather duffles to add items.' 
                          : 'আমাদের প্রিমিয়াম ওয়ালেট, বেল্ট বা বিলাসবহুল ব্যাগের কালেকশন থেকে পণ্য যোগ করুন।'}
                      </p>
                      <button
                        onClick={() => setIsCartOpen(false)}
                        className="px-4 py-2 bg-stone-900 text-stone-100 rounded-xl text-xs font-semibold uppercase tracking-wider"
                      >
                        {lang === 'en' ? 'Return to boutique' : 'কেনাকাটা শুরু করুন'}
                      </button>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div
                        key={item.product.id}
                        className="bg-white border border-stone-200 rounded-2xl p-3.5 flex gap-4 items-center shadow-sm"
                      >
                        <img
                          src={item.product.image}
                          alt={lang === 'en' ? item.product.name_en : item.product.name_bn}
                          className="w-16 h-16 object-cover rounded-xl border border-stone-200 shrink-0"
                          referrerPolicy="no-referrer"
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="font-serif font-bold text-stone-900 text-sm truncate">
                            {lang === 'en' ? item.product.name_en : item.product.name_bn}
                          </h4>
                          <p className="text-amber-800 font-mono text-xs font-semibold mt-0.5">
                            {currency === 'USD' ? `$${item.product.price_usd}` : `৳${item.product.price_bdt}`}
                          </p>
                          <div className="flex items-center gap-2.5 mt-2">
                            <div className="flex items-center gap-1.5 bg-stone-100 rounded-lg p-1 border border-stone-200">
                              <button
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="p-1 hover:bg-white text-stone-600 rounded"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-mono text-xs text-stone-800 font-bold px-2">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="p-1 hover:bg-white text-stone-600 rounded"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-stone-400 hover:text-red-600 text-xs flex items-center gap-0.5 ml-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{lang === 'en' ? 'Remove' : 'বাদ দিন'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Cart pricing summaries & Coupon Codes */}
                {cart.length > 0 && (
                  <div className="bg-stone-100 border-t border-stone-200 p-5 space-y-4">
                    {/* Apply coupon form */}
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3.5 top-2.5 w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          placeholder={lang === 'en' ? 'Promo Code: e.g. EID2026' : 'ডিসকাউন্ট কোড: EID2026'}
                          className="w-full bg-white border border-stone-300 rounded-xl py-2 pl-10 pr-3 text-xs text-stone-800 uppercase focus:outline-none focus:ring-1 focus:ring-amber-800"
                        />
                      </div>
                      <button
                        type="submit"
                        className="px-4 bg-stone-900 text-stone-100 hover:bg-stone-800 rounded-xl text-xs font-bold uppercase tracking-wider"
                      >
                        {lang === 'en' ? 'Apply' : 'প্রয়োগ করুন'}
                      </button>
                    </form>

                    {/* Coupon feedback lines */}
                    {couponError && <p className="text-red-600 text-[11px] font-medium px-1">{couponError}</p>}
                    {couponSuccess && <p className="text-emerald-700 text-[11px] font-medium px-1 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {couponSuccess}
                    </p>}

                    {/* Math breakdown */}
                    <div className="space-y-2 text-xs text-stone-500 border-t border-stone-200/50 pt-3">
                      <div className="flex justify-between">
                        <span>{lang === 'en' ? 'Boutique Subtotal' : 'উপ-মোট'}</span>
                        <span className="font-mono text-stone-800 font-semibold">
                          {currency === 'USD' ? `$${getSubtotal()}` : `৳${getSubtotal()}`}
                        </span>
                      </div>
                      
                      {appliedCoupon && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>
                            {lang === 'en' ? 'Royal Discount' : 'রয়েল ডিসকাউন্ট'} ({appliedCoupon.discount_percent}%)
                          </span>
                          <span className="font-mono">
                            -{currency === 'USD' ? `$${getDiscountAmount().toFixed(2)}` : `৳${Math.round(getDiscountAmount())}`}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between">
                        <span>{lang === 'en' ? 'Boutique Shipping' : 'ডেলিভারি চার্জ'}</span>
                        <span className="font-mono text-stone-800">
                          {getShippingFee() === 0 
                            ? (lang === 'en' ? 'FREE' : 'ফ্রী') 
                            : (currency === 'USD' ? `$${getShippingFee()}` : `৳${getShippingFee()}`)}
                        </span>
                      </div>

                      <div className="border-t border-stone-300/50 pt-2.5 flex justify-between font-bold text-sm text-stone-900">
                        <span>{lang === 'en' ? 'Premium Total' : 'সর্বমোট মূল্য'}</span>
                        <span className="font-mono text-amber-950 text-base">
                          {currency === 'USD' ? `$${getTotal().toFixed(2)}` : `৳${Math.round(getTotal())}`}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsCheckoutOpen(true)}
                      className="w-full py-3 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl text-center font-bold uppercase tracking-widest text-xs transition-all duration-200 shadow shadow-amber-950/10"
                    >
                      {lang === 'en' ? 'Proceed To Checkout' : 'চেকআউট-এ এগিয়ে যান'}
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
