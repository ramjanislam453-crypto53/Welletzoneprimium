/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Coupon, BannerConfig, Order, Chat, Notification, Admin, PaymentSettings } from './types';

// Seed Admins from SQL
export const DEFAULT_ADMINS: Admin[] = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'superadmin@walletzone.com',
    phone: '01848301880',
    role: 'admin',
  },
  {
    id: 2,
    name: 'Admin',
    email: 'admin@walletzone.com',
    phone: '01951869220',
    role: 'admin',
  },
];

// Seed Coupons from SQL
export const DEFAULT_COUPONS: Coupon[] = [
  {
    code: 'LEATHER20',
    discount_percent: 20,
    description_en: 'Get 20% discount on all premium leather goods!',
    description_bn: 'সব ধরণের প্রিমিয়াম লেদার পণ্যে ২০% ডিসকাউন্ট পান!',
    is_active: true,
  },
  {
    code: 'EID2026',
    discount_percent: 15,
    description_en: 'Special Eid-ul-Azha shopping festival offer!',
    description_bn: 'বিশেষ ঈদুল আজহা শপিং উৎসব অফার!',
    is_active: true,
  },
  {
    code: 'WZONE10',
    discount_percent: 10,
    description_en: 'Save 10% extra on your first premium purchase.',
    description_bn: 'আপনার প্রথম কেনাকাটায় ১০% অতিরিক্ত সাশ্রয় করুন।',
    is_active: true,
  },
];

// Seed Banner Config from SQL
export const DEFAULT_BANNER: BannerConfig = {
  id: 'primary',
  title_en: 'HANDCRAFTED ROYAL LEATHER',
  title_bn: 'হস্তশিল্প রাজকীয় লেদার কালেকশন',
  subtitle_en: 'Experience 100% full-grain export quality leather wallets, belts, and bags with lifetime durability warranty.',
  subtitle_bn: '১০০% খাঁটি ফুল-গ্রেইন রপ্তানি মানের চামড়ার মানিব্যাগ, বেল্ট এবং ব্যাগের আজীবন স্থায়িত্বের ওয়ারেন্টি উপভোগ করুন।',
  image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=1200',
};

