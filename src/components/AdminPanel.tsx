/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, DollarSign, ShoppingBag, Package, AlertTriangle, 
  Tag, MessageSquare, Plus, Edit2, Trash2, LogOut, Check, X, 
  Megaphone, User, Image, ArrowLeft, RefreshCw, Send, Phone, Mail, MapPin,
  Settings, Users, Database
} from 'lucide-react';
import { db, syncFromSupabase } from '../dbSeed';
import { Product, Order, Coupon, Chat, Notification, BannerConfig, Admin } from '../types';

interface AdminPanelProps {
  onBackToShop: () => void;
  lang: 'en' | 'bn';
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

export default function AdminPanel({ onBackToShop, lang, setNotifications }: AdminPanelProps) {
  // Authentication State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeAdmin, setActiveAdmin] = useState<Admin | null>(null);
  const [authError, setAuthError] = useState('');

  // Supabase Table Status
  const [supabaseSetupNeeded, setSupabaseSetupNeeded] = useState(false);
  const [supabaseSetupSql, setSupabaseSetupSql] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);

  // Sign up state toggles and fields
  const [signUpMode, setSignUpMode] = useState(false);
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState<'admin' | 'moderator' | 'viewer'>('admin');

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'products' | 'coupons' | 'chats' | 'banner' | 'notifications' | 'settings' | 'admins'>('dashboard');

  // Database states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setLocalNotifications] = useState<Notification[]>([]);
  const [banner, setBanner] = useState<BannerConfig | null>(null);
  const [adminsList, setAdminsList] = useState<Admin[]>([]);

  // Customizable Payment Gateways state
  const [bkashNumSetting, setBkashNumSetting] = useState('01951869220');
  const [nagadNumSetting, setNagadNumSetting] = useState('01984680100');
  const [deliveryInsideDhaka, setDeliveryInsideDhaka] = useState(70);
  const [deliveryOutsideDhaka, setDeliveryOutsideDhaka] = useState(130);

