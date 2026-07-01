/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import ShopFront from './components/ShopFront';
import AdminPanel from './components/AdminPanel';
import ChatWidget from './components/ChatWidget';
import { db, syncFromSupabase } from './dbSeed';
import { Notification } from './types';

export default function App() {
  const [view, setView] = useState<'shop' | 'admin'>('shop');
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [currency, setCurrency] = useState<'USD' | 'BDT'>('BDT');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Trigger Supabase cloud pull on startup
  useEffect(() => {
    syncFromSupabase();
  }, []);

  // Initialize notifications from database
  useEffect(() => {
    const refreshNotifications = () => {
      setNotifications(db.getNotifications());
    };
    refreshNotifications();

    window.addEventListener('wzone-db-synced', refreshNotifications);
    return () => {
      window.removeEventListener('wzone-db-synced', refreshNotifications);
    };
  }, [view]);

  return (
    <div className="relative min-h-screen selection:bg-amber-950 selection:text-amber-100">
      {view === 'shop' ? (
        <ShopFront 
          lang={lang} 
          setLang={setLang} 
          currency={currency} 
          setCurrency={setCurrency} 
          onAdminLoginClick={() => setView('admin')}
          notifications={notifications}
          setNotifications={setNotifications}
        />
      ) : (
        <AdminPanel 
          onBackToShop={() => setView('shop')} 
          lang={lang}
          setNotifications={setNotifications}
        />
      )}

      {/* Floating Customer Support Live Chat Widget */}
      <ChatWidget lang={lang} />
    </div>
  );
}
