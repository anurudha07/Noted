'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();

  function decodeJwtPayload(token?: string | null) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        try {
          const u = JSON.parse(raw);
          if (u && (u.name || u.email)) {
            setProfile({ name: u.name, email: u.email });
            return;
          }
        } catch {
          if (raw.includes('@')) setProfile({ email: raw });
        }
      }
    } catch {}

    const keys = ['googleUser', 'profile', 'authUser'];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.name || parsed.displayName || parsed.email)) {
            setProfile({ name: parsed.name || parsed.displayName, email: parsed.email });
            return;
          }
        } catch {
          if (raw.includes('@')) setProfile({ email: raw });
        }
      } catch {}
    }

    try {
      const token = localStorage.getItem('token');
      const payload = decodeJwtPayload(token);
      if (payload && (payload.name || payload.email)) {
        setProfile({ name: payload.name, email: payload.email });
        return;
      }
    } catch {}

    setProfile({ name: '', email: '' });
  }, []);

  const displayName = profile?.name ?? 'Noted User';
  const displayEmail = profile?.email ?? '—';

  const handleLogout = () => {
    ['token', 'user', 'googleUser', 'profile', 'authUser'].forEach((k) =>
      localStorage.removeItem(k)
    );
    router.replace('/login');
  };

  return (
    <div className="w-full min-h-screen bg-black-950 text-white flex flex-col">
      {/* Header */}
      <header className="w-full bg-black-950">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-20 py-2 flex justify-between items-center">
          <span className="text-lg font-medium text-gray-600">Profile</span>
          <Link
            href="/dashboard"
            className="text-gray-500 text-sm font-medium inline-flex items-center gap-1 hover:translate-x-1 transition-transform"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main className="flex-1 text-center max-w-sm mx-auto px-3 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-gray-300"
        >
          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative rounded-full overflow-hidden border border-gray-700" style={{ width: 80, height: 80 }}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                className="absolute"
                style={{
                  width: 36,
                  height: 36,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <circle cx="12" cy="7.5" r="2.6" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.6" />
                <path d="M4 20c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Info */}
          <h1 className="text-base font-medium mb-1">{displayName}</h1>
          <p className="text-xs text-gray-400 mb-6">{displayEmail}</p>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-gray-500 text-xs font-medium inline-flex items-center gap-1 hover:translate-x-1 transition-transform"
          >
            Logout →
          </button>
        </motion.div>
      </main>
    </div>
  );
}