// Seed initial Products (bilingual and detailed)
export const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    name_en: 'Royal Billfold Wallet',
    name_bn: 'রাজকীয় বিলফোল্ড ওয়ালেট',
    description_en: 'Handcrafted from 100% full-grain export quality leather. Features 8 card slots, 2 cash compartments, and RFID blocking technology.',
    description_bn: '১০০% খাঁটি ফুল-গ্রেইন রপ্তানি মানের চামড়া থেকে হাতে তৈরি। এতে রয়েছে ৮টি কার্ড স্লট, ২টি ক্যাশ কম্পার্টমেন্ট এবং আরএফআইডি ব্লকিং প্রযুক্তি।',
    price_usd: 25,
    price_bdt: 2900,
    category: 'Wallets',
    category_label_en: 'Premium Wallets',
    category_label_bn: 'প্রিমিয়াম ওয়ালেটস',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=600',
    rating: 4.8,
    stock: 12,
    specs_en: ['100% Full-grain Leather', 'RFID Protection', 'Lifetime Durability Warranty', 'Elegant Bifold Design'],
    specs_bn: ['১০০% খাঁটি চামড়া', 'আরএফআইডি সুরক্ষা', 'আজীবন স্থায়িত্ব ওয়ারেন্টি', 'আকর্ষণীয় দ্বিভাজ ডিজাইন'],
    featured: true,
  },
  {
    id: 'prod-002',
    name_en: 'Imperial Executive Belt',
    name_bn: 'ইম্পেরিয়াল এক্সিকিউটিভ বেল্ট',
    description_en: 'Sleek and robust dress belt with a luxury automated alloy buckle. Crafted from vegetable-tanned genuine leather.',
    description_bn: 'একটি রাজকীয় অটোমেটেড অ্যালয় বাকল সহ মসৃণ এবং মজবুত ড্রেস বেল্ট। ভেজিটেবল-ট্যানড আসল চামড়া থেকে তৈরি।',
    price_usd: 30,
    price_bdt: 3500,
    category: 'Belts',
    category_label_en: 'Leather Belts',
    category_label_bn: 'লেদার বেল্ট',
    image: 'https://images.unsplash.com/photo-1624222247344-550fb8ecf7db?auto=format&fit=crop&q=80&w=600',
    rating: 4.6,
    stock: 8,
    specs_en: ['Vegetable-tanned Leather', 'Premium Alloy Auto-Buckle', 'Width: 1.5 inches', 'Precision Handcrafted Edges'],
    specs_bn: ['ভেজিটেবল-ট্যানড লেদার', 'প্রিমিয়াম অ্যালয় বাকল', 'প্রস্থ: ১.৫ ইঞ্চি', 'নিখুঁত হাতের কাজ'],
    featured: true,
  },
  {
    id: 'prod-003',
    name_en: 'Heritage Messenger Bag',
    name_bn: 'ঐতিহ্যবাহী মেসেঞ্জার ব্যাগ',
    description_en: 'Spacious everyday companion with a dedicated padded laptop sleeve, heavy-duty brass zippers, and adjustable leather shoulder strap.',
    description_bn: 'ল্যাপটপ রাখার জন্য ডেডিকেটেড প্যাডেড স্লিভ, মজবুত পিতলের জিপার এবং অ্যাডজাস্টেবল চামড়ার শোল্ডার স্ট্র্যাপ সহ প্রশস্ত নিত্যদিনের সঙ্গী।',
    price_usd: 85,
    price_bdt: 9900,
    category: 'Bags',
    category_label_en: 'Travel & Office Bags',
    category_label_bn: 'ভ্রমণ ও অফিস ব্যাগ',
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    stock: 5,
    specs_en: ['Fits up to 15.6 inch laptop', 'Water-resistant Inner Lining', 'Solid Antique Brass Hardware', 'Hidden Security Pocket'],
    specs_bn: ['১৫.৬ ইঞ্চি ল্যাপটপ উপযুক্ত', 'জল-নিরোধক ভেতরের লাইনিং', 'সলিড অ্যান্টিক ব্রাস হার্ডওয়্যার', 'লুকানো নিরাপত্তা পকেট'],
    featured: true,
  },
  {
    id: 'prod-004',
    name_en: 'Sovereign Card Holder',
    name_bn: 'সার্বভৌম কার্ড হোল্ডার',
    description_en: 'Slim, minimalistic card sleeve that fits comfortably in your front pocket. Sewn with ultra-durable waxed threads.',
    description_bn: 'পাতলা এবং মিনিমালিস্ট কার্ড স্লিভ যা সহজে আপনার সামনের পকেটে ফিট করে। অত্যন্ত টেকসই মোমযুক্ত সুতো দিয়ে সেলাই করা।',
    price_usd: 12,
    price_bdt: 1400,
    category: 'Accessories',
    category_label_en: 'Elite Accessories',
    category_label_bn: 'এলিট অ্যাকসেসরিজ',
    image: 'https://images.unsplash.com/photo-1588444839799-eb01f63a3df5?auto=format&fit=crop&q=80&w=600',
    rating: 4.5,
    stock: 20,
    specs_en: ['Ultra-slim Profile', 'Holds up to 6 Cards', 'Central Cash Compartment', 'Premium Waxed Thread Sewing'],
    specs_bn: ['আল্ট্রা-স্লিম প্রোফাইল', '৬টি কার্ড রাখার সুবিধা', 'মাঝখানে ক্যাশ রাখার স্থান', 'প্রিমিয়াম ওয়াক্সড সুতোর কাজ'],
    featured: false,
  },
  {
    id: 'prod-005',
    name_en: 'Vintage Travel Duffle',
    name_bn: 'ভিন্টেজ ট্রাভেল ডাফেল',
    description_en: 'The ultimate weekend companion. Extremely spacious compartment with reinforced base feet, genuine leather handles, and a dedicated shoe partition.',
    description_bn: 'আপনার ভ্রমণের শেষ কথা। নিচে রিইনফোর্সড বেইস ফিট, খাঁটি চামড়ার হ্যান্ডেল এবং জুতো রাখার জন্য ডেডিকেটেড পার্টিশন সহ অত্যন্ত প্রশস্ত ব্যাগ।',
    price_usd: 120,
    price_bdt: 14000,
    category: 'Bags',
    category_label_en: 'Travel & Office Bags',
    category_label_bn: 'ভ্রমণ ও অফিস ব্যাগ',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600',
    rating: 4.9,
    stock: 4,
    specs_en: ['Airline Cabin Size Approved', 'Reinforced Metal Base Feet', 'Full Zipper Wide Opening', 'Detachable Leather Shoulder Strap'],
    specs_bn: ['এয়ারলাইন কেবিন সাইজ অনুমোদিত', 'রিইনফোর্সড মেটাল বেইস ফিট', 'সম্পূর্ণ চওড়া জিপার ওপেনিং', 'খুলতে পারার মত চামড়ার বেল্ট'],
    featured: false,
  },
  {
    id: 'prod-006',
    name_en: 'Classic Key Organizer',
    name_bn: 'ক্লাসিক কি অর্গানাইজার',
    description_en: 'Quiet your noisy keys with this sleek leather keyholder. Accommodates up to 7 standard keys with custom locking bolts.',
    description_bn: 'এই মসৃণ চামড়ার কি-হোল্ডার দিয়ে আপনার চাবির আওয়াজ বন্ধ করুন। কাস্টম লকিং বোল্ট সহ ৭টি চাবি সাজিয়ে রাখা যায়।',
    price_usd: 10,
    price_bdt: 1150,
    category: 'Accessories',
    category_label_en: 'Elite Accessories',
    category_label_bn: 'এলিট অ্যাকসেসরিজ',
    image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=600',
    rating: 4.4,
    stock: 15,
    specs_en: ['No-scratch Leather Shield', 'Holds up to 7 Keys', 'Premium D-ring for Fobs', 'Secure Locking Mechanism'],
    specs_bn: ['স্ক্র্যাচ-প্রুফ চামড়ার খাপ', '৭টি চাবি ধারণ ক্ষমতা', 'রিমোট চাবির জন্য ডি-রিং', 'সুরক্ষিত লকিং মেকানিজম'],
    featured: false,
  },
];

