'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import type { AxiosResponse } from 'axios';
import API from '../../../lib/api';
import Link from 'next/link';

type NoteType = { _id: string; title?: string; content?: string; deletedAt?: string };

export default function TrashMinimal() {
  const [trash, setTrash] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [animationData, setAnimationData] = useState<object | null>(null);

  // Load Lottie animation JSON
  useEffect(() => {
    fetch('/developer-animation.json')
      .then((r) => r.json())
      .then(setAnimationData)
      .catch(() => setAnimationData(null));
  }, []);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const res: AxiosResponse<NoteType[]> = await API.get('/api/notes/trash');
      setTrash(res.data || []);
    } catch {
      setToast('Failed loading trash');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const restore = async (id: string) => {
    const prev = [...trash];
    setTrash(trash.filter((t) => t._id !== id));
    setToast('Restored');
    try {
      await API.post(`/api/notes/${id}/restore`);
    } catch {
      setToast('Restore failed');
      setTrash(prev);
    }
  };

  const permanentDelete = async (id: string) => {
    const prev = [...trash];
    setTrash(trash.filter((t) => t._id !== id));
    setToast('Deleted permanently');
    try {
      await API.delete(`/api/notes/${id}/permanent`);
    } catch {
      setToast('Delete failed');
      setTrash(prev);
    }
  };

  const truncateWords = (text?: string, wordLimit = 6) => {
    if (!text) return '';
    const words = text.trim().split(/\s+/);
    return words.length <= wordLimit ? text : words.slice(0, wordLimit).join(' ') + '…';
  };

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

      {/* Main */}
      <main className="flex-1 text-center max-w-2xl mx-auto px-3 pt-30">
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-sm font-medium text-white mb-4"
        >
          Trash — <span className="text-gray-500">recover or delete</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.12 }}
          className="text-gray-400 text-xs mb-4"
        >
          <p className="mb-1">Recently deleted notes. Restore them or remove permanently.</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/8">
              <span className="text-xs text-white/90">{trash.length} items</span>
            </div>
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-white/5 border border-white/8">
              <span className="text-xs text-white/80">Retention: 30 days</span>
            </div>
          </div>
        </motion.div>

        {/* Lottie */}
        <div className="mt-4 flex justify-center pb-4">
          {animationData && (
            <Lottie
              animationData={animationData}
              loop
              autoplay
              style={{
                width: 120,
                height: 140,
                filter:
                  "brightness(0) saturate(100%) invert(12%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(70%)",
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="max-w-2xl mx-auto px-2 mb-4 flex flex-wrap gap-2 items-center justify-between">
          <button onClick={fetchTrash} className="px-2 py-1 bg-gray-600 text-white text-xs ">
            Refresh
          </button>
          <button
            onClick={() => setTrash([])}
            className="px-2 py-1 bg-transparent border border-gray-600 text-xs  text-gray-400 hover:bg-gray-800/40"
          >
            Empty Trash
          </button>
        </div>

        {/* Trash List */}
        <div className="flex flex-col gap-3 px-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse p-3 rounded-lg bg-transparent border border-gray-700/40 h-16"
              />
            ))
          ) : trash.length === 0 ? (
            <div className="py-8 text-center text-gray-700 text-xs">
              <div className="mt-1 max-w-lg mx-auto text-xs">
                No items in trash. Deleted notes will stay here for 30 days.
              </div>
              <div className="mt-3">
                <Link href="/dashboard" className="px-3 py-1 text-gray-400 text-xs">
                  Go to notes →
                </Link>
              </div>
            </div>
          ) : (
            trash.map((n) => (
              <div
                key={n._id}
                className="p-3 bg-transparent border border-gray-700/40 flex flex-col sm:flex-row sm:justify-between sm:items-center rounded"
              >
                <div className="text-left mb-1 sm:mb-0">
                  <h3 className="text-sm font-medium text-white truncate">
                    {n.title || (n.content || '').split('\n')[0] || 'Untitled'}
                  </h3>
                  <p className="text-xs text-gray-300 max-w-md">{truncateWords(n.content)}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    Deleted: {n.deletedAt ? new Date(n.deletedAt).toLocaleString() : '—'}
                  </div>
                </div>
                <div className="flex justify-end mt-2 sm:mt-0 gap-3">
                  <button
                    onClick={() => restore(n._id)}
                    className="text-gray-600 text-xs font-medium inline-flex items-center gap-1 hover:translate-x-1 transition-transform"
                  >
                    Restore →
                  </button>
                  <button
                    onClick={() => permanentDelete(n._id)}
                    className="text-red-400 text-xs font-medium inline-flex items-center gap-1 hover:translate-x-1 transition-transform"
                  >
                    Delete →
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
