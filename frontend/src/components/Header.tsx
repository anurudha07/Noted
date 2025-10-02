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
    } catch {
      return null;
    }
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
          if (raw.includes('@')) {
            setProfile({ email: raw });
            return;
          }
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

  const goto = (path: string) => {
    setAppOpen(false);
    router.push(path);
  };

  const initial = (profile?.name || profile?.email || 'U')[0]?.toUpperCase() ?? 'U';

  const apps = [
    {
      name: 'Reminders',
      path: '/dashboard/reminders',
      logo: (
        <svg
          className="w-4 h-8 text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Trash',
      path: '/dashboard/trash',
      logo: (
        <svg
          className="w-4 h-8 text-gray-300"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5 4v6m4-6v6M9 7V4h6v3"
          />
        </svg>
      ),
    },
  ];

  return (
    <header className="w-full p-2 flex items-center justify-end border-b border-gray-800">
      <div className="flex items-center gap-2">
        {/* Apps menu */}
        <div className="relative" ref={appRef}>
          <button
            aria-label="Open app drawer"
            onClick={() => setAppOpen(v => !v)}
            className="p-1 rounded panel-transparent flex items-center justify-center"
            title="Apps"
          >
            <div className="grid grid-cols-2 gap-[2px] w-4 h-4">
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="w-1 h-1 rounded-full bg-gray-300" />
            </div>
          </button>

          {appOpen && (
            <div className="absolute right-0 mt-2 w-32 bg-black border border-gray-800 shadow-lg z-40">
              <div className="p-2">
                <div className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Apps</div>
                {apps.map(app => (
                  <button
                    key={app.name}
                    onClick={() => goto(app.path)}
                    className="w-full flex items-center gap-1 px-2 py-1 hover:bg-gray-900 text-xs"
                  >
                    {app.logo}
                    <span className="text-gray-200">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative" ref={profileRef}>
          <button
            aria-label="Open profile"
            onClick={() => setProfileOpen(v => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded panel-transparent"
            title={profile?.email ?? 'Profile'}
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 border border-gray-700 text-[10px] font-semibold">
              {initial}
            </div>
            <div className="hidden sm:block text-xs truncate max-w-[26rem]">
              {profile?.name ? `• ${profile.name}` : profile?.email ?? 'Profile'}
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-black border border-gray-800 shadow-lg z-50">
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-800 border border-gray-700 text-xs font-semibold">
                    {initial}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{profile?.name ?? 'User'}</div>
                    <div className="text-[10px] text-gray-400 truncate max-w-[9rem]">
                      {profile?.email ?? 'No account'}
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      router.push('/dashboard/profile');
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-2 py-1 hover:bg-gray-900 text-xs"
                  >
                    View profile
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-2 py-1 hover:bg-gray-900 text-xs"
                  >
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
