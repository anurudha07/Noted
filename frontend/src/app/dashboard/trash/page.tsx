'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import type { AxiosResponse } from 'axios';
import API from '../../../lib/api';
import Link from 'next/link';
import developerAnimation from '../../../../public/developer-animation.json';

type NoteType = { _id: string; title?: string; content?: string; deletedAt?: string };

function ConfirmDialog({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-md p-5 border border-gray-800 rounded-2xl bg-black-950">
        <h3 className="text-lg text-white">{title}</h3>
        {description && <p className="mt-2 text-sm text-gray-300">{description}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 bg-white/5">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 bg-gray-600 text-gray-400">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TrashMinimal() {
  const [trash, setTrash] = useState<NoteType[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | { type: 'empty' | 'permanent'; id?: string }>(null);

  const fetchTrash = useCallback(
    async (p = 1) => {
      setLoading(true);
      try {
        const res: AxiosResponse<NoteType[]> = await API.get('/api/notes/trash', { params: { page: p, pageSize } });
        setTrash(prev => (p === 1 ? res.data || [] : [...prev, ...(res.data || [])]));
      } catch (err) {
        console.error(err);
        setToast('Failed to load trash');
      } finally {
        setLoading(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    fetchTrash(1);
    setPage(1);
  }, [fetchTrash]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const restore = async (id: string) => {
    const prev = trash;
    setTrash(trash.filter(t => t._id !== id));
    setToast('Restored');
    try {
      await API.post(`/api/notes/${id}/restore`);
    } catch {
      setToast('Restore failed');
      setTrash(prev);
    }
  };

  const permanentDelete = async (id: string) => {
    const prev = trash;
    setTrash(trash.filter(t => t._id !== id));
    setToast('Permanently deleted');
    try {
      await API.delete(`/api/notes/${id}/permanent`);
    } catch {
      setToast('Delete failed');
      setTrash(prev);
    }
  };

  const emptyTrash = async () => {
    const prev = trash;
    setTrash([]);
    setToast('Trash emptied');
    try {
      await API.post('/api/notes/trash/empty');
    } catch {
      setToast('Failed to empty trash');
      setTrash(prev);
    }
  };

  // Type-safe truncation
  const truncateWords = (text?: string, wordLimit = 7) => {
    if (!text) return '';
    const cleaned = text.replace(/\s+/g, ' ').trim();
    const words = cleaned.split(' ');
    return words.length <= wordLimit ? cleaned : words.slice(0, wordLimit).join(' ') + '…';
  };

  return (
    <div className="w-full min-h-screen bg-black-950 text-white flex flex-col">
      <header className="w-full bg-black-950">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-20 py-3">
          <div className="flex items-center gap-2 text-base text-blue-600">
            <span className="text-xl text-gray-400">Noted</span>
          </div>
        </div>
        <header className="w-full bg-black-950 fixed top-0 z-20">
  <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-20 py-3 flex justify-between items-center">
    <div className="flex items-center gap-2 text-base text-blue-600">
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

      </header>

      <main className="flex-1 text-center max-w-3xl mx-auto px-4" style={{ marginTop: '6.5rem' }}>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-xl font-medium text-white mb-6"
        >
          Trash — <span className="text-gray-500">recover or remove</span>
        </motion.h1>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay: 0.12 }} className="text-gray-400 text-sm">
          <p className="mb-2">Recently deleted notes are listed here. You can restore them or delete them permanently.</p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/8">
              <span className="text-sm text-white/90">{trash.length} items</span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/8">
              <span className="text-sm text-white/80">Retention: 30 days</span>
            </div>
          </div>
        </motion.div>

        <div className="mt-6 flex justify-center pb-6">
          <Lottie
            animationData={developerAnimation}
            loop
            autoplay
            style={{
              width: 160,
              height: 180,
              filter:
                'brightness(0) saturate(100%) invert(12%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(90%) contrast(70%)',
            }}
          />
        </div>

        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={() => fetchTrash(1)} className="px-3 py-2 bg-gray-600 text-gray-400">
                Refresh
              </button>
              <button
                onClick={() => {
                  setConfirmAction({ type: 'empty' });
                  setConfirmOpen(true);
                }}
                className="px-3 py-2 rounded text-gray-600"
              >
                Empty Trash
              </button>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="px-3 py-2 rounded text-gray-600">
                Open Notes
              </Link>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse p-4 rounded-xl bg-transparent border border-gray-700/40 h-24" />
                ))
              : trash.length === 0
              ? (
                <div className="py-12 text-center text-gray-400 text-sm">
                  <div>No items in trash</div>
                  <div className="mt-2 max-w-lg mx-auto">Deleted notes will appear here for 30 days before being permanently removed.</div>
                  <div className="mt-6">
                    <Link href="/dashboard" className="px-4 py-2 text-gray-600">
                      Go to notes →
                    </Link>
                  </div>
                </div>
              )
              : trash.map(n => (
                  <div key={n._id} className="p-4 bg-transparent border border-gray-700/40 flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div className="text-left mb-2 sm:mb-0">
                      <h3 className="text-md font-semibold text-white truncate">
                        {n.title || (n.content ?? '').split('\n')[0] || 'Untitled'}
                      </h3>
                      <p className="text-sm text-gray-300 max-w-md">{truncateWords(n.content, 6)}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        Deleted at: {n.deletedAt ? new Date(n.deletedAt).toLocaleString() : '—'}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <button
                        onClick={() => restore(n._id)}
                        className="text-gray-600 text-sm font-medium inline-flex items-center gap-1 hover:translate-x-1 transition-transform"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => {
                          setConfirmAction({ type: 'permanent', id: n._id });
                          setConfirmOpen(true);
                        }}
                        className="text-red-400 text-sm font-medium inline-flex items-center gap-1 hover:translate-x-1 transition-transform"
                      >
                        Delete permanently
                      </button>
                    </div>
                  </div>
                ))}
          </div>

          {trash.length >= pageSize * page && (
            <div className="mt-6 flex items-center justify-center">
              <button
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  fetchTrash(next);
                }}
                className="px-4 py-2 bg-white/5 rounded"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmAction?.type === 'empty' ? 'Empty Trash' : 'Delete permanently'}
        description={
          confirmAction?.type === 'empty'
            ? 'This will permanently delete all items in the trash. This cannot be undone.'
            : 'This will permanently delete this note. This cannot be undone.'
        }
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
        onConfirm={() => {
          if (!confirmAction) return;
          confirmAction.type === 'empty'
            ? emptyTrash()
            : confirmAction.id && permanentDelete(confirmAction.id);
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
      />

      {toast && (
        <div className="fixed right-6 bottom-6 z-50">
          <div className="px-4 py-2 bg-black/70 border border-white/6 rounded-lg text-sm text-white">{toast}</div>
        </div>
      )}
    </div>
  );
}
