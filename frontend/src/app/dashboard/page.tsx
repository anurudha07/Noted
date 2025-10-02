'use client';

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Header from '../../components/Header';
import NoteCard from '../../components/NoteCard';
import API from '../../lib/api';
import { useRouter } from 'next/navigation';
import type { AxiosResponse } from 'axios';
import DateTimeDialog from '../../components/DateTimeDialog';

import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Types
type Reminder = { at?: string; sent?: boolean; jobId?: string };
type NoteType = { _id: string; title?: string; content?: string; reminder?: Reminder; [k: string]: unknown };

// --- Helpers
function getNoteTimestamp(n: NoteType) {
  const tryFields = ['updatedAt','updated_at','modifiedAt','modified_at','editedAt','edited_at','createdAt','created_at'];
  for (const f of tryFields) {
    const v = n[f as keyof NoteType];
    if (v != null) {
      if (typeof v === 'number' && !Number.isNaN(v)) return v;
      if (typeof v === 'string') {
        const t = Date.parse(v);
        if (!Number.isNaN(t)) return t;
      }
      try { const d = new Date(v as unknown as string); if (!Number.isNaN(d.getTime())) return d.getTime(); } catch {}
    }
  }
  try { if (typeof n._id === 'string' && n._id.length >= 8) { const seconds = parseInt(n._id.substring(0,8),16); if (!Number.isNaN(seconds)) return seconds*1000; } } catch {}
  return 0;
}

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || undefined,
    zIndex: isDragging ? 9999 : undefined,
    touchAction: isDragging ? 'none' : 'pan-y',
    WebkitTapHighlightColor: 'transparent',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    WebkitTouchCallout: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