// Seed initial Notifications
export const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    title_en: 'Premium Leather Launch!',
    title_bn: 'প্রিমিয়াম লেদার পণ্য লঞ্চ!',
    message_en: 'Welcome to Wallet Zone! Discover our 100% full-grain export quality wallets, belts, and bags.',
    message_bn: 'ওয়ালেট জোনে আপনাকে স্বাগতম! আমাদের ১০০% খাঁটি চামড়ার ওয়ালেট, বেল্ট এবং ব্যাগ আবিষ্কার করুন।',
    time: 'Just now',
    type: 'success',
    read: false,
  },
  {
    id: 'notif-002',
    title_en: 'Special Eid Discount Active',
    title_bn: 'বিশেষ ঈদ ডিসকাউন্ট চালু',
    message_en: 'Use coupon code EID2026 at checkout to save 15% flat on all premium collections!',
    message_bn: 'সব ধরণের প্রিমিয়াম পণ্যে ১৫% ডিসকাউন্ট পেতে চেকআউটে EID2026 কুপন কোডটি ব্যবহার করুন!',
    time: '2 hours ago',
    type: 'info',
    read: false,
  },
];

// Seed initial Orders for realistic dashboard charts
export const DEFAULT_ORDERS: Order[] = [
  {
    id: 'ORD-98213',
    customer_name: 'Imran Khan',
    customer_phone: '01712345678',
    customer_email: 'imran@gmail.com',
    shipping_address: 'House 14, Road 5, Dhanmondi, Dhaka',
    payment_method: 'bKash',
    payment_details: 'TrxID: BK8721A0',
    items: [
      {
        product_id: 'prod-001',
        name_en: 'Royal Billfold Wallet',
        name_bn: 'রাজকীয় বিলফোল্ড ওয়ালেট',
        price_usd: 25,
        price_bdt: 2900,
        quantity: 1,
      },
    ],
    total_usd: 21.25, // with WZONE10 (10% discount) + mock tax
    total_bdt: 2610,
    status: 'delivered',
    estimated_delivery: 'Delivered on June 27, 2026',
    coupon_applied: 'WZONE10',
    discount_percent: 10,
    created_at: '2026-06-27T10:30:00.000Z',
  },
  {
    id: 'ORD-72412',
    customer_name: 'Nusrat Jahan',
    customer_phone: '01898765432',
    customer_email: 'nusrat@outlook.com',
    shipping_address: 'Level 4, Imperial Plaza, GEC Circle, Chattogram',
    payment_method: 'Cash on Delivery',
    items: [
      {
        product_id: 'prod-002',
        name_en: 'Imperial Executive Belt',
        name_bn: 'ইম্পেরিয়াল এক্সিকিউティブ বেল্ট',
        price_usd: 30,
        price_bdt: 3500,
        quantity: 1,
      },
      {
        product_id: 'prod-004',
        name_en: 'Sovereign Card Holder',
        name_bn: 'সার্বভৌম কার্ড হোল্ডার',
        price_usd: 12,
        price_bdt: 1400,
        quantity: 1,
      },
    ],
    total_usd: 33.6, // with LEATHER20 (20% discount)
    total_bdt: 3920,
    status: 'shipped',
    estimated_delivery: 'June 30, 2026',
    coupon_applied: 'LEATHER20',
    discount_percent: 20,
    created_at: '2026-06-28T14:15:00.000Z',
  },
  {
    id: 'ORD-12847',
    customer_name: 'Faisal Ahmed',
    customer_phone: '01923456789',
    customer_email: 'faisal@yahoo.com',
    shipping_address: 'Sector 4, Road 12, Uttara, Dhaka',
    payment_method: 'Card',
    payment_details: 'Visa ending in 4242',
    items: [
      {
        product_id: 'prod-003',
        name_en: 'Heritage Messenger Bag',
        name_bn: 'ঐতিহ্যবাহী মেসেঞ্জার ব্যাগ',
        price_usd: 85,
        price_bdt: 9900,
        quantity: 1,
      },
    ],
    total_usd: 85,
    total_bdt: 9900,
    status: 'pending',
    estimated_delivery: 'July 02, 2026',
    discount_percent: 0,
    created_at: '2026-06-29T05:00:00.000Z',
  },
];

