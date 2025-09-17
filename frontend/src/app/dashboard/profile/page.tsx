'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const router = useRouter();

  // safe JWT payload decode (base64url)
  function decodeJwtPayload(token?: string | null) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      const json = atob(payload);
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  useEffect(() => {
    // 1) try persisted user object
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
          if (raw.includes('@')) {
            setProfile({ email: raw });
            return;
          }
        }
      }
    } catch {}

    // 2) try common keys
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
          if (raw.includes('@')) {
            setProfile({ email: raw });
            return;
          }
        }
      } catch {}
    }

    // 3) fallback: decode token payload
    try {
      const token = localStorage.getItem('token');
      const payload = decodeJwtPayload(token);
      if (payload && (payload.name || payload.email)) {
        setProfile({ name: payload.name, email: payload.email });
        return;
      }
    } catch {}

    // final fallback
    setProfile({ name: '', email: '' });
  }, []);

  const displayName = profile?.name ?? 'Noted User';
  const displayEmail = profile?.email ?? '—';

  // Logout handler
  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('googleUser');
      localStorage.removeItem('profile');
      localStorage.removeItem('authUser');
    } catch {}
    router.replace('/'); 
  };

  return (
    <div className="w-full min-h-screen bg-black-950 text-white flex flex-col">
      {/* Header with Back Button */}
      <header className="w-full bg-black-950">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-20 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 text-base font-medium text-gray-600">
            <span className="text-xl">Profile</span>
          </div>
          <Link
            href="/dashboard"
            className="text-gray-600 text-sm font-medium inline-flex items-center gap-1 transform transition-transform duration-150 hover:translate-x-1"
          >
            ← Back
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main
        className="flex-1 text-center max-w-2xl mx-auto px-4"
        style={{ marginTop: '6rem' }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-gray-300"
        >
          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div
              className="relative rounded-full overflow-hidden border border-gray-700 "
              style={{ width: 120, height: 120 }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
                className="absolute"
                style={{
                  width: 56,
                  height: 56,
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <circle
                  cx="12"
                  cy="7.5"
                  r="2.6"
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="1.6"
                />
                <path
                  d="M4 20c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5"
                  fill="none"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Info */}
          <h1 className="text-lg mb-2">{displayName}</h1>
          <p className="text-sm text-gray-400 mb-10">{displayEmail}</p>

          {/* Logout Button */}
          <div className="flex justify-center">
            <button
              onClick={handleLogout}
              className="text-gray-600 text-sm font-medium inline-flex items-center gap-1 transform transition-transform duration-150 hover:translate-x-1"
            >
              Logout →
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
