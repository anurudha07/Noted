'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import type { AxiosResponse } from 'axios';
import API from '../../../lib/api';
import Link from 'next/link';

type Reminder = { at?: string; sent?: boolean; jobId?: string };
type NoteType = { _id: string; title?: string; content?: string; reminder?: Reminder; [k: string]: unknown };

export default function HomeReminders() {
  const [reminders, setReminders] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [animationData, setAnimationData] = useState<object | null>(null);

  const truncateWords = (text: string, wordLimit: number): string => {
    const words = text.split(/\s+/);
    return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '…';
  };

  // Load Lottie JSON
  useEffect(() => {
    fetch('/developer-animation.json')
      .then((r) => {
        if (!r.ok) throw new Error('failed to load animation');
        return r.json();
      })
      .then((json: object) => setAnimationData(json))
      .catch(() => setAnimationData(null));
  }, []);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    try {
      const res: AxiosResponse<NoteType[]> = await API.get('/api/notes/reminders');
      const activeReminders = (res.data || [])
        .filter((r) => !r.reminder?.sent)
        .sort(
          (a, b) =>
            (new Date(a.reminder?.at ?? '').getTime() || 0) -
            (new Date(b.reminder?.at ?? '').getTime() || 0)
        );
      setReminders(activeReminders);
    } catch (err) {
      console.error(err);
      setToast('Failed loading reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = reminders.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (String(r.title ?? '')).toLowerCase().includes(q) ||
      (String(r.content ?? '')).toLowerCase().includes(q)
    );
  });

  const dismiss = async (id: string) => {
    const prev = [...reminders];
    setReminders(
      reminders.map((r) =>
        r._id === id ? { ...r, reminder: { ...(r.reminder ?? {}), sent: true } } : r
      )
    );
    setToast('Dismissed');
    try {
      await API.post(`/api/notes/${id}/reminder/dismiss`);
      fetchReminders();
    } catch (err) {
      console.error(err);
      setToast('Dismiss failed');
      setReminders(prev);
    }
  };

  const total = reminders.length;
  const nextAt = reminders[0]?.reminder?.at
    ? new Date(reminders[0].reminder.at).toLocaleString()
    : '—';

  return (
    <div className="w-full min-h-screen bg-black-950 text-white flex flex-col">
      {/* Header */}
      <header className="w-full bg-black-950 fixed top-0 z-20">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-4 lg:px-20 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <span className="text-xl text-gray-400">Noted</span>
          </div>
          <Link
            href="/dashboard"
            className="text-gray-600 text-sm font-medium inline-flex items-center gap-1 transform transition-transform duration-150 hover:translate-x-1"
          >
            Back →
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 text-center max-w-2xl mx-auto px-3 pt-30">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-sm font-medium text-white mb-4"
        >
          Reminders — <span className="text-gray-500">stay on track</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="text-gray-400 text-xs mb-4"
        >
          <p className="mb-1">
            All upcoming reminders — stored in UTC and shown in your local timezone.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3 h-3 text-white/80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l2 2" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
              <span className="text-xs text-white/90">{total} total</span>
            </div>
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/8">
              <span className="text-xs text-white/80">Next: {nextAt}</span>
            </div>
          </div>
        </motion.div>

        {/* Lottie */}
        <div className="mt-4 flex justify-center pb-4">
          {animationData ? (
            <Lottie
              animationData={animationData}
              loop
              autoplay
              style={{
                width: 120,
                height: 140,
                filter: "brightness(0) saturate(100%) invert(12%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(70%)"
              }}
            />
          ) : (
            <div className="w-[120px] h-[140px] flex items-center justify-center text-xs text-gray-500">
              Animation
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="max-w-2xl mx-auto px-2 mb-4 flex flex-wrap gap-2 items-center justify-between">
          <div className="relative">
            <input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search reminders"
              className="w-44 px-2 py-1 bg-transparent border border-white/8 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 text-xs rounded"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-1 top-1 text-2xs text-gray-400"
              >
                Clear
              </button>
            )}
          </div>
          <button onClick={fetchReminders} className="px-2 py-1 bg-gray-600 text-white text-xs">
            Refresh
          </button>
        </div>

        {/* Reminder List */}
        <div className="flex flex-col gap-3 px-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse p-3 rounded-lg bg-transparent border border-gray-700/40 h-16" />
            ))
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-gray-700 text-xs">
              <div className="mt-1 max-w-lg mx-auto text-xs">
                No reminders found. Create one from a note — or try refreshing.
              </div>
              <div className="mt-3">
                <Link href="/dashboard" className="px-3 py-1 text-gray-400 text-xs">
                  Go to notes →
                </Link>
              </div>
            </div>
          ) : (
            filtered.map((n) => (
              <div
                key={n._id}
                className="p-3 bg-transparent border border-gray-700/40 flex flex-col sm:flex-row sm:justify-between sm:items-center rounded"
              >
                <div className="text-left mb-1 sm:mb-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {n.title || (n.content ?? '').split('\n')[0] || 'Untitled'}
                  </h3>
                  <p className="text-xs text-gray-300 max-w-md">{truncateWords(n.content ?? '', 6)}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    {n.reminder?.at ? new Date(n.reminder.at).toLocaleString() : 'No date'} • Sent: {n.reminder?.sent ? 'Yes' : 'No'}
                  </div>
                </div>
                <div className="flex justify-end mt-2 sm:mt-0">
                  <button
                    onClick={() => dismiss(n._id)}
                    className="text-gray-600 text-xs font-medium inline-flex items-center gap-1 transform transition-transform duration-150 hover:translate-x-1"
                  >
                    Dismiss →
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed right-4 bottom-4 z-50">
          <div className="px-3 py-1 bg-black/70 border border-white/6 rounded-lg text-xs text-white">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
