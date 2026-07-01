/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Phone, CheckCheck } from 'lucide-react';
import { db } from '../dbSeed';
import { ChatMessage, Chat } from '../types';

export default function ChatWidget({ lang }: { lang: 'en' | 'bn' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userId, setUserId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load existing chat session if present in localStorage
  useEffect(() => {
    const activeSession = window.localStorage.getItem('wzone_active_chat_user');
    if (activeSession) {
      try {
        const parsed = JSON.parse(activeSession);
        setUserName(parsed.name);
        setUserPhone(parsed.phone);
        setUserId(parsed.id);
        setIsRegistered(true);

        // Fetch chats from our mock DB
        const allChats = db.getChats();
        const existingChat = allChats.find(c => c.user_id === parsed.id);
        if (existingChat) {
          setMessages(existingChat.messages);
        } else {
          // Initialize empty
          const welcome: ChatMessage = {
            id: 'welcome',
            sender: 'ai',
            text: lang === 'en' 
              ? `Hello ${parsed.name}! Welcome to Wallet Zone. How can I assist you with our premium leather collections today?`
              : `হ্যালো ${parsed.name}! ওয়ালেট জোনে আপনাকে স্বাগতম। আমাদের প্রিমিয়াম চামড়ার কালেকশন সম্পর্কে আপনাকে কীভাবে সাহায্য করতে পারি?`,
            timestamp: new Date().toISOString()
          };
          setMessages([welcome]);
        }
      } catch (err) {
        console.error('Error parsing chat session', err);
      }
    }
  }, [lang]);

  // Sync active chat messages on Supabase load
  useEffect(() => {
    const refreshChatMessages = () => {
      const activeSession = window.localStorage.getItem('wzone_active_chat_user');
      if (activeSession) {
        try {
          const parsed = JSON.parse(activeSession);
          const allChats = db.getChats();
          const existingChat = allChats.find(c => c.user_id === parsed.id);
          if (existingChat) {
            setMessages(existingChat.messages);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('wzone-db-synced', refreshChatMessages);
    return () => {
      window.removeEventListener('wzone-db-synced', refreshChatMessages);
    };
  }, []);

  // Keep chat scrolled to bottom
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen, isTyping]);

  // If chat is open, mark messages as read by customer
  useEffect(() => {
    if (isOpen && userId) {
      const chats = db.getChats();
      const updated = chats.map(c => {
        if (c.user_id === userId) {
          return { ...c, unread_by_customer: false };
        }
        return c;
      });
      db.setChats(updated);
    }
  }, [isOpen, userId, messages]);

  // Start chat registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) return;

    // Generate or fetch user ID
    const generatedId = `user-${userPhone.replace(/\D/g, '') || Math.floor(Math.random() * 1000000)}`;
    setUserId(generatedId);
    setIsRegistered(true);

    const sessionInfo = { id: generatedId, name: userName, phone: userPhone };
    window.localStorage.setItem('wzone_active_chat_user', JSON.stringify(sessionInfo));

    // Sync to db
    const allChats = db.getChats();
    const existing = allChats.find(c => c.user_id === generatedId);
    
    if (existing) {
      setMessages(existing.messages);
    } else {
      const welcome: ChatMessage = {
        id: 'welcome',
        sender: 'ai',
        text: lang === 'en' 
          ? `Hello ${userName}! Welcome to Wallet Zone. How can I help you find the perfect wallet, belt, or bag today?`
          : `হ্যালো ${userName}! ওয়ালেট জোনে আপনাকে স্বাগতম। আজ আপনার জন্য পারফেক্ট ওয়ালেট, বেল্ট বা ব্যাগ খুঁজে পেতে কীভাবে সাহায্য করতে পারি?`,
        timestamp: new Date().toISOString()
      };
      
      const newChat: Chat = {
        user_id: generatedId,
        user_name: userName,
        user_phone: userPhone,
        messages: [welcome],
        unread_by_admin: true,
        unread_by_customer: false,
        last_message_at: new Date().toISOString()
      };

      db.setChats([...allChats, newChat]);
      setMessages([welcome]);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: inputText,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText('');

    // Save to database immediately
    const chats = db.getChats();
    const existingIndex = chats.findIndex(c => c.user_id === userId);
    
    if (existingIndex > -1) {
      chats[existingIndex].messages = updatedMessages;
      chats[existingIndex].last_message_at = new Date().toISOString();
      chats[existingIndex].unread_by_admin = true;
      chats[existingIndex].unread_by_customer = false;
      db.setChats([...chats]);
    }

    // Call server API for Gemini AI response
    setIsTyping(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.slice(-8), // Send last 8 messages for context
          userName,
          userPhone
        })
      });

      if (!response.ok) throw new Error('Failed to fetch support response');
      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setMessages(finalMessages);

      // Save AI response to DB
      const currentChats = db.getChats();
      const idx = currentChats.findIndex(c => c.user_id === userId);
      if (idx > -1) {
        currentChats[idx].messages = finalMessages;
        currentChats[idx].last_message_at = new Date().toISOString();
        db.setChats(currentChats);
      }
    } catch (err) {
      console.error('Error fetching AI chat response', err);
      // Fallback
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'ai',
        text: lang === 'en'
          ? "I apologize, our luxury server is experiencing high traffic. Please try checking back in a moment or feel free to place your order directly!"
          : "আমি দুঃখিত, আমাদের সার্ভারে কিছুটা সমস্যা হচ্ছে। অনুগ্রহ করে একটু পরে আবার চেষ্টা করুন অথবা সরাসরি অর্ডার প্লেস করতে পারেন!",
        timestamp: new Date().toISOString()
      };
      const finalMessages = [...updatedMessages, errorMsg];
      setMessages(finalMessages);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="chat-widget-root">
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-amber-950 text-amber-100 hover:bg-amber-900 shadow-2xl rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-105 border border-amber-800 focus:outline-none"
        id="chat-toggle-btn"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && isRegistered && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className="absolute bottom-18 right-0 w-80 sm:w-96 h-[500px] bg-stone-50 border border-stone-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
          id="chat-window-panel"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-950 to-stone-900 text-stone-100 p-4 flex items-center justify-between border-b border-amber-900">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              <div>
                <h3 className="font-serif font-bold text-base tracking-wide text-amber-100">
                  Wallet Zone Support
                </h3>
                <p className="text-stone-300 text-[10px] uppercase tracking-wider">
                  {lang === 'en' ? 'Bilingual AI Assistant' : 'দ্বিভাষিক এআই অ্যাসিস্ট্যান্ট'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-stone-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Registration Form / Message Feed */}
          {!isRegistered ? (
            <div className="flex-1 p-6 flex flex-col justify-center bg-stone-100">
              <div className="text-center mb-6">
                <span className="inline-flex p-3 bg-amber-100 text-amber-950 rounded-full mb-3 border border-amber-200">
                  <MessageSquare className="w-6 h-6" />
                </span>
                <h4 className="font-serif font-bold text-stone-800 text-lg mb-1">
                  {lang === 'en' ? 'Start Premium Chat' : 'প্রিমিয়াম চ্যাট শুরু করুন'}
                </h4>
                <p className="text-stone-500 text-xs">
                  {lang === 'en' 
                    ? 'Introduce yourself to connect with our royal leather experts.' 
                    : 'আমাদের চামড়া বিশেষজ্ঞদের সাথে সংযোগ করতে নিজেকে পরিচয় করিয়ে দিন।'}
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                    {lang === 'en' ? 'Full Name' : 'পূর্ণ নাম'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g. Ramjan Islam' : 'উদাঃ রমজান ইসলাম'}
                      className="w-full bg-white border border-stone-300 rounded-xl py-2 pl-10 pr-4 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-stone-700 text-xs font-semibold mb-1 uppercase tracking-wider">
                    {lang === 'en' ? 'Phone Number' : 'ফোন নম্বর'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4.5 h-4.5 text-stone-400" />
                    <input
                      type="tel"
                      required
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder={lang === 'en' ? 'e.g. 01848301880' : 'উদাঃ ০১৮৪৮৩০১৮৮০'}
                      className="w-full bg-white border border-stone-300 rounded-xl py-2 pl-10 pr-4 text-stone-800 text-sm focus:outline-none focus:ring-1 focus:ring-amber-800 focus:border-amber-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-950 text-amber-100 hover:bg-amber-900 rounded-xl font-medium text-sm shadow transition-all duration-200 mt-2 hover:shadow-md"
                >
                  {lang === 'en' ? 'Connect to Support' : 'সাপোর্টের সাথে যুক্ত হন'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Message Feed */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-stone-50" id="chat-message-feed">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] text-stone-400 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                        {msg.sender === 'user' ? userName : msg.sender === 'admin' ? 'Admin' : 'Royal AI'}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-amber-950 text-amber-50 rounded-tr-none'
                          : msg.sender === 'admin'
                          ? 'bg-amber-100 text-stone-800 border border-amber-200 rounded-tl-none'
                          : 'bg-white text-stone-800 border border-stone-200 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex flex-col items-start animate-pulse">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                        Royal Support
                      </span>
                    </div>
                    <div className="bg-white text-stone-500 border border-stone-200 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm shadow-sm flex items-center gap-1">
                      <span>{lang === 'en' ? 'Crafting response' : 'উত্তর তৈরি করা হচ্ছে'}</span>
                      <span className="flex gap-0.5 mt-1.5">
                        <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-stone-400 rounded-full animate-bounce duration-300" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white border-t border-stone-200 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={lang === 'en' ? 'Ask about royal wallets, delivery...' : 'রাজকীয় ওয়ালেট, ডেলিভারি সম্পর্কে জিজ্ঞাসা করুন...'}
                  className="flex-1 bg-stone-100 border-none rounded-xl px-4 py-2 text-sm text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-800"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isTyping}
                  className="p-2.5 bg-amber-950 text-amber-100 rounded-xl hover:bg-amber-900 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}