// Helper functions for reading and writing data
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading key ${key} from localStorage`, error);
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing key ${key} to localStorage`, error);
  }
}

// Background Supabase synchronizer triggers
export async function saveToSupabase(key: string, value: any) {
  try {
    const res = await fetch('/api/db/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) {
      throw new Error(`API error status: ${res.status}`);
    }
    const result = await res.json();
    if (!result.success) {
      console.warn(`Supabase database save failed for ${key}:`, result.error);
    }
  } catch (err) {
    console.warn(`Supabase offline fallback active. Failed to background sync ${key} to Supabase:`, err);
  }
}

export async function syncFromSupabase() {
  try {
    const res = await fetch('/api/db/all');
    if (!res.ok) throw new Error(`API error status: ${res.status}`);
    const result = await res.json();
    if (result.success && result.data) {
      window.localStorage.removeItem('wzone_supabase_setup_needed');
      window.localStorage.removeItem('wzone_supabase_setup_sql');
      
      const data = result.data;
      if (data.wzone_admins) setLocalStorage('wzone_admins', data.wzone_admins);
      if (data.wzone_products) setLocalStorage('wzone_products', data.wzone_products);
      if (data.wzone_orders) setLocalStorage('wzone_orders', data.wzone_orders);
      if (data.wzone_coupons) setLocalStorage('wzone_coupons', data.wzone_coupons);
      if (data.wzone_chats) setLocalStorage('wzone_chats', data.wzone_chats);
      if (data.wzone_notifications) setLocalStorage('wzone_notifications', data.wzone_notifications);
      if (data.wzone_banner) setLocalStorage('wzone_banner', data.wzone_banner);
      if (data.wzone_payment_settings) setLocalStorage('wzone_payment_settings', data.wzone_payment_settings);
      
      // Dispatch custom event to let components reload their states
      window.dispatchEvent(new CustomEvent('wzone-db-synced'));
      return true;
    } else if (result.isTableMissing) {
      window.localStorage.setItem('wzone_supabase_setup_needed', 'true');
      window.localStorage.setItem('wzone_supabase_setup_sql', result.sqlSetup || '');
      window.dispatchEvent(new CustomEvent('wzone-db-sync-error'));
    }
  } catch (err) {
    console.warn('Supabase database sync failed, continuing seamlessly in LocalStorage mode:', err);
  }
  return false;
}

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  bkash_number: '01951869220',
  nagad_number: '01984680100',
  delivery_inside_dhaka: 70,
  delivery_outside_dhaka: 130,
};

