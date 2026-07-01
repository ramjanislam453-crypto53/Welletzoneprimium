/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Admin {
  id: number;
  name: string;
  email: string;
  phone: string;
  password?: string;
  created_at?: string;
  role?: string;
}

export interface Product {
  id: string;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  price_usd: number;
  price_bdt: number;
  category: string;
  category_label_en: string;
  category_label_bn: string;
  image: string;
  rating: number;
  stock: number;
  specs_en: string[];
  specs_bn: string[];
  featured: boolean;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItem {
  product_id: string;
  name_en: string;
  name_bn: string;
  price_usd: number;
  price_bdt: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  payment_method: string;
  payment_details?: string;
  items: OrderItem[];
  total_usd: number;
  total_bdt: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  estimated_delivery?: string;
  coupon_applied?: string;
  discount_percent: number;
  created_at: string;
}

export interface Coupon {
  code: string;
  discount_percent: number;
  description_en: string;
  description_bn: string;
  is_active: boolean;
  created_at?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'admin' | 'ai';
  text: string;
  timestamp: string;
}

export interface Chat {
  user_id: string;
  user_name: string;
  user_phone: string;
  messages: ChatMessage[];
  unread_by_admin: boolean;
  unread_by_customer: boolean;
  last_message_at: string;
  created_at?: string;
}

export interface Notification {
  id: string;
  title_en: string;
  title_bn: string;
  message_en: string;
  message_bn: string;
  time: string;
  type: 'info' | 'success' | 'alert';
  read: boolean;
  created_at?: string;
}

export interface BannerConfig {
  id: string;
  title_en: string;
  title_bn: string;
  subtitle_en: string;
  subtitle_bn: string;
  image: string;
  updated_at?: string;
}

export interface PaymentSettings {
  bkash_number: string;
  nagad_number: string;
  delivery_inside_dhaka?: number;
  delivery_outside_dhaka?: number;
}

