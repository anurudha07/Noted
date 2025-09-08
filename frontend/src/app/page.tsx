'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import NoteCard from '../components/NoteCard';
import API from '../lib/api';
import { useRouter } from 'next/navigation';
import type { AxiosResponse } from 'axios';
import DateTimeDialog from '../components/DateTimeDialog';

type Reminder = {
  at?: string; 
  sent?: boolean;
  jobId?: string;
};

type NoteType = {
  _id: string;
  title?: string;
  content?: string;
  reminder?: Reminder;
  [k: string]: any;
};

function getNoteTimestamp(n: NoteType) {

  const tryFields = ['updatedAt', 'updated_at', 'modifiedAt', 'modified_at', 'editedAt', 'edited_at', 'createdAt', 'created_at'];
  for (const f of tryFields) {
    const v = n[f];
    if (v) {
      const t = typeof v === 'number' ? v : Date.parse(v);
      if (!Number.isNaN(t)) return t;
      try {
        const d = new Date(v);
        if (!Number.isNaN(d.getTime())) return d.getTime();
      } catch (e) {
      }
    }
  }

  // fallback — 
  try {
    if (typeof n._id === 'string' && n._id.length >= 8) {
      const seconds = parseInt(n._id.substring(0, 8), 16);
      if (!Number.isNaN(seconds)) return seconds * 1000;
    }
  } catch (e) {

  }

  return 0; // unknown
}