export default function HomePage() {
  // --- state
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [query, setQuery] = useState('');
  const [editingNote, setEditingNote] = useState<NoteType | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [saving, setSaving] = useState(false); // <--- new saving state

  const router = useRouter();
  const quickRef = useRef<HTMLDivElement | null>(null);
  const creatingRef = useRef(false);

  // textarea ref for auto-resize in modal
  const editTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // --- touch detection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      try { setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches); } catch (e) { setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0); }
    }
  }, []);

  useEffect(() => { if (!reminderMessage) return; const t = setTimeout(() => setReminderMessage(''), 5000); return () => clearTimeout(t); }, [reminderMessage]);

  // --- fetch notes
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res: AxiosResponse<NoteType[]> = await API.get('/api/notes');
      let sorted = (res.data || []).slice().sort((a, b) => getNoteTimestamp(b) - getNoteTimestamp(a));
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('notesOrder') : null;
        if (stored) {
          const order: string[] = JSON.parse(stored);
          const map = new Map(sorted.map(n => [n._id, n]));
          const reordered: NoteType[] = [];
          for (const id of order) { const it = map.get(id); if (it) { reordered.push(it); map.delete(id); } }
          for (const v of map.values()) reordered.push(v);
          sorted = reordered;
        }
      } catch (e) {}
      setNotes(sorted);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  const parseQuickText = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    let title = '', content = '';
    for (let i = 0; i < lines.length; i++) { if (lines[i] !== '') { title = lines[i]; content = lines.slice(i+1).join('\n'); break; } }
    return { title, content };
  }, []);

  const createQuickNote = useCallback(async () => {
    if (!quickText.trim()) return;
    const { title, content } = parseQuickText(quickText);
    try {
      const res = await API.post<NoteType>('/api/notes', { title, content });
      setNotes(prev => {
        const next = [...prev.filter(n => n._id !== res.data._id), res.data];
        try { localStorage.setItem('notesOrder', JSON.stringify(next.map(n => n._id))); } catch (e) {}
        return next;
      });
      setQuickText('');
      setEditingNote(res.data);
    } catch (err) { console.error(err); }
  }, [parseQuickText, quickText]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) { router.replace('/login'); return; }
    fetchNotes();
  }, [fetchNotes, router]);

  useEffect(() => {
    function handlePointerOutside(e: Event) {
      const target = e.target as Node;
      if (!quickRef.current) return;
      if (quickRef.current.contains(target)) return;
      if (quickText.trim() && !creatingRef.current) {
        creatingRef.current = true;
        createQuickNote().finally(() => { creatingRef.current = false; });
      }
    }
    document.addEventListener('mousedown', handlePointerOutside);
    document.addEventListener('touchstart', handlePointerOutside, { passive: true } as AddEventListenerOptions);
    return () => { document.removeEventListener('mousedown', handlePointerOutside); document.removeEventListener('touchstart', handlePointerOutside as EventListener); };
  }, [quickText, createQuickNote]);

  const filtered = notes.filter(n => {
    const q = query.trim().toLowerCase(); if (!q) return true;
    return (String(n.title||'')).toLowerCase().includes(q) || (String(n.content||'')).toLowerCase().includes(q);
  });

  const openEdit = useCallback((note: NoteType) => { setEditingNote({ ...note }); setMobileDrawerOpen(false); setReminderMessage(''); }, []);

  // auto-resize helper for the edit modal textarea
  const autoResizeEditTextarea = useCallback(() => {
    const ta = editTextareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    // add a small extra so caret never touches bottom
    ta.style.height = Math.min(600, ta.scrollHeight + 2) + 'px';
  }, []);

  // call auto-resize when editingNote changes (open) or when its content updates
  useEffect(() => {
    if (!editingNote) return;
    // wait for textarea to mount
    const t = setTimeout(() => autoResizeEditTextarea(), 25);
    return () => clearTimeout(t);
  }, [editingNote, autoResizeEditTextarea]);

  // --- fixed saveEdit: previously used editingNote._1d (typo). Added 'saving' UX.
  const saveEdit = useCallback(async () => {
    if (!editingNote) return;
    setSaving(true);
    try {
      const res = await API.put<NoteType>(`/api/notes/${editingNote._id}`, { title: editingNote.title, content: editingNote.content });
      setNotes(prev => prev.map(n => (n._id === res.data._id ? res.data : n)));
      setEditingNote(null);
    } catch (err) {
      console.error('Failed saving note', err);
      setReminderMessage('Failed to save note');
    } finally {
      setSaving(false);
    }
  }, [editingNote]);

  const deleteNote = async (id: string) => {
    const prev = [...notes];
    setNotes(prevNotes => prevNotes.filter(n => n._id !== id));
    try {
      const res = await API.post(`/api/notes/${id}/trash`);
      if (!res || (res.status && res.status >= 400)) throw new Error('Server error deleting note');
    } catch (err) {
      console.error('Failed to move note to trash', err);
      setNotes(prev);
    }
  };

  // --- dnd-kit sensors
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 6 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });
  const sensors = useSensors(...(isTouchDevice ? [touchSensor, keyboardSensor] : [pointerSensor, touchSensor, keyboardSensor]));

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setNotes(prev => {
      const oldIndex = prev.findIndex(p => p._id === active.id);
      const newIndex = prev.findIndex(p => p._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      try { localStorage.setItem('notesOrder', JSON.stringify(next.map(n => n._id))); } catch (e) {}
      API.post('/api/notes/reorder', { order: next.map(n => n._id) }).catch(() => {});
      return next;
    });
  }, []);

  const sidebarNotes = useMemo(() => notes.slice().sort((a,b) => getNoteTimestamp(b) - getNoteTimestamp(a)), [notes]);

  // --- UI: extremely thin, thread-like scrollbars (2px) for sidebar and main area; hide scrollbars in modal content/textarea
  return (
    <div className="min-h-screen bg-black text-gray-200 text-xs">
      <style jsx global>{`
  /* ULTRA-THIN "thread" scrollbars */
  .custom-scrollbar::-webkit-scrollbar,
  .main-scroll::-webkit-scrollbar {
    width: 2px;       /* super thin vertical scrollbar */
    height: 2px;      /* super thin horizontal scrollbar */
  }

  .custom-scrollbar::-webkit-scrollbar-track,
  .main-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb,
  .main-scroll::-webkit-scrollbar-thumb {
    background-color: rgba(0,0,0,0.4); /* subtle color */
    border-radius: 9999px;
    min-height: 20px;
    border: 0px solid transparent;
    background-clip: padding-box;
  }

  /* Slightly more visible on hover */
  .custom-scrollbar::-webkit-scrollbar-thumb:hover,
  .main-scroll::-webkit-scrollbar-thumb:hover {
    background-color: rgba(0,0,0,0.6);
  }

  /* Firefox */
  .custom-scrollbar,
  .main-scroll {
    scrollbar-width: thin;
    scrollbar-color: rgba(0,0,0,0.4) transparent;
  }

  /* Hide scrollbars inside the edit modal and its textarea while keeping scrollability if needed (mobile) */
  .note-modal,
  .note-modal textarea {
    scrollbar-width: none; /* firefox */
    -ms-overflow-style: none; /* ie */
  }
  .note-modal textarea::-webkit-scrollbar { display: none; }
  .note-modal::-webkit-scrollbar { display: none; }

  /* Touch devices (mobile) */
  @media (pointer: coarse) {
    .main-scroll {
      touch-action: pan-y;
    }
  }
`}</style>

      <div className="md:flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-72 fixed left-0 top-0 bottom-0 border-r border-gray-800 bg-black overflow-y-auto custom-scrollbar p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-baseline gap-3">
              <div className="uppercase tracking-wide text-gray-500 text-[18px]">ALL NOTES</div>
              <div className="text-[11px] text-gray-500">{notes.length}</div>
            </div>
            <button onClick={() => fetchNotes()} className="text-[12px] px-2 py-1 bg-gray-900 ">Refresh</button>
          </div>

          <nav className="flex-1 overflow-y-auto">
            {notes.length === 0 && <div className="text-[11px] text-gray-500 p-3 text-center">No notes</div>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sidebarNotes.map(n=>n._id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {sidebarNotes.map(n => (
                    <SortableItem key={n._id} id={n._id}>
                      <button onClick={() => openEdit(n)} className="w-full text-left p-3  hover:bg-gray-900 transition-colors flex flex-col gap-1">
                        <div className="font-semibold text-[13px] truncate">{n.title || (n.content ? String(n.content).split('\n')[0].slice(0,40) : 'Untitled')}</div>
                        <div className="text-[11px] text-gray-400 line-clamp-2">{String(n.content || '').slice(0,100)}</div>
                      </button>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </nav>
        </aside>

        {/* Mobile drawer */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40 z-30" onClick={() => setMobileDrawerOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 p-3 bg-black overflow-y-auto border-r border-gray-800 z-40">
              <div className="flex items-center justify-between mb-2"><div className="text-gray-400 uppercase text-[13px]">All Notes</div><button onClick={() => setMobileDrawerOpen(false)} className="text-[11px]">Close</button></div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={sidebarNotes.map(n=>n._id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col gap-2">
                    {sidebarNotes.map(n => (
                      <SortableItem key={n._id} id={n._id}>
                        <button onClick={() => openEdit(n)} className="w-full text-left p-3 rounded-lg hover:bg-gray-900 transition-colors flex flex-col gap-1">
                          <div className="font-semibold text-[13px] truncate">{n.title || (n.content ? String(n.content).split('\n')[0].slice(0,40) : 'Untitled')}</div>
                          <div className="text-[11px] text-gray-400 line-clamp-2">{String(n.content || '').slice(0,100)}</div>
                        </button>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        )}

        {/* Main area */}
        <main className="flex-1 md:ml-72 main-scroll">
          <Header />
          <div className="p-4 max-w-6xl mx-auto">
            <header className="flex items-center justify-between p-2 border-b border-gray-800 bg-black sticky top-0 z-20">
              <div className="flex items-center gap-2"><button aria-label="Open menu" onClick={() => setMobileDrawerOpen(true)} className="md:hidden text-[13px]">☰</button><div className="text-2xl leading-none">Noted</div></div>
              <div className="flex-1 max-w-xs mx-3"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search notes ..." className="w-full px-3 py-2 text-sm bg-transparent border border-gray-700 placeholder-gray-500 focus:outline-none rounded"/></div>
            </header>

            <div className="my-3">
              <div ref={quickRef} className="p-3 border border-gray-800 ">
                <textarea value={quickText} onChange={e=>setQuickText(e.target.value)} placeholder="Quick note — first line becomes title, rest is content." rows={2} className="w-full p-2 text-xs bg-transparent resize-none focus:outline-none" />
                <div className="flex items-center justify-end gap-2 mt-2">
                  <button onClick={()=>setQuickText('')} className="px-2 py-1 text-[11px] rounded panel-transparent">Clear</button>
                  <button onClick={createQuickNote} className="px-3 py-1 text-[12px] bg-gray-800">New</button>
                </div>
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={notes.map(n=>n._id)} strategy={rectSortingStrategy}>
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {loading && <div className="text-[11px] text-gray-400">Loading...</div>}
                  {!loading && filtered.length === 0 && <div className="text-[11px] text-gray-400">No notes found</div>}
                  {filtered.map(note => (
                    <SortableItem id={note._id} key={note._id}>
                      <div className="rounded-lg border border-gray-800 p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-black/60 to-black/40">
                        <div className="text-[13px] font-semibold mb-1 truncate">{note.title || (note.content ? String(note.content).split('\n')[0].slice(0,60) : 'Untitled')}</div>
                        <div className="text-[12px] text-gray-400 mb-2 line-clamp-4">{String(note.content || '').slice(0,180)}</div>
                        <div className="flex items-center justify-between">
                          <div className="text-[11px] text-gray-500">{note.reminder?.at ? new Date(String(note.reminder.at)).toLocaleString() : ''}</div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(note)} className="text-[11px] px-2 py-1 rounded panel-transparent">Edit</button>
                            <button onClick={() => deleteNote(note._id)} className="text-[11px] px-2 py-1 rounded panel-transparent">Del</button>
                          </div>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </section>
              </SortableContext>
            </DndContext>

          </div>
        </main>
      </div>

      {/* EDIT MODAL */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingNote(null)} />
          {/* added class note-modal and overflow visible; textarea auto-resizes; scrollbars hidden via CSS above */}
          <div className="note-modal relative w-full max-w-xl p-3 bg-black border border-gray-800 rounded-lg overflow-visible">
            <input
              value={editingNote.title}
              onChange={e=>setEditingNote(prev=>prev?{...prev,title:e.target.value}:prev)}
              placeholder="Title"
              className="w-full p-2 mb-2 text-sm bg-transparent border-b border-gray-800 focus:outline-none"
            />
            <textarea
              ref={editTextareaRef}
              value={editingNote.content}
              onChange={e=>{
                const v = e.target.value;
                setEditingNote(prev=>prev?{...prev,content:v}:prev);
                // auto-resize as the user types
                const ta = editTextareaRef.current;
                if (ta) {
                  ta.style.height = 'auto';
                  ta.style.height = Math.min(600, ta.scrollHeight + 2) + 'px';
                }
              }}
              rows={4}
              className="w-full p-2 text-sm bg-transparent resize-none focus:outline-none"
            />

            <div className="flex items-center justify-between gap-2 mt-2">
              <div className="flex items-center gap-2">
                <button onClick={() => { setDialogOpen(true); setReminderMessage(''); }} className="px-2 py-1 text-[11px] rounded panel-transparent">Set reminder</button>
                {editingNote?.reminder?.at ? <div className="text-[11px] text-gray-400">Scheduled: {new Date(String(editingNote.reminder.at)).toLocaleString()}</div> : <div className="text-[11px] text-gray-400">No reminder</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setEditingNote(null)} className="px-2 py-1 text-[11px] rounded panel-transparent">Cancel</button>
                <button onClick={saveEdit} disabled={saving} className="px-3 py-1 bg-gray-800 text-[12px] rounded">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <DateTimeDialog isOpen={dialogOpen} initialIso={editingNote?.reminder?.at ?? null} minuteStep={5} onClose={() => setDialogOpen(false)} onConfirm={async (isoUtc) => {
        if (!editingNote) { setReminderMessage('No note selected'); setDialogOpen(false); return; }
        try {
          await API.post(`/api/notes/${editingNote._id}/reminder`, { at: isoUtc });
          setReminderMessage('Reminder scheduled');
          const updatedLocal: NoteType = { ...(editingNote as NoteType), reminder: { at: isoUtc, sent: false } };
          setNotes(prev => prev.map(n => (n._id === updatedLocal._id ? updatedLocal : n)));
          setEditingNote(updatedLocal);
        } catch (err) { console.error('Failed scheduling reminder', err); setReminderMessage('Failed to schedule'); }
        finally { setDialogOpen(false); }
      }} />

      {reminderMessage && <div className="fixed bottom-4 right-4 text-[12px] text-green-400">{reminderMessage}</div>}
    </div>
  );
}
