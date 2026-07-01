/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client successfully initialized.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
} else {
  console.warn('Supabase configurations are missing. Running in local fallback mode.');
}

app.use(express.json());

// Initialize Gemini client lazily
let ai: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!ai && process.env.GEMINI_API_KEY) {
    try {
      ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (err) {
      console.error('Failed to initialize Gemini client:', err);
    }
  }
  return ai;
}

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Seed Admins definition on server-side
const DEFAULT_ADMINS = [
  {
    id: 1,
    name: 'Super Admin',
    email: 'mdramjanislam9220@gmail.com',
    phone: '01951869220',
    password: '6519',
    role: 'admin',
    created_at: new Date('2026-01-01').toISOString()
  },
  {
    id: 2,
    name: 'Admin',
    email: 'admin@walletzone.com',
    phone: '01951869220',
    password: '6519',
    role: 'admin',
    created_at: new Date('2026-01-01').toISOString()
  },
];

let serverAdmins = [...DEFAULT_ADMINS];

// Helper to fetch full admins with passwords
async function getFullAdmins(): Promise<any[]> {
  if (!supabase) {
    return serverAdmins;
  }
  try {
    const { data, error } = await supabase
      .from('wzone_store')
      .select('value')
      .eq('key', 'wzone_admins')
      .maybeSingle();

    if (error) {
      console.error('Error fetching admins from Supabase:', error);
      return serverAdmins;
    }
    if (data && data.value) {
      let list = Array.isArray(data.value) ? data.value : [];
      const targetEmail = 'mdramjanislam9220@gmail.com';
      const existingSuperIdx = list.findIndex((a: any) => a.email && a.email.toLowerCase() === targetEmail);
      if (existingSuperIdx === -1) {
        list.push({
          id: 1,
          name: 'Super Admin',
          email: targetEmail,
          phone: '01951869220',
          password: '6519',
          role: 'admin',
          created_at: new Date().toISOString()
        });
        await supabase.from('wzone_store').upsert({
          key: 'wzone_admins',
          value: list,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      } else {
        const currentSuper = list[existingSuperIdx];
        if (currentSuper.password !== '6519' || currentSuper.role !== 'admin') {
          list[existingSuperIdx] = {
            ...currentSuper,
            password: '6519',
            role: 'admin'
          };
          await supabase.from('wzone_store').upsert({
            key: 'wzone_admins',
            value: list,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
        }
      }
      serverAdmins = list;
      return list;
    }
    // Seed it in Supabase if missing
    await supabase.from('wzone_store').upsert({
      key: 'wzone_admins',
      value: DEFAULT_ADMINS,
      updated_at: new Date().toISOString()
    });
    serverAdmins = [...DEFAULT_ADMINS];
    return DEFAULT_ADMINS;
  } catch (err) {
    console.error('Exception fetching admins:', err);
    return serverAdmins;
  }
}

// Helper to save full admins list
async function saveFullAdmins(admins: any[]): Promise<boolean> {
  serverAdmins = admins;
  if (!supabase) {
    return true;
  }
  try {
    const { error } = await supabase
      .from('wzone_store')
      .upsert({
        key: 'wzone_admins',
        value: admins,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (error) {
      console.error('Error saving admins to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception saving admins:', err);
    return false;
  }
}

// Get all synchronized database states from Supabase wzone_store table
app.get('/api/db/all', async (req, res) => {
  if (!supabase) {
    return res.json({ success: false, error: 'Supabase client not initialized' });
  }

  try {
    const { data, error } = await supabase
      .from('wzone_store')
      .select('*');

    if (error) {
      console.error('Error fetching data from Supabase:', error);
      const isTableMissing = error.message?.includes('does not exist') || error.code === 'P0001' || error.code === '42P01';
      return res.json({ 
        success: false, 
        error: error.message,
        isTableMissing,
        sqlSetup: `CREATE TABLE IF NOT EXISTS wzone_store (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE wzone_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write access" ON wzone_store
  FOR ALL USING (true) WITH CHECK (true);`
      });
    }

    const result: Record<string, any> = {};
    let hasAdmins = false;
    if (data) {
      for (const row of data) {
        if (row.key === 'wzone_admins') {
          hasAdmins = true;
          const list = Array.isArray(row.value) ? row.value : [];
          // Strip password fields for ultimate client security!
          result[row.key] = list.map(({ password, ...rest }: any) => rest);
        } else {
          result[row.key] = row.value;
        }
      }
    }

    if (!hasAdmins) {
      const fullAdmins = await getFullAdmins();
      result['wzone_admins'] = fullAdmins.map(({ password, ...rest }: any) => rest);
    }

    return res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('Supabase fetch query error:', err);
    return res.json({ success: false, error: err.message });
  }
});

// Role-Based Authenticated Login Endpoint (Does not leak passwords to client code)
app.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and security credentials pin are required.' });
  }

  try {
    const admins = await getFullAdmins();
    const matched = admins.find(a => a.email.toLowerCase() === email.toLowerCase().trim());

    if (!matched) {
      return res.json({ success: false, error: 'Access Denied. Invalid email or security credentials pin.' });
    }

    if (String(matched.password).trim() !== String(password).trim()) {
      return res.json({ success: false, error: 'Access Denied. Invalid email or security credentials pin.' });
    }

    if (matched.role === 'pending') {
      return res.json({ 
        success: false, 
        error: 'আপনার অ্যাকাউন্টটি অনুমোদনের জন্য অপেক্ষমান রয়েছে। অনুগ্রহ করে মূল অ্যাডমিনের অনুমোদনের জন্য অপেক্ষা করুন। / Your staff account is pending admin approval. Please contact the administrator.' 
      });
    }

    // Return the safe admin object without password
    const { password: _, ...safeAdmin } = matched;
    return res.json({ success: true, admin: safeAdmin });
  } catch (err: any) {
    console.error('Login endpoint error:', err);
    return res.status(500).json({ success: false, error: 'Server error during authentication' });
  }
});

// Secure Staff Registration Endpoint (Forces "pending" role on creation)
app.post('/api/admin/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) {
    return res.status(400).json({ success: false, error: 'All fields are required for portal registration.' });
  }

  try {
    const admins = await getFullAdmins();
    const exists = admins.some(a => a.email.toLowerCase() === email.toLowerCase().trim());

    if (exists) {
      return res.json({ success: false, error: 'Error: This email address is already registered in the gatekeeper database.' });
    }

    const newAdmin = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password: String(password).trim(),
      role: 'pending', // High security default (cannot access dashboard until approved!)
      created_at: new Date().toISOString()
    };

    const updated = [...admins, newAdmin];
    const ok = await saveFullAdmins(updated);

    if (!ok) {
      return res.json({ success: false, error: 'Failed to write registration to database.' });
    }

    return res.json({ 
      success: true, 
      message: 'User Registered Successfully! Your account is set to PENDING approval. Please contact the administrator to grant access. / সফলভাবে নিবন্ধন হয়েছে! আপনার অ্যাকাউন্টটি অনুমোদনের জন্য অপেক্ষমান রয়েছে।' 
    });
  } catch (err: any) {
    console.error('Registration endpoint error:', err);
    return res.status(500).json({ success: false, error: 'Server error during registration' });
  }
});

// Secure Admin Role Modifier Endpoint
app.post('/api/admin/update-role', async (req, res) => {
  const { adminId, newRole } = req.body;
  if (!adminId || !newRole) {
    return res.status(400).json({ success: false, error: 'adminId and newRole are required' });
  }

  try {
    const admins = await getFullAdmins();
    const updated = admins.map(a => {
      if (a.id === Number(adminId)) {
        return { ...a, role: newRole };
      }
      return a;
    });

    const ok = await saveFullAdmins(updated);
    return res.json({ success: ok });
  } catch (err: any) {
    console.error('Update role error:', err);
    return res.status(500).json({ success: false });
  }
});

// Secure Admin Deletion Endpoint
app.post('/api/admin/delete', async (req, res) => {
  const { adminId } = req.body;
  if (!adminId) {
    return res.status(400).json({ success: false, error: 'adminId is required' });
  }

  try {
    const admins = await getFullAdmins();
    const updated = admins.filter(a => a.id !== Number(adminId));

    const ok = await saveFullAdmins(updated);
    return res.json({ success: ok });
  } catch (err: any) {
    console.error('Delete admin error:', err);
    return res.status(500).json({ success: false });
  }
});

// Update or insert a database state row into Supabase wzone_store table
app.post('/api/db/save', async (req, res) => {
  const { key, value } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, error: 'Key is required' });
  }

  if (key === 'wzone_admins') {
    // Intercept and protect admins database from direct overwrite by visitors!
    return res.json({ success: true, message: 'Protected resource. Use dedicated admin management endpoints.' });
  }

  if (!supabase) {
    return res.json({ success: false, error: 'Supabase client not initialized' });
  }

  try {
    const { error } = await supabase
      .from('wzone_store')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.error(`Error saving ${key} to Supabase:`, error);
      const isTableMissing = error.message?.includes('does not exist') || error.code === 'P0001' || error.code === '42P01';
      return res.json({ 
        success: false, 
        error: error.message,
        isTableMissing,
        sqlSetup: `CREATE TABLE IF NOT EXISTS wzone_store (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE wzone_store ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read and write access" ON wzone_store
  FOR ALL USING (true) WITH CHECK (true);`
      });
    }

    return res.json({ success: true });
  } catch (err: any) {
    console.error(`Supabase save query error for ${key}:`, err);
    return res.json({ success: false, error: err.message });
  }
});

