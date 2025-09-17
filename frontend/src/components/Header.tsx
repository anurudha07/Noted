'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { clearToken } from '@/lib/auth';

export default function Header() {
  const router = useRouter();
  const [appOpen, setAppOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);

  const appRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  function decodeJwtPayload(token?: string | null) {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (payload.length % 4) payload += '=';
      const json = atob(payload);
      return JSON.parse(json);
    } catch { return null; }
  }

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        if (parsed && (parsed.email || parsed.name)) {
          setProfile({ name: parsed.name, email: parsed.email });
          return;
        }
      }
    } catch {}

    const keys = ['googleUser', 'user', 'profile', 'authUser'];
    for (const k of keys) {
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.email || parsed.name || parsed.displayName)) {
            setProfile({ name: parsed.name || parsed.displayName, email: parsed.email });
            return;
          }
        } catch {
          if (raw.includes('@')) { setProfile({ email: raw }); return; }
        }
      } catch {}
    }

    try {
      const token = localStorage.getItem('token');
      const p = decodeJwtPayload(token);
      if (p && (p.email || p.name)) {
        setProfile({ name: p.name, email: p.email });
        return;
      }
    } catch {}
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (appRef.current && !appRef.current.contains(t)) setAppOpen(false);
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const logout = () => {
    clearToken();
    ['googleUser', 'user', 'profile', 'authUser'].forEach(k => localStorage.removeItem(k));
    router.replace('/');
  };

  const goto = (path: string) => { setAppOpen(false); router.push(path); };

  const initial = (profile?.name || profile?.email || 'U')[0]?.toUpperCase() ?? 'U';

  // Apps list with professional SVG icons
  const apps = [
    {
      name: 'Reminders',
      path: '/dashboard/reminders',
      logo: (
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Trash',
      path: '/dashboard/trash',
      logo: (
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M9 7V4h6v3" />
        </svg>
      ),
    },
  ];

  return (
    <header className="w-full p-3 flex items-center justify-end border-b border-gray-800">
      <div className="flex items-center gap-3">
        <div className="relative" ref={appRef}>
          <button
            aria-label="Open app drawer"
            onClick={() => setAppOpen(v => !v)}
            className="p-2 rounded panel-transparent flex items-center justify-center"
            title="Apps"
          >
            <div className="grid grid-cols-2 gap-1 w-5 h-5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>
          </button>

          {appOpen && (
            <div className="absolute right-0 mt-4px w-38 h-32  bg-black border border-gray-800 shadow-lg z-45 ">
              <div className="p-2">
                <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Apps</div>
                {apps.map(app => (
                  <button
                    key={app.name}
                    onClick={() => goto(app.path)}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-900"
                  >
                    {app.logo}
                    <span className="text-gray-200">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            aria-label="Open profile"
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-2 px-2 py-1 rounded panel-transparent"
            title={profile?.email ?? 'Profile'}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 border border-gray-700 text-sm font-semibold">{initial}</div>
            <div className="hidden sm:block text-sm truncate max-w-[10rem]">{profile?.name ? `• ${profile.name}` : (profile?.email ?? 'Profile')}</div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-4px w-56 bg-black border border-gray-800 shadow-lg z-50 ">
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-800 border border-gray-700 text-sm font-semibold">{initial}</div>
                  <div>
                    <div className="text-sm font-semibold">{profile?.name ?? 'User'}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[12rem]">{profile?.email ?? 'No account'}</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-col gap-2">
                  <button
                    onClick={() => { router.push('/dashboard/profile'); setProfileOpen(false); }}
                    className="w-full text-left px-3 py-2  hover:bg-gray-900"
                  >
                    View profile
                  </button>
                  <button onClick={logout} className="w-full text-left px-3 py-2 hover:bg-gray-900">
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