  // Filter states
  const [orderFilter, setOrderFilter] = useState<string>('all');
  const [selectedChatUser, setSelectedChatUser] = useState<Chat | null>(null);
  const [chatReply, setChatReply] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Create/Edit states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'product' | 'order' | 'coupon' | 'chat' | 'notification' | 'admin';
    id: string;
    label: string;
  } | null>(null);

  // Form states for Product CRUD
  const [prodId, setProdId] = useState('');
  const [prodNameEn, setProdNameEn] = useState('');
  const [prodNameBn, setProdNameBn] = useState('');
  const [prodDescEn, setProdDescEn] = useState('');
  const [prodDescBn, setProdDescBn] = useState('');
  const [prodPriceUsd, setProdPriceUsd] = useState(0);
  const [prodPriceBdt, setProdPriceBdt] = useState(0);
  const [prodCategory, setProdCategory] = useState('Wallets');
  const [prodCategoryLabelEn, setProdCategoryLabelEn] = useState('Premium Wallets');
  const [prodCategoryLabelBn, setProdCategoryLabelBn] = useState('প্রিমিয়াম ওয়ালেটস');
  const [prodImage, setProdImage] = useState('');
  const [prodStock, setProdStock] = useState(10);
  const [prodSpecsEn, setProdSpecsEn] = useState('');
  const [prodSpecsBn, setProdSpecsBn] = useState('');
  const [prodFeatured, setProdFeatured] = useState(false);

  // Form state for Coupon
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState(10);
  const [newCouponDescEn, setNewCouponDescEn] = useState('');
  const [newCouponDescBn, setNewCouponDescBn] = useState('');

  // Form state for Global Notification
  const [notifTitleEn, setNotifTitleEn] = useState('');
  const [notifTitleBn, setNotifTitleBn] = useState('');
  const [notifMsgEn, setNotifMsgEn] = useState('');
  const [notifMsgBn, setNotifMsgBn] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'alert'>('info');

  // Form state for Banner Config
  const [bannerTitleEn, setBannerTitleEn] = useState('');
  const [bannerTitleBn, setBannerTitleBn] = useState('');
  const [bannerSubEn, setBannerSubEn] = useState('');
  const [bannerSubBn, setBannerSubBn] = useState('');
  const [bannerImg, setBannerImg] = useState('');

  // Load Database Values
  const refreshDatabaseStates = () => {
    setProducts(db.getProducts());
    setOrders(db.getOrders());
    setCoupons(db.getCoupons());
    setChats(db.getChats());
    setLocalNotifications(db.getNotifications());
    setAdminsList(db.getAdmins());
    
    const curBanner = db.getBanner();
    setBanner(curBanner);
    if (curBanner) {
      setBannerTitleEn(curBanner.title_en);
      setBannerTitleBn(curBanner.title_bn);
      setBannerSubEn(curBanner.subtitle_en);
      setBannerSubBn(curBanner.subtitle_bn);
      setBannerImg(curBanner.image);
    }

    const paySettings = db.getPaymentSettings();
    setBkashNumSetting(paySettings.bkash_number);
    setNagadNumSetting(paySettings.nagad_number);
    setDeliveryInsideDhaka(paySettings.delivery_inside_dhaka ?? 70);
    setDeliveryOutsideDhaka(paySettings.delivery_outside_dhaka ?? 130);
  };

  useEffect(() => {
    refreshDatabaseStates();
    window.addEventListener('wzone-db-synced', refreshDatabaseStates);
    return () => {
      window.removeEventListener('wzone-db-synced', refreshDatabaseStates);
    };
  }, []);

  useEffect(() => {
    const checkSupabaseStatus = () => {
      setSupabaseSetupNeeded(window.localStorage.getItem('wzone_supabase_setup_needed') === 'true');
      setSupabaseSetupSql(window.localStorage.getItem('wzone_supabase_setup_sql') || '');
    };
    checkSupabaseStatus();
    window.addEventListener('wzone-db-synced', checkSupabaseStatus);
    window.addEventListener('wzone-db-sync-error', checkSupabaseStatus);
    return () => {
      window.removeEventListener('wzone-db-synced', checkSupabaseStatus);
      window.removeEventListener('wzone-db-sync-error', checkSupabaseStatus);
    };
  }, []);

  // Poll for new live chats or sync scroll
  useEffect(() => {
    if (selectedChatUser) {
      const interval = setInterval(() => {
        const allChats = db.getChats();
        const updated = allChats.find(c => c.user_id === selectedChatUser.user_id);
        if (updated && JSON.stringify(updated.messages) !== JSON.stringify(selectedChatUser.messages)) {
          setSelectedChatUser(updated);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedChatUser]);

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatUser?.messages]);

  // Login Check
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.admin) {
        setActiveAdmin(data.admin);
        setIsLoggedIn(true);
        refreshDatabaseStates();
      } else {
        setAuthError(data.error || 'Access Denied. Invalid email or security credentials pin.');
      }
    } catch (err) {
      setAuthError('Network error. Unable to authenticate.');
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!signUpName.trim() || !signUpEmail.trim() || !signUpPhone.trim() || !signUpPassword.trim()) {
      setAuthError('All fields are required for portal registration.');
      return;
    }

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: signUpName.trim(),
          email: signUpEmail.trim(),
          phone: signUpPhone.trim(),
          password: signUpPassword.trim()
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Clear sign up fields
        setSignUpName('');
        setSignUpEmail('');
        setSignUpPhone('');
        setSignUpPassword('');
        setSignUpRole('admin');
        
        // Auto-fill login fields with new credentials
        setEmail(signUpEmail.trim());
        setPassword(''); // Empty for security

        // Switch back to Sign In
        setSignUpMode(false);
        alert(data.message || 'User Registered Successfully! Pending admin approval.');
        
        // Refresh local database states
        await syncFromSupabase();
        refreshDatabaseStates();
      } else {
        setAuthError(data.error || 'Failed to register account.');
      }
    } catch (err) {
      setAuthError('Network error. Unable to register.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setActiveAdmin(null);
    setEmail('');
    setPassword('');
  };

  // Orders managers
  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    if (activeAdmin?.role === 'viewer') {
      alert('Access Denied: Read-only viewers cannot modify customer order statuses.');
      return;
    }

    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: newStatus };
      }
      return o;
    });
    db.setOrders(updated);
    setOrders(updated);

    // Trigger dynamic notification to customer
    const orderObj = orders.find(o => o.id === orderId);
    if (orderObj) {
      const newNotif: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        title_en: `Order Status Updated`,
        title_bn: `অর্ডারের অগ্রগতি`,
        message_en: `Order ${orderId} status is now: ${newStatus.toUpperCase()}.`,
        message_bn: `আপনার অর্ডার ${orderId} এর অবস্থা এখন: ${newStatus.toUpperCase()}`,
        time: 'Just now',
        type: 'info',
        read: false
      };
      const nextNotifs = [newNotif, ...db.getNotifications()];
      db.setNotifications(nextNotifs);
      setNotifications(nextNotifs);
      setLocalNotifications(nextNotifs);
    }
  };

  // Product CRUD Handlers
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProdId(product.id);
      setProdNameEn(product.name_en);
      setProdNameBn(product.name_bn);
      setProdDescEn(product.description_en);
      setProdDescBn(product.description_bn);
      setProdPriceUsd(product.price_usd);
      setProdPriceBdt(product.price_bdt);
      setProdCategory(product.category);
      setProdCategoryLabelEn(product.category_label_en);
      setProdCategoryLabelBn(product.category_label_bn);
      setProdImage(product.image);
      setProdStock(product.stock);
      setProdSpecsEn(product.specs_en.join(', '));
      setProdSpecsBn(product.specs_bn.join(', '));
      setProdFeatured(product.featured);
    } else {
      setEditingProduct(null);
      setProdId(`prod-00${products.length + 1}`);
      setProdNameEn('');
      setProdNameBn('');
      setProdDescEn('');
      setProdDescBn('');
      setProdPriceUsd(15);
      setProdPriceBdt(1750);
      setProdCategory('Wallets');
      setProdCategoryLabelEn('Premium Wallets');
      setProdCategoryLabelBn('প্রিমিয়াম ওয়ালেটস');
      setProdImage('https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600');
      setProdStock(10);
      setProdSpecsEn('Genuine Full Grain, Export Standard');
      setProdSpecsBn('১০০% আসল চামড়া, প্রিমিয়াম রপ্তানি মান');
      setProdFeatured(false);
    }
    setShowProductModal(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeAdmin?.role && activeAdmin.role !== 'admin') {
      alert('Access Denied: You must have the "admin" role to add, modify, or save products.');
      return;
    }

    const specsEnArray = prodSpecsEn.split(',').map(s => s.trim()).filter(Boolean);
    const specsBnArray = prodSpecsBn.split(',').map(s => s.trim()).filter(Boolean);

    const productPayload: Product = {
      id: prodId,
      name_en: prodNameEn,
      name_bn: prodNameBn,
      description_en: prodDescEn,
      description_bn: prodDescBn,
      price_usd: Number(prodPriceUsd),
      price_bdt: Number(prodPriceBdt),
      category: prodCategory,
      category_label_en: prodCategoryLabelEn,
      category_label_bn: prodCategoryLabelBn,
      image: prodImage,
      rating: editingProduct?.rating || 4.5,
      stock: Number(prodStock),
      specs_en: specsEnArray,
      specs_bn: specsBnArray,
      featured: prodFeatured,
    };

    let updatedProducts: Product[];
    if (editingProduct) {
      updatedProducts = products.map(p => p.id === editingProduct.id ? productPayload : p);
    } else {
      // Create fresh item
      updatedProducts = [productPayload, ...products];
    }

    db.setProducts(updatedProducts);
    setProducts(updatedProducts);
    setShowProductModal(false);
    setEditingProduct(null);
  };

  const handleDeleteProduct = (id: string) => {
    setDeleteConfirm({
      type: 'product',
      id,
      label: lang === 'en' ? 'Are you sure you want to permanently delete this product?' : 'আপনি কি নিশ্চিতভাবে এই পণ্যটি মুছে ফেলতে চান?'
    });
  };

  // Manage order delete option
  const handleDeleteOrder = (id: string) => {
    setDeleteConfirm({
      type: 'order',
      id,
      label: lang === 'en' ? `Are you sure you want to permanently delete order ${id}?` : `আপনি কি নিশ্চিতভাবে এই অর্ডারটি মুছে ফেলতে চান?`
    });
  };

  // Bespoke coupon delete option
  const handleDeleteCoupon = (code: string) => {
    setDeleteConfirm({
      type: 'coupon',
      id: code,
      label: lang === 'en' ? `Are you sure you want to permanently delete coupon "${code}"?` : `আপনি কি নিশ্চিতভাবে এই কুপনটি মুছে ফেলতে চান?`
    });
  };

  // Customer chat delete option
  const handleDeleteChat = (userId: string) => {
    setDeleteConfirm({
      type: 'chat',
      id: userId,
      label: lang === 'en' ? 'Are you sure you want to permanently delete this chat thread?' : 'আপনি কি নিশ্চিতভাবে এই চ্যাট কথোপকথনটি মুছে ফেলতে চান?'
    });
  };

  // Alerts & notification delete option
  const handleDeleteNotification = (id: string) => {
    setDeleteConfirm({
      type: 'notification',
      id,
      label: lang === 'en' ? 'Are you sure you want to delete this notification?' : 'আপনি কি নিশ্চিতভাবে এই নোটিফিকেশনটি মুছে ফেলতে চান?'
    });
  };

  const executeDeletion = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    if (activeAdmin?.role === 'viewer') {
      alert('Access Denied: Read-only viewers cannot delete any portal data.');
      setDeleteConfirm(null);
      return;
    }

    if (activeAdmin?.role === 'moderator' && (type === 'product' || type === 'coupon' || type === 'admin')) {
      alert('Access Denied: Moderators do not have permission to delete products, coupon codes, or staff members.');
      setDeleteConfirm(null);
      return;
    }

    if (type === 'product') {
      const updated = products.filter(p => p.id !== id);
      db.setProducts(updated);
      setProducts(updated);
    } else if (type === 'order') {
      const updated = orders.filter(o => o.id !== id);
      db.setOrders(updated);
      setOrders(updated);
    } else if (type === 'coupon') {
      const updated = coupons.filter(c => c.code !== id);
      db.setCoupons(updated);
      setCoupons(updated);
    } else if (type === 'chat') {
      const updated = chats.filter(c => c.user_id !== id);
      db.setChats(updated);
      setChats(updated);
      if (selectedChatUser?.user_id === id) {
        setSelectedChatUser(null);
      }
    } else if (type === 'notification') {
      const updated = notifications.filter(n => n.id !== id);
      db.setNotifications(updated);
      setLocalNotifications(updated);
      setNotifications(updated);
    } else if (type === 'admin') {
      const targetId = parseInt(id, 10);
      if (activeAdmin && activeAdmin.id === targetId) {
        alert('You cannot delete your own active administrator session!');
        setDeleteConfirm(null);
        return;
      }
      try {
        const res = await fetch('/api/admin/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminId: targetId }),
        });
        const data = await res.json();
        if (data.success) {
          await syncFromSupabase();
          refreshDatabaseStates();
          alert('Staff account deleted successfully!');
        } else {
          alert('Failed to delete staff account.');
        }
      } catch (err) {
        alert('Network error. Unable to delete staff account.');
      }
    }

    setDeleteConfirm(null);
  };

  // Staff and Roles helper methods
  const handleUpdateAdminRole = async (adminId: number, newRole: string) => {
    if (activeAdmin?.role !== 'admin' && activeAdmin?.id !== 1) {
      alert('Access Denied: Only administrators with the "admin" role can alter system clearance roles.');
      return;
    }
    try {
      const res = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, newRole }),
      });
      const data = await res.json();
      if (data.success) {
        await syncFromSupabase();
        refreshDatabaseStates();
        alert('Staff clearance role updated successfully!');
      } else {
        alert('Failed to update staff clearance role.');
      }
    } catch (err) {
      alert('Network error. Unable to update staff role.');
    }
  };

  const handleDeleteAdmin = (admin: Admin) => {
    if (activeAdmin?.role !== 'admin' && activeAdmin?.id !== 1) {
      alert('Access Denied: Only administrators with the "admin" role can remove staff members.');
      return;
    }
    if (activeAdmin?.id === admin.id) {
      alert('Access Denied: You cannot delete your own logged-in administrator session.');
      return;
    }
    setDeleteConfirm({
      type: 'admin',
      id: admin.id.toString(),
      label: `Are you sure you want to permanently delete staff account "${admin.name}" (${admin.email})?`
    });
  };

  // Translation status helper and API invoker
  const [translatingField, setTranslatingField] = useState<string | null>(null);

  const handleTranslate = async (text: string, targetLang: 'en' | 'bn', callback: (translated: string) => void, fieldId: string) => {
    if (!text.trim()) return;
    setTranslatingField(fieldId);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang }),
      });
      const data = await res.json();
      if (data.translated) {
        callback(data.translated);
      }
    } catch (e) {
      console.error('Translation failed', e);
    } finally {
      setTranslatingField(null);
    }
  };

  // Save Dynamic Payment settings
  const handleSavePaymentSettings = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeAdmin?.role && activeAdmin.role !== 'admin') {
      alert('Access Denied: You must have the "admin" role to change payment gateway configurations.');
      return;
    }

    db.setPaymentSettings({
      bkash_number: bkashNumSetting,
      nagad_number: nagadNumSetting,
      delivery_inside_dhaka: Number(deliveryInsideDhaka),
      delivery_outside_dhaka: Number(deliveryOutsideDhaka)
    });
    alert(lang === 'en' ? 'Settings and Delivery charges saved successfully!' : 'পেমেন্ট গেটওয়ে এবং ডেলিভারি চার্জ সফলভাবে সংরক্ষিত হয়েছে!');
  };

  // Coupons Manager
  const handleToggleCoupon = (code: string) => {
    if (activeAdmin?.role && activeAdmin.role !== 'admin') {
      alert('Access Denied: You must have the "admin" role to toggle coupon codes.');
      return;
    }

    const updated = coupons.map(c => {
      if (c.code === code) return { ...c, is_active: !c.is_active };
      return c;
    });
    db.setCoupons(updated);
    setCoupons(updated);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeAdmin?.role && activeAdmin.role !== 'admin') {
      alert('Access Denied: You must have the "admin" role to generate promo coupon codes.');
      return;
    }

    if (!newCouponCode.trim() || !newCouponDescEn.trim()) return;

    const code = newCouponCode.trim().toUpperCase();
    if (coupons.some(c => c.code === code)) {
      alert('Coupon with this code already exists!');
      return;
    }

    const payload: Coupon = {
      code,
      discount_percent: Number(newCouponPercent),
      description_en: newCouponDescEn,
      description_bn: newCouponDescBn || newCouponDescEn,
      is_active: true
    };

    const updated = [payload, ...coupons];
    db.setCoupons(updated);
    setCoupons(updated);

    setNewCouponCode('');
    setNewCouponDescEn('');
    setNewCouponDescBn('');
  };

  // Chats replies Manager
  const handleSelectChat = (chat: Chat) => {
    setSelectedChatUser(chat);
    
    // Mark as read by admin
    const chatsList = db.getChats();
    const updated = chatsList.map(c => {
      if (c.user_id === chat.user_id) {
        return { ...c, unread_by_admin: false };
      }
      return c;
    });
    db.setChats(updated);
    setChats(updated);
  };

  const handleSendChatReply = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeAdmin?.role === 'viewer') {
      alert('Access Denied: Read-only viewers cannot reply to customer support chats.');
      return;
    }

    if (!chatReply.trim() || !selectedChatUser) return;

    const replyMsg = {
      id: `msg-${Date.now()}`,
      sender: 'admin' as const,
      text: chatReply,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...selectedChatUser.messages, replyMsg];
    
    // Update local state
    const updatedUser = {
      ...selectedChatUser,
      messages: updatedMessages,
      unread_by_customer: true,
      unread_by_admin: false,
      last_message_at: new Date().toISOString()
    };
    setSelectedChatUser(updatedUser);
    setChatReply('');

    // Update global db
    const chatsList = db.getChats();
    const updatedList = chatsList.map(c => {
      if (c.user_id === selectedChatUser.user_id) {
        return updatedUser;
      }
      return c;
    });
    db.setChats(updatedList);
    setChats(updatedList);
  };

  // Banner customize Manager
  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeAdmin?.role && activeAdmin.role !== 'admin') {
      alert('Access Denied: You must have the "admin" role to alter the boutique storefront banner.');
      return;
    }

    if (!bannerTitleEn || !bannerImg) return;

    const payload: BannerConfig = {
      id: 'primary',
      title_en: bannerTitleEn,
      title_bn: bannerTitleBn,
      subtitle_en: bannerSubEn,
      subtitle_bn: bannerSubBn,
      image: bannerImg
    };

    db.setBanner(payload);
    setBanner(payload);
    alert('Homepage Banner customization saved successfully!');
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setBannerImg(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Global Notification triggerer
  const handleDispatchNotification = (e: React.FormEvent) => {
    e.preventDefault();

    if (activeAdmin?.role && activeAdmin.role !== 'admin') {
      alert('Access Denied: You must have the "admin" role to broadcast global alert notifications.');
      return;
    }

    if (!notifTitleEn || !notifMsgEn) return;

    const payload: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title_en: notifTitleEn,
      title_bn: notifTitleBn || notifTitleEn,
      message_en: notifMsgEn,
      message_bn: notifMsgBn || notifMsgEn,
      time: 'Just now',
      type: notifType,
      read: false
    };

    const updated = [payload, ...db.getNotifications()];
    db.setNotifications(updated);
    setLocalNotifications(updated);
    setNotifications(updated);

    setNotifTitleEn('');
    setNotifTitleBn('');
    setNotifMsgEn('');
    setNotifMsgBn('');
    alert('Global alert notification dispatched to all store visitors successfully!');
  };

  // Stats Calculations
  const getTotalSalesUSD = () => {
    return orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_usd, 0);
  };

  const getTotalSalesBDT = () => {
    return orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total_bdt, 0);
  };

  const getLowStockCount = () => {
    return products.filter(p => p.stock <= 5).length;
  };

  const getUnreadChatsCount = () => {
    return chats.filter(c => c.unread_by_admin).length;
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 font-sans text-stone-950 animate-in fade-in duration-300" id="admin-login-screen">
        <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-md w-full border border-stone-200 p-8">
          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 bg-amber-950 text-amber-100 rounded-2xl items-center justify-center border border-amber-800 shadow-md mb-3">
              <span className="font-serif font-black text-lg tracking-widest">WZ</span>
            </div>
            <h2 className="font-serif font-bold text-2xl text-stone-900">
              {signUpMode ? 'Register Admin Portal' : 'Admin Gatekeeper'}
            </h2>
            <p className="text-stone-500 text-[10px] mt-1 uppercase tracking-wider font-mono">
              {signUpMode ? 'Register new staff credentials' : 'Wallet Zone Public Schema Portal'}
            </p>
          </div>

          {/* Toggle Tabs */}
          <div className="flex bg-stone-100 p-1.5 rounded-2xl mb-6 border">
            <button
              type="button"
              onClick={() => { setSignUpMode(false); setAuthError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${!signUpMode ? 'bg-white text-stone-900 shadow' : 'text-stone-500 hover:text-stone-800'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setSignUpMode(true); setAuthError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-150 ${signUpMode ? 'bg-white text-stone-900 shadow' : 'text-stone-500 hover:text-stone-800'}`}
            >
              Sign Up
            </button>
          </div>

          {!signUpMode ? (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. superadmin@walletzone.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3.5 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                  Security Pin Code
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter PIN (e.g. 2580)"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3.5 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              {authError && (
                <p className="text-red-600 text-xs font-semibold bg-red-50 p-2 rounded-lg text-center">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl font-bold uppercase text-xs tracking-widest shadow transition-all duration-200 mt-2"
              >
                Authenticate Portal
              </button>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  placeholder="e.g. MD. Ramjan Islam"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3.5 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  placeholder="e.g. ramjan@walletzone.com"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3.5 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3.5 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                  Security Pin / Password
                </label>
                <input
                  type="password"
                  required
                  value={signUpPassword}
                  onChange={(e) => setSignUpPassword(e.target.value)}
                  placeholder="e.g. 1234"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3.5 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div>
                <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                  Assigned Portal Role
                </label>
                <select
                  value={signUpRole}
                  onChange={(e) => setSignUpRole(e.target.value as 'admin' | 'moderator' | 'viewer')}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3.5 text-stone-800 text-xs font-bold uppercase focus:outline-none focus:ring-1 focus:ring-amber-800"
                >
                  <option value="admin">Administrator (Full Control)</option>
                  <option value="moderator">Moderator (Manage Orders & Chat Only)</option>
                  <option value="viewer">Viewer (Read-Only Portal Access)</option>
                </select>
                <p className="text-[10px] text-stone-400 mt-1">
                  {signUpRole === 'admin' && '⭐ Admin role can manage products, customized banners, gateway setup, and staff.'}
                  {signUpRole === 'moderator' && '🛠️ Moderator role can update orders and chat, but cannot delete products or change setup.'}
                  {signUpRole === 'viewer' && '👁️ Viewer role can view portal charts/data but cannot alter or delete anything.'}
                </p>
              </div>

              {authError && (
                <p className="text-red-600 text-xs font-semibold bg-red-50 p-2 rounded-lg text-center">
                  {authError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl font-bold uppercase text-xs tracking-widest shadow transition-all duration-200 mt-2"
              >
                Register Portal Credentials
              </button>
            </form>
          )}

          <div className="mt-6 border-t border-stone-100 pt-4 text-center">
            <button
              onClick={onBackToShop}
              className="text-stone-500 hover:text-stone-800 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to boutique shop
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900" id="admin-dashboard-panel">
      {/* Admin Top Header bar */}
      <header className="bg-amber-950 text-stone-100 px-6 py-4 flex items-center justify-between border-b border-amber-900 shadow-md">
        <div className="flex items-center gap-3">
          <span className="font-serif font-black text-amber-100 text-xl tracking-widest bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-800">WZ</span>
          <div>
            <h2 className="font-serif font-bold text-base tracking-wide text-amber-100 uppercase">
              Wallet Zone Portal
            </h2>
            <p className="text-[10px] text-stone-300 font-mono">
              Welcome, <span className="text-emerald-400 font-semibold">{activeAdmin?.name}</span> (Schema Admin)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={onBackToShop}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/40 border border-amber-800 rounded-xl text-xs font-semibold text-amber-200 hover:bg-amber-900/60"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Storefront</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/40 border border-red-900/50 rounded-xl text-xs font-semibold text-red-200 hover:bg-red-950/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Lock Portal</span>
          </button>
        </div>
      </header>

      {/* Main Admin layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Navigation Sidebar */}
        <aside className="lg:w-64 bg-stone-900 text-stone-400 p-4 border-b lg:border-b-0 lg:border-r border-stone-800 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible lg:space-y-1 shrink-0 scrollbar-none">
          <div className="hidden lg:block px-3 pb-3 mb-4 border-b border-stone-800 text-[10px] uppercase font-bold tracking-widest text-stone-500">
            Navigation Rail
          </div>
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
              activeTab === 'dashboard' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors relative ${
              activeTab === 'orders' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Orders</span>
            {orders.filter(o => o.status === 'pending').length > 0 && (
              <span className="ml-1.5 lg:ml-auto font-mono text-[9px] font-bold bg-amber-400 text-stone-950 px-1.5 py-0.5 rounded">
                {orders.filter(o => o.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
              activeTab === 'products' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab('coupons')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
              activeTab === 'coupons' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Coupons</span>
          </button>

          <button
            onClick={() => setActiveTab('chats')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors relative ${
              activeTab === 'chats' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chats</span>
            {getUnreadChatsCount() > 0 && (
              <span className="ml-1.5 lg:ml-auto font-mono text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                {getUnreadChatsCount()}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('banner')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
              activeTab === 'banner' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Banner</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
              activeTab === 'notifications' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Alerts</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
              activeTab === 'settings' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Gateways</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`shrink-0 w-auto lg:w-full text-left py-2 px-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2.5 transition-colors ${
              activeTab === 'admins' ? 'bg-amber-950 text-amber-100 font-black' : 'hover:bg-stone-800 hover:text-stone-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff & Roles</span>
          </button>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-70px)] bg-stone-50">
          
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Operational Overview</h3>
                  <p className="text-xs text-stone-500">Real-time telemetry extracted from active local storage sessions.</p>
                </div>
                <button
                  onClick={refreshDatabaseStates}
                  className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase flex items-center gap-1.5 self-start shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Telemetry</span>
                </button>
              </div>

              {supabaseSetupNeeded && (
                <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-start gap-4">
                    <span className="p-3 bg-amber-100 text-amber-900 rounded-xl">
                      <Database className="w-6 h-6 animate-pulse" />
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-serif font-black text-amber-950 uppercase tracking-tight text-sm sm:text-base">
                        Supabase Database Setup Needed / সুপাবেস ডাটাবেস সেটআপ প্রয়োজন
                      </h4>
                      <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                        Your Wallet Zone website is connected to your Supabase project, but the <code className="bg-amber-100/80 px-1 py-0.5 rounded text-amber-950 font-bold font-mono">wzone_store</code> table does not exist yet. Paste the following SQL script inside your Supabase <strong>SQL Editor</strong> and click "Run" to initialize it instantly! Once initialized, reload the website to complete the link.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-stone-900 rounded-xl p-4 font-mono text-[10px] sm:text-xs text-stone-200 overflow-x-auto relative group">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(supabaseSetupSql);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 3000);
                      }}
                      className="absolute right-3 top-3 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-sans font-bold transition-all uppercase"
                    >
                      {copiedSql ? 'Copied! / কপি হয়েছে' : 'Copy SQL / কপি করুন'}
                    </button>
                    <pre className="mt-2 text-stone-300 leading-relaxed whitespace-pre-wrap">{supabaseSetupSql}</pre>
                  </div>
                </div>
              )}

              {/* Bento Grid Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stat 1: Revenue BDT */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                  <span className="p-3 bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200">
                    <DollarSign className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total Sales (BDT)</span>
                    <h4 className="text-xl font-bold font-mono text-stone-900 mt-0.5">৳{getTotalSalesBDT()}</h4>
                  </div>
                </div>

                {/* Stat 2: Revenue USD */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                  <span className="p-3 bg-amber-100 text-amber-800 rounded-xl border border-amber-200">
                    <DollarSign className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total Sales (USD)</span>
                    <h4 className="text-xl font-bold font-mono text-stone-900 mt-0.5">${getTotalSalesUSD().toFixed(2)}</h4>
                  </div>
                </div>

                {/* Stat 3: Total orders */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                  <span className="p-3 bg-purple-100 text-purple-800 rounded-xl border border-purple-200">
                    <ShoppingBag className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Total Orders</span>
                    <h4 className="text-xl font-bold font-mono text-stone-900 mt-0.5">{orders.length} Package(s)</h4>
                  </div>
                </div>

                {/* Stat 4: Low stock warnings */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center gap-4">
                  <span className="p-3 bg-red-100 text-red-800 rounded-xl border border-red-200">
                    <AlertTriangle className="w-6 h-6" />
                  </span>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Low Stock Warnings</span>
                    <h4 className="text-xl font-bold font-mono text-stone-900 mt-0.5">{getLowStockCount()} Item(s)</h4>
                  </div>
                </div>
              </div>

              {/* Quick links to actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Recent orders snippet */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                    <h4 className="font-serif font-bold text-stone-900 text-sm uppercase">Recent Invoice Records</h4>
                    <button onClick={() => setActiveTab('orders')} className="text-amber-800 hover:underline text-xs font-bold uppercase">View All</button>
                  </div>
                  <div className="space-y-3.5">
                    {orders.slice(0, 3).map(order => (
                      <div key={order.id} className="flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-stone-800">{order.customer_name} ({order.id})</p>
                          <p className="text-stone-400 text-[10px] font-mono">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-stone-950">৳{order.total_bdt}</p>
                          <span className={`inline-block text-[9px] font-bold uppercase px-1.5 py-0.5 rounded mt-0.5 ${
                            order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            order.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                            'bg-stone-100 text-stone-600'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Low inventory alert snippets */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                    <h4 className="font-serif font-bold text-stone-900 text-sm uppercase">Stock Warning Monitor</h4>
                    <button onClick={() => setActiveTab('products')} className="text-amber-800 hover:underline text-xs font-bold uppercase">Manage stock</button>
                  </div>
                  <div className="space-y-3">
                    {products.filter(p => p.stock <= 5).map(prod => (
                      <div key={prod.id} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <img src={prod.image} alt="" className="w-8 h-8 object-cover rounded-lg" />
                          <span className="font-medium text-stone-800">{prod.name_en}</span>
                        </div>
                        <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                          {prod.stock} left in stock
                        </span>
                      </div>
                    ))}
                    {products.filter(p => p.stock <= 5).length === 0 && (
                      <p className="text-center text-stone-400 py-6 text-xs font-semibold">
                        All masterworks have healthy inventory. Excellent work!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Bespoke Orders Ledger</h3>
                  <p className="text-xs text-stone-500">Record of customer transaction invoices, shipping addresses, and status controls.</p>
                </div>
                {/* Filter Controls */}
                <select 
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-stone-700"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Pending Packages</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {orders.filter(o => orderFilter === 'all' || o.status === orderFilter).length === 0 ? (
                <div className="bg-white p-12 text-center border border-stone-200 rounded-2xl shadow-sm text-stone-400 text-xs font-semibold">
                  No orders found matching: {orderFilter.toUpperCase()}
                </div>
              ) : (
                <div className="space-y-6">
                  {orders
                    .filter(o => orderFilter === 'all' || o.status === orderFilter)
                    .map(order => (
                      <div key={order.id} className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 pb-3">
                          <div>
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono">Invoice Reference</span>
                            <h4 className="text-sm font-bold text-stone-900 font-mono">{order.id}</h4>
                          </div>
                          <div>
                            <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider font-mono">Status Controller</span>
                            <div className="flex items-center gap-2 mt-1">
                              <select
                                value={order.status}
                                onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as Order['status'])}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase border ${
                                  order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                  order.status === 'pending' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                  order.status === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200' :
                                  'bg-stone-50 text-stone-700 border-stone-200'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>

                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg hover:text-red-700 transition-colors flex items-center justify-center shrink-0"
                                title={lang === 'en' ? 'Delete Order' : 'অর্ডার মুছুন'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Customer & Item details columns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                          {/* Col 1: Customer Bio */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-stone-800 uppercase tracking-wider border-b border-stone-50 pb-1">Customer Profile</h5>
                            <p className="flex items-center gap-1.5 text-stone-600"><User className="w-3.5 h-3.5 text-stone-400" /> <span>{order.customer_name}</span></p>
                            <p className="flex items-center gap-1.5 text-stone-600"><Phone className="w-3.5 h-3.5 text-stone-400" /> <span>{order.customer_phone}</span></p>
                            {order.customer_email && order.customer_email !== 'N/A' && (
                              <p className="flex items-center gap-1.5 text-stone-600"><Mail className="w-3.5 h-3.5 text-stone-400" /> <span>{order.customer_email}</span></p>
                            )}
                            <p className="flex items-center gap-1.5 text-stone-600 leading-normal"><MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" /> <span>{order.shipping_address}</span></p>
                          </div>

                          {/* Col 2: Bill Summary */}
                          <div className="space-y-2">
                            <h5 className="font-bold text-stone-800 uppercase tracking-wider border-b border-stone-50 pb-1">Package Invoice</h5>
                            <div className="space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-100">
                              {order.items.map((i, index) => (
                                <div key={index} className="flex justify-between">
                                  <span>{i.name_en} (x{i.quantity})</span>
                                  <span className="font-mono font-semibold">৳{i.price_bdt * i.quantity}</span>
                                </div>
                              ))}
                              {order.discount_percent > 0 && (
                                <div className="text-emerald-700 font-semibold flex justify-between pt-1 border-t border-stone-200/50">
                                  <span>Discount (Coupon: {order.coupon_applied})</span>
                                  <span>-{order.discount_percent}%</span>
                                </div>
                              )}
                              <div className="flex justify-between font-bold text-stone-900 border-t border-stone-200/50 pt-1.5 mt-1">
                                <span>Sales Total</span>
                                <span className="font-mono text-amber-900">৳{order.total_bdt}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">
                              Payment Option: <span className="text-stone-700 font-semibold">{order.payment_method}</span> {order.payment_details && `(${order.payment_details})`}
                            </p>
                          </div>
                        </div>

                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: MANAGE PRODUCTS (CRUD) */}
          {activeTab === 'products' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Product Catalog Master</h3>
                  <p className="text-xs text-stone-500">Create, edit, and delete products with bilingual descriptions and specs.</p>
                </div>
                <button
                  onClick={() => handleOpenProductModal()}
                  className="px-4 py-2 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Register Product</span>
                </button>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-100 text-stone-500 uppercase tracking-widest font-mono border-b border-stone-200">
                      <th className="p-4">Product ID</th>
                      <th className="p-4">Name (English / Bengali)</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Price (USD / BDT)</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4 text-center">Featured</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-stone-700">
                    {products.map(prod => (
                      <tr key={prod.id} className="hover:bg-stone-50 transition-colors">
                        <td className="p-4 font-mono font-semibold">{prod.id}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={prod.image} alt="" className="w-10 h-10 object-cover rounded-lg border" />
                            <div>
                              <p className="font-bold text-stone-900">{prod.name_en}</p>
                              <p className="text-stone-400 font-serif font-semibold">{prod.name_bn}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold uppercase">{prod.category}</td>
                        <td className="p-4 font-mono font-bold text-amber-900">
                          ৳{prod.price_bdt}
                        </td>
                        <td className="p-4">
                          <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                            prod.stock <= 0 ? 'bg-red-50 text-red-600' :
                            prod.stock <= 5 ? 'bg-amber-50 text-amber-600' :
                            'bg-stone-100 text-stone-700'
                          }`}>
                            {prod.stock} Units
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {prod.featured ? (
                            <span className="inline-block bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded border border-emerald-100">Yes</span>
                          ) : (
                            <span className="inline-block bg-stone-100 text-stone-400 px-1.5 py-0.5 rounded">No</span>
                          )}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenProductModal(prod)}
                            className="p-1.5 hover:bg-amber-100 text-amber-900 rounded transition-colors inline-block"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 hover:bg-red-100 text-red-600 rounded transition-colors inline-block"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BESPOKE COUPONS */}
          {activeTab === 'coupons' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-stone-200 pb-4">
                <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Bespoke Coupons Configuration</h3>
                <p className="text-xs text-stone-500">Configure promotional voucher codes and discount percentages.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Coupon creation form */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm self-start">
                  <h4 className="font-serif font-bold text-stone-900 text-sm uppercase mb-4 border-b pb-2">Generate Voucher</h4>
                  <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Coupon Promo Code</label>
                      <input
                        type="text"
                        required
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        placeholder="e.g. AUTUMN30"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-bold uppercase focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Discount Percent (%)</label>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        required
                        value={newCouponPercent}
                        onChange={(e) => setNewCouponPercent(Number(e.target.value))}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-mono font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Description (English)</label>
                      <input
                        type="text"
                        required
                        value={newCouponDescEn}
                        onChange={(e) => setNewCouponDescEn(e.target.value)}
                        placeholder="Save 30% flat on collections"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Description (Bengali)</label>
                      <input
                        type="text"
                        value={newCouponDescBn}
                        onChange={(e) => setNewCouponDescBn(e.target.value)}
                        placeholder="ফ্ল্যাট ৩০% ডিসকাউন্ট উপভোগ করুন"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-stone-950 text-white hover:bg-stone-800 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                    >
                      Publish Voucher code
                    </button>
                  </form>
                </div>

                {/* Coupons list */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-stone-100 text-stone-500 uppercase tracking-widest font-mono border-b border-stone-200">
                        <th className="p-4">Voucher Code</th>
                        <th className="p-4">Discount</th>
                        <th className="p-4">Description (English / Bengali)</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Toggle Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      {coupons.map(coupon => (
                        <tr key={coupon.code} className="hover:bg-stone-50">
                          <td className="p-4 font-mono font-bold text-stone-900">{coupon.code}</td>
                          <td className="p-4 font-mono font-bold text-amber-900">{coupon.discount_percent}% Off</td>
                          <td className="p-4 leading-normal">
                            <p className="font-semibold text-stone-800">{coupon.description_en}</p>
                            <p className="text-stone-400">{coupon.description_bn}</p>
                          </td>
                          <td className="p-4 text-center">
                            {coupon.is_active ? (
                              <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-100">ACTIVE</span>
                            ) : (
                              <span className="bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded border border-red-100">INACTIVE</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleCoupon(coupon.code)}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider ${
                                  coupon.is_active 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                }`}
                              >
                                {coupon.is_active ? 'Disable' : 'Enable'}
                              </button>

                              <button
                                onClick={() => handleDeleteCoupon(coupon.code)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg hover:text-red-700 transition-colors flex items-center justify-center shrink-0"
                                title={lang === 'en' ? 'Delete Coupon' : 'কুপন মুছুন'}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CUSTOMER CHATS */}
          {activeTab === 'chats' && (
            <div className="space-y-6 animate-in fade-in duration-200 h-[calc(100vh-160px)] flex flex-col">
              <div className="border-b border-stone-200 pb-4">
                <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Customer Support Channels</h3>
                <p className="text-xs text-stone-500">Live conversation pipeline with active store visitors powered by standard schema buffers.</p>
              </div>

              <div className="flex-1 flex flex-col md:flex-row bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden h-[400px]">
                {/* Users List */}
                <div className="md:w-80 border-r border-stone-200 flex flex-col overflow-y-auto">
                  <div className="p-4 bg-stone-50 border-b border-stone-200 text-xs font-bold text-stone-500 uppercase tracking-wider">
                    Visitor Pipelines
                  </div>
                  <div className="divide-y divide-stone-100">
                    {chats.length === 0 ? (
                      <p className="p-6 text-center text-stone-400 text-xs">
                        No customer live chat channels active.
                      </p>
                    ) : (
                      chats.map(chat => {
                        const isSelected = selectedChatUser?.user_id === chat.user_id;
                        return (
                          <div key={chat.user_id} className="relative group">
                            <button
                              onClick={() => handleSelectChat(chat)}
                              className={`w-full p-4 text-left hover:bg-stone-50 flex items-start gap-3 transition-colors ${
                                isSelected ? 'bg-amber-50/50' : ''
                              }`}
                            >
                              <div className="w-8 h-8 bg-amber-950 text-amber-100 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                                {chat.user_name[0]}
                              </div>
                              <div className="flex-1 min-w-0 pr-6">
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-xs text-stone-800 truncate">{chat.user_name}</h5>
                                  {chat.unread_by_admin && (
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping animate-pulse" />
                                  )}
                                </div>
                                <p className="text-stone-400 text-[10px] font-mono mt-0.5">{chat.user_phone}</p>
                                <p className="text-stone-500 text-[11px] truncate leading-normal mt-1.5">
                                  {chat.messages[chat.messages.length - 1]?.text}
                                </p>
                              </div>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChat(chat.user_id);
                              }}
                              className="absolute right-3 top-4 p-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-red-100"
                              title={lang === 'en' ? 'Delete Chat' : 'চ্যাট মুছুন'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Conversation Panel */}
                <div className="flex-1 flex flex-col bg-stone-50">
                  {selectedChatUser ? (
                    <>
                      {/* Active Chat Header */}
                      <div className="p-4 bg-white border-b border-stone-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm">{selectedChatUser.user_name}</h4>
                          <p className="text-stone-400 text-[10px] font-mono mt-0.5">
                            Active Phone: {selectedChatUser.user_phone} | Channel: {selectedChatUser.user_id}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDeleteChat(selectedChatUser.user_id)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:text-red-700 transition-colors"
                            title={lang === 'en' ? 'Delete Chat Thread' : 'চ্যাট কথোপকথন মুছুন'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{lang === 'en' ? 'Delete Channel' : 'চ্যানেল মুছুন'}</span>
                          </button>

                          <button
                            onClick={() => setSelectedChatUser(null)}
                            className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
                          >
                            Clear Window
                          </button>
                        </div>
                      </div>

                      {/* Active messages list */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {selectedChatUser.messages.map((msg, index) => (
                          <div
                            key={index}
                            className={`flex flex-col ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[9px] text-stone-400 font-mono">
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">
                                {msg.sender === 'admin' ? 'Portal Admin' : 'Visitor'}
                              </span>
                            </div>
                            <div className={`max-w-[80%] rounded-xl px-3.5 py-2 text-xs shadow-sm ${
                              msg.sender === 'admin'
                                ? 'bg-stone-900 text-stone-100 rounded-tr-none'
                                : 'bg-white text-stone-800 border rounded-tl-none'
                            }`}>
                              <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatScrollRef} />
                      </div>

                      {/* Reply box form with translator toolbar */}
                      <div className="border-t border-stone-200 bg-white">
                        <div className="flex flex-wrap gap-3 px-4 py-1.5 bg-stone-50 border-b text-[10px] items-center text-stone-500 font-sans font-bold">
                          <span className="uppercase tracking-widest text-stone-400">Quick Translator:</span>
                          <button
                            type="button"
                            onClick={() => handleTranslate(chatReply, 'bn', setChatReply, 'chatReplyBN')}
                            disabled={translatingField === 'chatReplyBN' || !chatReply.trim()}
                            className="text-amber-800 hover:text-amber-950 hover:underline disabled:opacity-40"
                          >
                            {translatingField === 'chatReplyBN' ? 'Translating to BN...' : 'Write EN ➔ Translate to BN ⇄'}
                          </button>
                          <span className="text-stone-300">|</span>
                          <button
                            type="button"
                            onClick={() => handleTranslate(chatReply, 'en', setChatReply, 'chatReplyEN')}
                            disabled={translatingField === 'chatReplyEN' || !chatReply.trim()}
                            className="text-amber-800 hover:text-amber-950 hover:underline disabled:opacity-40"
                          >
                            {translatingField === 'chatReplyEN' ? 'Translating to EN...' : 'Write BN ➔ Translate to EN ⇄'}
                          </button>
                        </div>
                        <form onSubmit={handleSendChatReply} className="p-3 flex items-center gap-2">
                          <input
                            type="text"
                            value={chatReply}
                            onChange={(e) => setChatReply(e.target.value)}
                            placeholder="Type response (write in BN or EN and click Translate above if needed)..."
                            className="flex-1 bg-stone-100 rounded-xl px-4 py-2 text-xs text-stone-800 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!chatReply.trim()}
                            className="p-2.5 bg-stone-900 text-amber-100 rounded-xl hover:bg-stone-800"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </form>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-stone-400 text-xs p-6">
                      <MessageSquare className="w-12 h-12 text-stone-300 mb-2" />
                      Select a customer Visitor Pipeline on the left to read and reply.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BANNER CUSTOMIZER */}
          {activeTab === 'banner' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-stone-200 pb-4">
                <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Storefront Banner Customizer</h3>
                <p className="text-xs text-stone-500">Edit homepage title slogans, copy, translations, and backdrop image instantly.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm max-w-3xl">
                <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Banner Title (English)</label>
                      <input
                        type="text"
                        required
                        value={bannerTitleEn}
                        onChange={(e) => setBannerTitleEn(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-bold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Banner Title (Bengali)</label>
                      <input
                        type="text"
                        required
                        value={bannerTitleBn}
                        onChange={(e) => setBannerTitleBn(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Banner Subtitle (English)</label>
                      <textarea
                        rows={3}
                        required
                        value={bannerSubEn}
                        onChange={(e) => setBannerSubEn(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Banner Subtitle (Bengali)</label>
                      <textarea
                        rows={3}
                        required
                        value={bannerSubBn}
                        onChange={(e) => setBannerSubBn(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                      />
                    </div>
                  </div>

                   <div>
                    <label className="block text-stone-700 font-bold mb-1 uppercase tracking-wider">Banner Backdrop Image</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-stone-500 text-[10px] mb-1 font-semibold uppercase tracking-wider">Option A: Upload Image File</span>
                        <div className="relative border-2 border-dashed border-stone-300 rounded-xl p-4 hover:bg-stone-50 transition-colors flex flex-col items-center justify-center text-center cursor-pointer min-h-[95px]">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBannerImageUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                          <Image className="w-5 h-5 text-stone-400 mb-1" />
                          <span className="text-stone-700 font-bold block text-[10px]">Choose file or drag here</span>
                          <span className="text-stone-400 text-[8px]">Supports PNG, JPG, WEBP</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-stone-500 text-[10px] mb-1 font-semibold uppercase tracking-wider">Option B: Enter Backdrop Image URL</span>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={bannerImg.startsWith('data:') ? '' : bannerImg}
                          onChange={(e) => setBannerImg(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none text-[11px]"
                        />
                        <p className="text-stone-400 text-[9px] mt-1.5 leading-normal">Or supply a high-quality hosted asset URL or Unsplash image endpoint.</p>
                      </div>
                    </div>

                    {bannerImg && (
                      <div className="mt-4">
                        <span className="block text-stone-500 text-[10px] mb-1 font-semibold uppercase tracking-wider">Current Backdrop Live Preview:</span>
                        <div className="relative rounded-xl overflow-hidden aspect-[21/9] border border-stone-200">
                          <img 
                            src={bannerImg} 
                            alt="Banner Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setBannerImg('')}
                            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white hover:bg-red-700 rounded-full text-xs shadow-md transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-stone-950 text-white hover:bg-stone-800 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                  >
                    Commit Banner Configurations
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 7: ALERTS & NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-stone-200 pb-4">
                <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Alerts & Broadcast Dispatcher</h3>
                <p className="text-xs text-stone-500">Dispatch global update alert notifications visible inside customer header bell panels.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Notification dispatch form */}
                <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm self-start">
                  <h4 className="font-serif font-bold text-stone-900 text-sm uppercase mb-4 border-b pb-2">Broadcast Alert</h4>
                  <form onSubmit={handleDispatchNotification} className="space-y-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-stone-700 font-semibold uppercase tracking-wider">Title (English)</label>
                        <button
                          type="button"
                          onClick={() => handleTranslate(notifTitleEn, 'bn', setNotifTitleBn, 'notifTitleEn')}
                          disabled={translatingField === 'notifTitleEn'}
                          className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          {translatingField === 'notifTitleEn' ? 'Translating...' : 'Auto-Translate to BN ⇄'}
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={notifTitleEn}
                        onChange={(e) => setNotifTitleEn(e.target.value)}
                        placeholder="e.g. Free Delivery Alert"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-stone-700 font-semibold uppercase tracking-wider">Title (Bengali)</label>
                        <button
                          type="button"
                          onClick={() => handleTranslate(notifTitleBn, 'en', setNotifTitleEn, 'notifTitleBn')}
                          disabled={translatingField === 'notifTitleBn'}
                          className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          {translatingField === 'notifTitleBn' ? 'Translating...' : 'Auto-Translate to EN ⇄'}
                        </button>
                      </div>
                      <input
                        type="text"
                        value={notifTitleBn}
                        onChange={(e) => setNotifTitleBn(e.target.value)}
                        placeholder="উদাঃ ফ্রি ডেলিভারি অফার"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-stone-700 font-semibold uppercase tracking-wider">Message (English)</label>
                        <button
                          type="button"
                          onClick={() => handleTranslate(notifMsgEn, 'bn', setNotifMsgBn, 'notifMsgEn')}
                          disabled={translatingField === 'notifMsgEn'}
                          className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          {translatingField === 'notifMsgEn' ? 'Translating...' : 'Auto-Translate to BN ⇄'}
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        required
                        value={notifMsgEn}
                        onChange={(e) => setNotifMsgEn(e.target.value)}
                        placeholder="Free shipping is now unlocked for all orders inside BD!"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-stone-700 font-semibold uppercase tracking-wider">Message (Bengali)</label>
                        <button
                          type="button"
                          onClick={() => handleTranslate(notifMsgBn, 'en', setNotifMsgEn, 'notifMsgBn')}
                          disabled={translatingField === 'notifMsgBn'}
                          className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                        >
                          {translatingField === 'notifMsgBn' ? 'Translating...' : 'Auto-Translate to EN ⇄'}
                        </button>
                      </div>
                      <textarea
                        rows={3}
                        value={notifMsgBn}
                        onChange={(e) => setNotifMsgBn(e.target.value)}
                        placeholder="বাংলাদেশ জুড়ে সব অর্ডারে এখন সম্পূর্ণ ফ্রী ডেলিভারি!"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-700 font-semibold mb-1 uppercase tracking-wider">Severity Level</label>
                      <div className="flex gap-2">
                        {['info', 'success', 'alert'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNotifType(type as any)}
                            className={`py-1.5 px-3 border rounded-lg uppercase text-[9px] font-bold flex-1 ${
                              notifType === type 
                                ? 'bg-amber-950 text-amber-100 border-amber-950' 
                                : 'bg-white text-stone-600 border-stone-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-stone-950 text-white hover:bg-stone-800 rounded-xl font-bold uppercase tracking-widest text-[10px]"
                    >
                      Broadcast Now
                    </button>
                  </form>
                </div>

                {/* Dispatch logs */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
                  <h4 className="font-serif font-bold text-stone-900 text-sm uppercase mb-4 border-b pb-2">Broadcast Dispatch Logs</h4>
                  <div className="space-y-4">
                    {notifications.map((n, idx) => (
                      <div key={`${n.id}-${idx}`} className="bg-stone-50 border rounded-2xl p-4 text-xs space-y-1 relative group">
                        <div className="flex items-center gap-2 pr-6">
                          <span className={`w-2 h-2 rounded-full ${
                            n.type === 'success' ? 'bg-emerald-500' : n.type === 'alert' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                          <h5 className="font-bold text-stone-800">{n.title_en} / {n.title_bn}</h5>
                          <span className="text-[10px] text-stone-400 ml-auto font-mono">{n.time}</span>
                        </div>
                        <p className="text-stone-500 leading-relaxed">{n.message_en}</p>
                        <p className="text-stone-400 font-serif font-semibold">{n.message_bn}</p>

                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          className="absolute right-3 top-3 p-1 text-red-600 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          title={lang === 'en' ? 'Delete Broadcast' : 'ব্রডকাস্ট মুছুন'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-stone-200 pb-4">
                <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Store Settings & Gateways Customizer</h3>
                <p className="text-xs text-stone-500">Configure public merchant numbers and delivery rates. Changes persist instantly across the portal.</p>
              </div>

              <div className="max-w-xl bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSavePaymentSettings} className="space-y-6 text-xs">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-stone-700 font-bold mb-1.5 uppercase tracking-wider">
                        bKash Payment Number
                      </label>
                      <input
                        type="text"
                        required
                        value={bkashNumSetting}
                        onChange={(e) => setBkashNumSetting(e.target.value)}
                        placeholder="e.g. 01951869220"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2.5 px-4 text-stone-800 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">This is the merchant/personal number customers will see during checkout when bKash is chosen.</p>
                    </div>

                    <div>
                      <label className="block text-stone-700 font-bold mb-1.5 uppercase tracking-wider">
                        Nagad Payment Number
                      </label>
                      <input
                        type="text"
                        required
                        value={nagadNumSetting}
                        onChange={(e) => setNagadNumSetting(e.target.value)}
                        placeholder="e.g. 01984680100"
                        className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2.5 px-4 text-stone-800 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                      />
                      <p className="text-[10px] text-stone-400 mt-1">This is the merchant/personal number customers will see during checkout when Nagad is chosen.</p>
                    </div>

                    <div className="border-t border-stone-200/80 pt-4 space-y-4">
                      <h4 className="font-serif font-black text-amber-950 uppercase tracking-tight text-xs sm:text-sm">
                        Delivery Charges / ডেলিভারি চার্জসমূহ
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-stone-700 font-bold mb-1.5 uppercase tracking-wider">
                            Inside Dhaka Delivery Charge (৳)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={deliveryInsideDhaka}
                            onChange={(e) => setDeliveryInsideDhaka(Number(e.target.value))}
                            placeholder="70"
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2.5 px-4 text-stone-800 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                          />
                        </div>

                        <div>
                          <label className="block text-stone-700 font-bold mb-1.5 uppercase tracking-wider">
                            Outside Dhaka Delivery Charge (৳)
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={deliveryOutsideDhaka}
                            onChange={(e) => setDeliveryOutsideDhaka(Number(e.target.value))}
                            placeholder="130"
                            className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2.5 px-4 text-stone-800 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-amber-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-950 hover:bg-amber-900 text-amber-100 rounded-xl font-bold uppercase tracking-wider text-[11px] shadow transition-colors"
                  >
                    Save Store Settings
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <div className="border-b border-stone-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif font-black text-2xl text-stone-900 uppercase">Team Members & Access Roles</h3>
                  <p className="text-xs text-stone-500">View registered staff, update security access roles, and monitor portal control privileges.</p>
                </div>
                <div className="bg-stone-200/60 px-4 py-2 rounded-xl text-xs text-stone-700 font-bold flex items-center gap-2 self-start md:self-auto">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Your Active Role: <span className="uppercase text-amber-950 font-black">{activeAdmin?.role || 'admin'}</span>
                </div>
              </div>

              {/* Roles Description Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-emerald-700 font-bold uppercase text-[10px] tracking-wider block mb-1">⭐ Administrator</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">Has absolute control over the storefront banner, product registry, promo coupons, payment numbers, customer chats, and staff roles.</p>
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-blue-700 font-bold uppercase text-[10px] tracking-wider block mb-1">🛠️ Moderator</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">Assigned to customer support. Can manage, update, and reply to client chat messages, track customer orders, but cannot add/delete products or alter system configurations.</p>
                </div>
                <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
                  <span className="text-amber-700 font-bold uppercase text-[10px] tracking-wider block mb-1">👁️ Read-Only Viewer</span>
                  <p className="text-[11px] text-stone-600 leading-relaxed">Can monitor live analytics dashboard, scroll products, and review order lists, but has zero write or delete clearance across the platform.</p>
                </div>
              </div>

              {/* Admins List Table */}
              <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-serif font-bold text-stone-900 uppercase text-xs tracking-wider">Active Staff Database</h4>
                  <span className="font-mono text-[10px] text-stone-500 font-bold bg-stone-200/50 px-2.5 py-1 rounded-lg">Total Staff: {adminsList.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-stone-50/50 border-b border-stone-100 text-stone-400 font-sans font-bold uppercase tracking-widest text-[9px]">
                        <th className="py-3 px-6">Name & Contacts</th>
                        <th className="py-3 px-6">Registered On</th>
                        <th className="py-3 px-6">Clearance Level</th>
                        <th className="py-3 px-6 text-right">Administrative Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {adminsList.map((adm) => {
                        const isSelf = activeAdmin?.id === adm.id;
                        const admRole = adm.role || 'admin';
                        return (
                          <tr key={adm.id} className="hover:bg-stone-50/40 transition-colors">
                            <td className="py-4 px-6">
                              <div className="font-sans font-black text-stone-900 text-sm flex items-center gap-1.5">
                                {adm.name}
                                {isSelf && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-950 font-sans font-bold rounded text-[9px] uppercase tracking-wider">You</span>}
                              </div>
                              <div className="text-stone-500 text-[11px] flex flex-wrap gap-x-3 gap-y-0.5 mt-1 font-mono">
                                <span>✉️ {adm.email}</span>
                                <span>📞 {adm.phone}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-stone-500 font-mono">
                              {adm.created_at ? new Date(adm.created_at).toLocaleDateString('en-US', { dateStyle: 'medium' }) : 'System Seeded'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-full border border-stone-200">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  admRole === 'admin' ? 'bg-emerald-500 animate-pulse' :
                                  admRole === 'moderator' ? 'bg-blue-500' :
                                  admRole === 'pending' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                                }`} />
                                <span className="font-sans font-bold uppercase tracking-wider text-[9px] text-stone-700">
                                  {admRole}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                {/* Role selection dropdown */}
                                <div className="flex items-center gap-1.5">
                                  <label className="text-[10px] text-stone-400 font-bold uppercase font-mono">Clearance:</label>
                                  <select
                                    value={admRole}
                                    disabled={activeAdmin?.role !== 'admin' && activeAdmin?.id !== 1}
                                    onChange={(e) => handleUpdateAdminRole(adm.id, e.target.value)}
                                    className="bg-stone-100 border border-stone-200 hover:border-stone-300 rounded-lg py-1 px-2 text-[10px] text-stone-700 font-bold focus:outline-none focus:ring-1 focus:ring-amber-800"
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="admin">Admin</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="viewer">Viewer</option>
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(adm)}
                                  disabled={isSelf || (activeAdmin?.role !== 'admin' && activeAdmin?.id !== 1)}
                                  className="p-1.5 hover:bg-red-50 text-stone-400 hover:text-red-600 rounded-xl disabled:opacity-40 transition-colors"
                                  title={isSelf ? 'Cannot delete yourself' : 'Delete user'}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* PRODUCT CREATION/EDIT MODAL (CRUD POPUP) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-stone-200 p-6 sm:p-8 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b mb-6">
              <h3 className="font-serif font-black text-xl text-stone-900 uppercase">
                {editingProduct ? 'Modify Product Specifications' : 'Register New Masterwork'}
              </h3>
              <button 
                onClick={() => { setShowProductModal(false); setEditingProduct(null); }}
                className="text-stone-400 hover:text-stone-600 p-1.5 hover:bg-stone-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Product Serial ID</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct}
                    value={prodId}
                    onChange={(e) => setProdId(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Store Category</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setProdCategory(cat);
                      if (cat === 'Wallets') {
                        setProdCategoryLabelEn('Premium Wallets');
                        setProdCategoryLabelBn('প্রিমিয়াম ওয়ালেটস');
                      } else if (cat === 'Belts') {
                        setProdCategoryLabelEn('Leather Belts');
                        setProdCategoryLabelBn('লেদার বেল্ট');
                      } else if (cat === 'Bags') {
                        setProdCategoryLabelEn('Travel & Office Bags');
                        setProdCategoryLabelBn('ভ্রমণ ও অফিস ব্যাগ');
                      } else {
                        setProdCategoryLabelEn('Elite Accessories');
                        setProdCategoryLabelBn('এলিট অ্যাকসেসরিজ');
                      }
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-bold focus:outline-none"
                  >
                    <option value="Wallets">Wallets</option>
                    <option value="Belts">Belts</option>
                    <option value="Bags">Bags</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-stone-700 font-semibold">Product Title (English)</label>
                    <button
                      type="button"
                      onClick={() => handleTranslate(prodNameEn, 'bn', setProdNameBn, 'prodNameEn')}
                      disabled={translatingField === 'prodNameEn'}
                      className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      {translatingField === 'prodNameEn' ? 'Translating...' : 'Auto-Translate to BN ⇄'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={prodNameEn}
                    onChange={(e) => setProdNameEn(e.target.value)}
                    placeholder="e.g. Royal Billfold Wallet"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-stone-700 font-semibold">Product Title (Bengali)</label>
                    <button
                      type="button"
                      onClick={() => handleTranslate(prodNameBn, 'en', setProdNameEn, 'prodNameBn')}
                      disabled={translatingField === 'prodNameBn'}
                      className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      {translatingField === 'prodNameBn' ? 'Translating...' : 'Auto-Translate to EN ⇄'}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={prodNameBn}
                    onChange={(e) => setProdNameBn(e.target.value)}
                    placeholder="উদাঃ রাজকীয় বিলফোল্ড ওয়ালেট"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-serif font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-stone-700 font-semibold">Description (English)</label>
                    <button
                      type="button"
                      onClick={() => handleTranslate(prodDescEn, 'bn', setProdDescBn, 'prodDescEn')}
                      disabled={translatingField === 'prodDescEn'}
                      className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      {translatingField === 'prodDescEn' ? 'Translating...' : 'Auto-Translate to BN ⇄'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={prodDescEn}
                    onChange={(e) => setProdDescEn(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-stone-700 font-semibold">Description (Bengali)</label>
                    <button
                      type="button"
                      onClick={() => handleTranslate(prodDescBn, 'en', setProdDescEn, 'prodDescBn')}
                      disabled={translatingField === 'prodDescBn'}
                      className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      {translatingField === 'prodDescBn' ? 'Translating...' : 'Auto-Translate to EN ⇄'}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    value={prodDescBn}
                    onChange={(e) => setProdDescBn(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                  />
                </div>
              </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Price (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    value={prodPriceBdt}
                    onChange={(e) => {
                      const bdtVal = Number(e.target.value);
                      setProdPriceBdt(bdtVal);
                      setProdPriceUsd(Math.round(bdtVal / 120));
                    }}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Stock Quantity Units</label>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(Number(e.target.value))}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-stone-700 font-semibold mb-1">Product Photo / Image</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Option A: Upload Photo */}
                  <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 flex flex-col items-center justify-center bg-stone-50 hover:bg-stone-100 transition-colors cursor-pointer relative group min-h-[100px]">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            if (typeof reader.result === 'string') {
                              setProdImage(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="text-center">
                      <Image className="w-8 h-8 text-stone-400 mx-auto mb-1 group-hover:scale-110 transition-transform duration-150" />
                      <p className="text-stone-700 font-bold text-xs uppercase tracking-wider">Drag & Drop Image</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">or click to browse local files</p>
                    </div>
                  </div>

                  {/* Option B: Image URL or Preview */}
                  <div className="border border-stone-200 rounded-xl p-3 flex flex-col justify-between bg-stone-50 min-h-[100px]">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-500 font-bold mb-1">Or paste direct image URL</label>
                      <input
                        type="text"
                        value={prodImage}
                        onChange={(e) => setProdImage(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full bg-white border border-stone-300 rounded-lg py-1.5 px-3 text-xs text-stone-800 focus:outline-none"
                      />
                    </div>
                    {prodImage && (
                      <div className="mt-2 flex items-center gap-2 bg-white p-1.5 rounded-lg border border-stone-200">
                        <img 
                          src={prodImage} 
                          alt="Product Preview" 
                          className="w-10 h-10 object-cover rounded-md border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=400';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold text-stone-700 truncate">Image Selected</p>
                          <p className="text-[9px] text-stone-400 truncate font-mono">{prodImage.startsWith('data:') ? 'Base64 Local Image Upload' : prodImage}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProdImage('')}
                          className="p-1 hover:bg-stone-100 rounded-full text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-stone-700 font-semibold">Bullet Specs (English - Comma Separated)</label>
                    <button
                      type="button"
                      onClick={() => handleTranslate(prodSpecsEn, 'bn', setProdSpecsBn, 'prodSpecsEn')}
                      disabled={translatingField === 'prodSpecsEn'}
                      className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      {translatingField === 'prodSpecsEn' ? 'Translating...' : 'Auto-Translate to BN ⇄'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={prodSpecsEn}
                    onChange={(e) => setProdSpecsEn(e.target.value)}
                    placeholder="e.g. 100% Genuine, RFID blocker, RFID slots"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-stone-700 font-semibold">Bullet Specs (Bengali - Comma Separated)</label>
                    <button
                      type="button"
                      onClick={() => handleTranslate(prodSpecsBn, 'en', setProdSpecsEn, 'prodSpecsBn')}
                      disabled={translatingField === 'prodSpecsBn'}
                      className="text-[9px] text-amber-800 hover:text-amber-950 font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      {translatingField === 'prodSpecsBn' ? 'Translating...' : 'Auto-Translate to EN ⇄'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={prodSpecsBn}
                    onChange={(e) => setProdSpecsBn(e.target.value)}
                    placeholder="উদাঃ ১০০% আসল চামড়া, আরএফআইডি ব্লক"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl py-2 px-3 text-stone-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prodFeatured"
                  checked={prodFeatured}
                  onChange={(e) => setProdFeatured(e.target.checked)}
                  className="w-4 h-4 text-amber-800 focus:ring-amber-800 border-stone-300 rounded"
                />
                <label htmlFor="prodFeatured" className="text-stone-700 font-semibold select-none">
                  Highlight as Featured Product on homepage grid
                </label>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setShowProductModal(false); setEditingProduct(null); }}
                  className="px-4 py-2 bg-stone-100 text-stone-600 rounded-xl font-bold hover:bg-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-950 text-amber-100 rounded-xl font-bold uppercase tracking-wider hover:bg-amber-900"
                >
                  {editingProduct ? 'Commit Changes' : 'Publish Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 p-6 shadow-xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-50 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-black text-lg uppercase tracking-wider text-stone-900">
                {lang === 'en' ? 'Confirm Deletion' : 'ডিলিট নিশ্চিত করুন'}
              </h4>
            </div>
            
            <p className="text-stone-600 text-xs leading-relaxed mb-6 font-semibold">
              {deleteConfirm.label}
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-stone-500 hover:text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-xl font-bold uppercase tracking-wider text-[10px]"
              >
                {lang === 'en' ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                onClick={executeDeletion}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Delete Permanently' : 'স্থায়ীভাবে মুছুন'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