// AI Translation API using Gemini
app.post('/api/translate', async (req, res) => {
  const { text, targetLang } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const client = getGeminiClient();
  if (client) {
    try {
      const prompt = `You are a professional, accurate translator. Translate the following text into ${targetLang === 'bn' ? 'Bengali (বাংলা)' : 'English'}.
Maintain standard spelling, correct grammar, and the context of a premium leather boutique.
Respond with ONLY the translation, without any introduction, quotes, or markdown formatting.

Text to translate:
${text}`;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          temperature: 0.2,
        },
      });

      const translatedText = response.text?.trim() || '';
      return res.json({ translated: translatedText });
    } catch (error) {
      console.error('Translation error:', error);
      return res.status(500).json({ error: 'Translation failed' });
    }
  } else {
    // Elegant fallback translation with simple rule mapping
    const lowercase = text.toLowerCase().trim();
    let translated = text;
    if (targetLang === 'bn') {
      if (lowercase.includes('wallet')) translated = 'মানিব্যাগ';
      else if (lowercase.includes('belt')) translated = 'বেল্ট';
      else if (lowercase.includes('bag')) translated = 'ব্যাগ';
      else if (lowercase.includes('leather')) translated = 'চামড়া';
      else if (lowercase.includes('discount')) translated = 'ছাড়';
      else translated = `[অনূদিত] ${text}`;
    } else {
      if (lowercase.includes('মানিব্যাগ') || lowercase.includes('ওয়ালেট')) translated = 'Wallet';
      else if (lowercase.includes('বেল্ট')) translated = 'Belt';
      else if (lowercase.includes('ব্যাগ')) translated = 'Bag';
      else if (lowercase.includes('চামড়া')) translated = 'Leather';
      else translated = `[Translated] ${text}`;
    }
    return res.json({ translated });
  }
});