// Global Database Controller matching tables
export const db = {
  getAdmins: () => getLocalStorage<Admin[]>('wzone_admins', DEFAULT_ADMINS),
  setAdmins: (admins: Admin[]) => {
    setLocalStorage('wzone_admins', admins);
    saveToSupabase('wzone_admins', admins);
    window.dispatchEvent(new CustomEvent('wzone-db-synced'));
  },

  getProducts: () => getLocalStorage<Product[]>('wzone_products', DEFAULT_PRODUCTS),
  setProducts: (products: Product[]) => {
    setLocalStorage('wzone_products', products);
    saveToSupabase('wzone_products', products);
    window.dispatchEvent(new CustomEvent('wzone-db-synced'));
  },

  getOrders: () => getLocalStorage<Order[]>('wzone_orders', DEFAULT_ORDERS),
  setOrders: (orders: Order[]) => {
    setLocalStorage('wzone_orders', orders);
    saveToSupabase('wzone_orders', orders);
    window.dispatchEvent(new CustomEvent('wzone-db-synced'));
  },

  getCoupons: () => getLocalStorage<Coupon[]>('wzone_coupons', DEFAULT_COUPONS),
  setCoupons: (coupons: Coupon[]) => {
    setLocalStorage('wzone_coupons', coupons);
    saveToSupabase('wzone_coupons', coupons);
    window.dispatchEvent(new CustomEvent('wzone-db-synced'));
  },

  getChats: () => getLocalStorage<Chat[]>('wzone_chats', []),
  setChats: (chats: Chat[]) => {
    setLocalStorage('wzone_chats', chats);
    saveToSupabase('wzone_chats', chats);
    window.dispatchEvent(new CustomEvent('wzone-db-synced'));
  },

  getNotifications: () => {
    const raw = getLocalStorage<Notification[]>('wzone_notifications', DEFAULT_NOTIFICATIONS);
    const seen = new Set<string>();
    return raw.filter(n => {
      if (!n || !n.id) return false;
      if (seen.has(n.id)) return false;
      seen.add(n.id);
      return true;
    });
  },
  setNotifications: (notifs: Notification[]) => {
    setLocalStorage('wzone_notifications', notifs);
    saveToSupabase('wzone_notifications', notifs);
    window.dispatchEvent(new CustomEvent('wzone-db-synced'));
  },

  getBanner: () => getLocalStorage<BannerConfig>('wzone_banner', DEFAULT_BANNER),
  setBanner: (banner: BannerConfig) => {
    setLocalStorage('wzone_banner', banner);
    saveToSupabase('wzone_banner', banner);
    window.dispatchEvent(new CustomEvent('wzone-db-synced'));
  },

  getPaymentSettings: () => getLocalStorage<PaymentSettings>('wzone_payment_settings', DEFAULT_PAYMENT_SETTINGS),
  setPaymentSettings: (settings: PaymentSettings) => {
    setLocalStorage('wzone_payment_settings', settings);
    saveToSupabase('wzone_payment_settings', settings);
    window.dispatchEvent(new CustomEvent('wzone-db-synced'));
  },
};