export default function HomePage() {
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [query, setQuery] = useState('');
  const [editingNote, setEditingNote] = useState<NoteType | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Reminder UI state
  const [reminderMessage, setReminderMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!reminderMessage) return;

    const timer = setTimeout(() => {
      setReminderMessage('');
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [reminderMessage]);

  const router = useRouter();

  // refs for outside click quick-add
  const quickRef = useRef<HTMLDivElement | null>(null);
  const creatingRef = useRef(false);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res: AxiosResponse<NoteType[]> = await API.get('/api/notes');
      const sorted = (res.data || []).slice().sort((a, b) => {
        return getNoteTimestamp(b) - getNoteTimestamp(a);
      });
      setNotes(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // createQuickNote: useCallback so effect deps are stable
  const parseQuickText = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    let title = '';
    let content = '';
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== '') {
        title = lines[i];
        content = lines.slice(i + 1).join('\n');
        break;
      }
    }
    if (!title) title = '';
    return { title, content };
  }, []);

  const createQuickNote = useCallback(async () => {
    if (!quickText.trim()) return;
    const { title, content } = parseQuickText(quickText);
    try {
      const res = await API.post<NoteType>('/api/notes', { title, content });
      // prepend new note 
      setNotes(prev => [res.data, ...prev]);
      setQuickText('');
      setEditingNote(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [parseQuickText, quickText]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchNotes();
  }, [fetchNotes, router]);

  // outside click -> create quick note if needed
  useEffect(() => {
    function handlePointerOutside(e: Event) {
      const target = e.target as Node;
      if (!quickRef.current) return;
      if (quickRef.current.contains(target)) return;
      if (quickText.trim() && !creatingRef.current) {
        creatingRef.current = true;
        createQuickNote().finally(() => {
          creatingRef.current = false;
        });
      }
    }

    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handlePointerOutside);
      document.removeEventListener('touchstart', handlePointerOutside as EventListener);
    };
  }, [quickText, createQuickNote]);

  const filtered = notes.filter(n => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
  });

  const openEdit = useCallback((note: NoteType) => {
    setEditingNote({ ...note });
    setMobileDrawerOpen(false);
    setReminderMessage('');
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingNote) return;
    try {
      const res = await API.put<NoteType>(`/api/notes/${editingNote._id}`, {
        title: editingNote.title,
        content: editingNote.content,
      });
      setNotes(prev => prev.map(n => (n._id === res.data._id ? res.data : n)));
      setEditingNote(null);
    } catch (err) {
      console.error(err);
    }
  }, [editingNote]);

  const deleteNote = useCallback(async (id: string) => {
    try {
      await API.delete(`/api/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
      if (editingNote && editingNote._id === id) setEditingNote(null);
    } catch (err) {
      console.error(err);
    }
  }, [editingNote]);

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <style jsx global>{`
        @media (min-width: 768px) {
          .custom-scrollbar::-webkit-scrollbar { width: 10px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #2f2f2f; border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #2f2f2f transparent; }
          body::-webkit-scrollbar { width: 12px; }
          body::-webkit-scrollbar-track { background: transparent; }
          body::-webkit-scrollbar-thumb { background-color: #2f2f2f; border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          body { scrollbar-width: thin; scrollbar-color: #2f2f2f transparent; }
        }
      `}</style>

      <div className="md:flex">
        <aside className="hidden md:flex flex-col w-72 fixed left-0 top-0 bottom-0 border-r border-gray-800 bg-black overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-gray-800">
            <div className="text-gray-400 text-xl uppercase tracking-wide mb-2">All Notes</div>
            <button onClick={() => fetchNotes()} className="w-full py-4 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200">Refresh</button>
          </div>

          <nav className="flex-1 p-2 overflow-y-auto">
            {notes.length === 0 && <div className="text-xs text-gray-500 p-4 text-center">No notes</div>}
            <div className="flex flex-col gap-2">
              {notes.map(n => (
                <button
                  key={n._id}
                  onClick={() => openEdit(n)}
                  className="flex flex-col items-start gap-2 w-full text-left px-3 py-3 hover:black transition border border-transparent hover:border-gray-700"
                  title={n.title || (n.content ? n.content.slice(0, 120) : '')}
                >
                  <div className="font-semibold text-sm truncate w-full">
                    {n.title || (n.content ? n.content.split('\n')[0].slice(0, 40) : 'Untitled')}
                  </div>
                  <div className="text-[11px] text-gray-400 line-clamp-2 w-full">{(n.content || '').slice(0, 80)}</div>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            {/* overlay - slightly lower z so drawer is clickable */}
            <div className="absolute inset-0 bg-black/40 z-30" onClick={() => setMobileDrawerOpen(false)} />
            {/* drawer - higher z */}
            <div className="absolute left-0 top-0 bottom-0 w-80 p-4 bg-black overflow-y-auto border-r border-gray-800 z-40">
              <div className="flex items-center justify-end mb-4">
                <button onClick={() => setMobileDrawerOpen(false)} className="px-2 py-1 text-xs rounded-sm panel-transparent">Close</button>
              </div>
              <div className="p-4 border-b border-gray-800">
                <div className="text-gray-400 text-xl uppercase tracking-wide mb-2">All Notes</div>
                <button onClick={() => fetchNotes()} className="w-full py-4 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200">Refresh</button>
              </div>

              {/* Mobile notes list (same as desktop aside) */}
              <nav className="mt-3">
                {notes.length === 0 && <div className="text-xs text-gray-500 p-4 text-center">No notes</div>}
                <div className="flex flex-col gap-2">
                  {notes.map(n => (
                    <button
                      key={n._id}
                      onClick={() => openEdit(n)}
                      className="flex flex-col items-start gap-2 w-full text-left px-3 py-3 hover:black transition border border-transparent hover:border-gray-700"
                      title={n.title || (n.content ? n.content.slice(0, 120) : '')}
                    >
                      <div className="font-semibold text-sm truncate w-full">
                        {n.title || (n.content ? n.content.split('\n')[0].slice(0, 40) : 'Untitled')}
                      </div>
                      <div className="text-[11px] text-gray-400 line-clamp-2 w-full">{(n.content || '').slice(0, 80)}</div>
                    </button>
                  ))}
                </div>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 md:ml-72">
          <Header />
          <div className="p-4 max-w-7xl mx-auto">
            <header className="flex items-center justify-between p-2 border-b border-gray-800 bg-black sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <button aria-label="Open menu" onClick={() => setMobileDrawerOpen(true)} className="md:hidden px-2 py-1 text-xs rounded-sm panel-transparent">☰</button>
                <div className="text-4xl">Noted</div>
              </div>

              <div className="flex-1 max-w-xs mx-4">
                <input value={query} onChange={e => setQuery(e.target.value)} placeholder="|    S E A R C H  ..." className="w-full px-8 py-10 text-l bg-transparent border border-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-500" />
              </div>
            </header>

            <div className="mb-6">
              <div ref={quickRef} className="p-3 panel-transparent border border-gray-800">
                <textarea value={quickText} onChange={e => setQuickText(e.target.value)} placeholder="Quick note — first line becomes title, rest is content" rows={3} className="w-full p-2 text-xs bg-transparent resize-none focus:outline-none" />
                <div className="flex items-center justify-end gap-2 mt-8">
                  <button onClick={() => setQuickText('')} className="px-3 py-1 text-xs rounded-sm panel-transparent">Clear</button>
                  <button onClick={createQuickNote} className="px-6 py-6 text-xs rounded-none bg-gray-800 text-white">New Note</button>
                </div>
              </div>
            </div>

            <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {loading && <div className="text-xs text-gray-400">Loading...</div>}
              {!loading && filtered.length === 0 && <div className="text-xs text-gray-400">No notes found</div>}
              {filtered.map(note => (
                <NoteCard key={note._id} note={note} onClick={() => openEdit(note)} onDelete={() => deleteNote(note._id)} />
              ))}
            </section>
          </div>
        </main>
      </div>

      {/* Edit modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingNote(null)} />
          <div className="relative w-full max-w-2xl p-4 bg-transparent border border-gray-800 rounded">
            <input
              value={editingNote.title}
              onChange={e => setEditingNote(prev => (prev ? { ...prev, title: e.target.value } : prev))}
              placeholder="Title"
              className="w-full p-2 mb-2 text-sm bg-transparent border-b border-gray-800 focus:outline-none"
            />
            <textarea
              value={editingNote.content}
              onChange={e => setEditingNote(prev => (prev ? { ...prev, content: e.target.value } : prev))}
              rows={10}
              className="w-full p-2 text-sm bg-transparent resize-none focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2 mt-3">
              {/* REMINDER: Open dialog instead of dropdown */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDialogOpen(true);
                    setReminderMessage('');
                  }}
                  className="px-3 py-1 text-xs rounded-sm panel-transparent"
                >
                  Set reminder
                </button>

                {/* quick status text */}
                {editingNote?.reminder?.at ? (
                  <div className="text-xs text-gray-400">
                    Scheduled: {new Date(editingNote.reminder.at).toLocaleString()} • Sent: {editingNote.reminder.sent ? 'Yes' : 'No'}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">No reminder</div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setEditingNote(null)} className="px-3 py-1 text-xs rounded-sm panel-transparent">Cancel</button>
                <button onClick={saveEdit} className="w-18 h-15 flex items-center justify-center bg-gray-800 text-white text-sm">Save</button>
              </div>
            </div>

            {editingNote.reminder?.at && (
              <div className="text-xs text-gray-400 mt-2">
                Scheduled at: {new Date(editingNote.reminder.at).toLocaleString()} • Sent: {editingNote.reminder.sent ? 'Yes' : 'No'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DateTime dialog */}
      <DateTimeDialog
        isOpen={dialogOpen}
        initialIso={editingNote?.reminder?.at ?? null}
        minuteStep={5}
        onClose={() => setDialogOpen(false)}
        onConfirm={async (isoUtc) => {
          if (!editingNote) {
            setReminderMessage('No note selected');
            setDialogOpen(false);
            return;
          }
          try {
            await API.post(`/api/notes/${editingNote._id}/reminder`, { at: isoUtc });
            setReminderMessage('Reminder scheduled');
            await fetchNotes();
            setEditingNote(prev => (prev ? { ...prev, reminder: { at: isoUtc, sent: false } } : prev));
          } catch (err) {
            console.error('Failed scheduling reminder', err);
            setReminderMessage('Failed to schedule');
          } finally {
            setDialogOpen(false);
          }
        }}
      />

      {/* inline small message area */}
      {reminderMessage && <div className="fixed bottom-6 right-6 text-xs text-green-400">{reminderMessage}</div>}
    </div>
  );
}