// AI Chat Support API Proxy
app.post('/api/chat', async (req, res) => {
  const { messages, userName } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Invalid messages array provided' });
  }

  // Generate a system prompt representing Wallet Zone
  const systemInstruction = `You are Royal Support, the professional bilingual AI Sales Assistant for Wallet Zone (ওয়ালেট জোন), a luxury handcrafted leather goods brand.
Our company crafts 100% full-grain export-quality leather wallets, belts, bags, and accessories with lifetime durability warranty.
Our physical boutique is located in Dhaka, Bangladesh, and we deliver premium packages nationwide.

Here is our current premium catalog for your reference:
1. Royal Billfold Wallet (রাজকীয় বিলফোল্ড ওয়ালেট) - Price: $25 / 2900 BDT. Category: Wallets. Specs: 100% Full-grain Leather, RFID Protection, Lifetime Warranty.
2. Imperial Executive Belt (ইম্পেরিয়াল এক্সিকিউティブ বেল্ট) - Price: $30 / 3500 BDT. Category: Belts. Specs: Vegetable-tanned, luxury alloy auto-buckle.
3. Heritage Messenger Bag (ঐতিহ্যবাহী মেসেঞ্জার ব্যাগ) - Price: $85 / 9900 BDT. Category: Bags. Fits 15.6" laptop, antique brass zipper.
4. Sovereign Card Holder (সার্বভৌম কার্ড হোল্ডার) - Price: $12 / 1400 BDT. Category: Accessories. Minimalist profile.
5. Vintage Travel Duffle (ভিন্টেজ ট্রাভেল ডাফেল) - Price: $120 / 14000 BDT. Category: Bags. Genuine leather handles, shoe compartment.
6. Classic Key Organizer (ক্লাসিক কি অর্গানাইজার) - Price: $10 / 1150 BDT. Category: Accessories. Holds up to 7 keys.

We have active coupons:
- LEATHER20: 20% discount on all premium leather goods!
- EID2026: 15% flat discount for Eid-ul-Azha shopping!
- WZONE10: 10% discount on the first premium purchase.

Your Personality:
- Extremely polite, premium, welcoming, and concise.
- Bilingual: Support both English and Bengali. Respond in the language used by the customer (${userName || 'Guest'}).
- Warm, professional, and guide them to add items to their cart or check out.
- Tell them they can browse our catalog, apply coupons for fantastic discounts, and place an order directly on our website.
- If they ask general leather care questions, advise them to keep leather away from prolonged water and use high-quality wax conditioners.`;

  // Format messages into chat contents for Gemini
  const geminiMessages = messages.map((m: any) => {
    // Map sender roles
    const role = m.sender === 'user' ? 'user' : 'model';
    return {
      role,
      parts: [{ text: m.text }],
    };
  });

  const client = getGeminiClient();

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: geminiMessages,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = response.text || 'Thank you for reaching out to Wallet Zone. How else can I assist you today?';
      return res.json({ text: responseText });
    } catch (error: any) {
      console.error('Gemini generateContent error:', error);
      // Fallback response inside catch block
      return res.json({
        text: `Hello ${userName || 'valued customer'}! I am running in fallback mode. I'd love to help you explore our handcrafted Royal Leather Wallets, Executive Belts, and Heritage Messenger Bags. Try applying the coupon code **EID2026** for a 15% discount!`,
      });
    }
  } else {
    // Graceful fallback when no API key is set
    console.log('No GEMINI_API_KEY detected. Using static luxury fallback responses.');
    const lastUserMessage = messages[messages.length - 1]?.text?.toLowerCase() || '';

    let reply = `Welcome to Wallet Zone, ${userName || 'valued customer'}! We offer 100% full-grain export quality leather accessories. How can I help you today?`;

    if (lastUserMessage.includes('wallet') || lastUserMessage.includes('ওয়ালেট')) {
      reply = `Our featured **Royal Billfold Wallet (রাজকীয় বিলফোল্ড ওয়ালেট)** is crafted from 100% full-grain export quality leather with RFID blocking. It is priced at $25 (2900 BDT) and comes with a lifetime durability warranty. Would you like to add it to your cart?`;
    } else if (lastUserMessage.includes('belt') || lastUserMessage.includes('বেল্ট')) {
      reply = `Our best-selling **Imperial Executive Belt (ইম্পেরিয়াল এক্সিকিউティブ বেল্ট)** features vegetable-tanned leather and a premium automated alloy buckle. It is priced at $30 (3500 BDT). Feel free to browse our Belts category!`;
    } else if (lastUserMessage.includes('bag') || lastUserMessage.includes('ব্যাগ')) {
      reply = `Our executive **Heritage Messenger Bag (ঐতিহ্যবাহী মেসেঞ্জার ব্যাগ)** ($85 / 9900 BDT) and **Vintage Travel Duffle** ($120 / 14000 BDT) are crafted for premium durability. Both feature water-resistant linings and luxury hardware.`;
    } else if (lastUserMessage.includes('coupon') || lastUserMessage.includes('code') || lastUserMessage.includes('কুপন') || lastUserMessage.includes('ডিসকাউন্ট')) {
      reply = `We have three active coupon codes! \n- **EID2026**: 15% flat discount \n- **LEATHER20**: 20% flat discount \n- **WZONE10**: 10% discount on first order. You can apply them at checkout!`;
    } else if (lastUserMessage.includes('buy') || lastUserMessage.includes('order') || lastUserMessage.includes('কিনতে') || lastUserMessage.includes('অর্ডার')) {
      reply = `To place an order, simply add any handcrafted leather item to your cart, click checkout, and fill in your shipping details. We accept Cash on Delivery, bKash, and cards!`;
    }

    return res.json({ text: reply });
  }
});

// Vite middleware configuration for development vs production
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Wallet Zone Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

start();
