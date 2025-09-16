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

type Reminder = { at?: string; sent?: boolean; jobId?: string };

type NoteType = { _id: string; title?: string; content?: string; reminder?: Reminder; [k: string]: unknown };

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
    // allow vertical pan (scroll) by default; only block touch-action while actively dragging
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
  const [notes, setNotes] = useState<NoteType[]>([]);
  const [query, setQuery] = useState('');
  const [editingNote, setEditingNote] = useState<NoteType | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickText, setQuickText] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [reminderMessage, setReminderMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const router = useRouter();
  const quickRef = useRef<HTMLDivElement | null>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    // detect touch devices (pointer: coarse) after mount to avoid SSR mismatch
    if (typeof window !== 'undefined' && window.matchMedia) {
      try {
        setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches);
      } catch (e) {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
      }
    }
  }, []);

  useEffect(() => { if (!reminderMessage) return; const t = setTimeout(() => setReminderMessage(''), 10000); return () => clearTimeout(t); }, [reminderMessage]);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res: AxiosResponse<NoteType[]> = await API.get('/api/notes');
      let sorted = (res.data || []).slice().sort((a, b) => getNoteTimestamp(b) - getNoteTimestamp(a));
      // apply locally persisted order (fallback) so client keeps order across reloads
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('notesOrder') : null;
        if (stored) {
          const order: string[] = JSON.parse(stored);
          const map = new Map(sorted.map(n => [n._id, n]));
          const reordered: NoteType[] = [];
          for (const id of order) {
            const it = map.get(id);
            if (it) { reordered.push(it); map.delete(id); }
          }
          for (const v of map.values()) reordered.push(v);
          sorted = reordered;
        }
      } catch (e) { /* ignore localStorage parse errors */ }
      setNotes(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const parseQuickText = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).map(l => l.trim());
    let title = '', content = '';
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] !== '') { title = lines[i]; content = lines.slice(i+1).join('\n'); break; }
    }
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

  const saveEdit = useCallback(async () => {
    if (!editingNote) return;
    try {
      const res = await API.put<NoteType>(`/api/notes/${editingNote._id}`, {
        title: editingNote.title,
        content: editingNote.content,
      });
      // update the note in-place (keep main area order unchanged)
      setNotes(prev => prev.map(n => (n._id === res.data._id ? res.data : n)));
      setEditingNote(null);
    } catch (err) {
      console.error(err);
    }
  }, [editingNote]);

  const deleteNote = async (id: string) => {
  const prev =  [...notes];
  // optimistic UI
  setNotes(prevNotes => prevNotes.filter(n => n._id !== id));
  try {
    const res = await API.post(`/api/notes/${id}/trash`);
    if (!res || (res.status && res.status >= 400)) {
      throw new Error('Server error deleting note');
    }
  } catch (err) {
    console.error('Failed to move note to trash', err);
    // rollback
    setNotes(prev);
    // optionally notify user of failure
  }
};






  // dnd-kit sensors setup (we create sensor descriptors unconditionally,
  // but we pass only the appropriate sensors into useSensors based on runtime touch detection)
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 6 } });

  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } });

  const keyboardSensor = useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates });

  // Choose which sensors to activate depending on device type.
  // On touch devices: remove PointerSensor (to avoid accidental drag on scroll) and require long-press TouchSensor.
  // On non-touch devices: include PointerSensor for immediate dragging.
  const sensors = useSensors(
    ...(isTouchDevice ? [touchSensor, keyboardSensor] : [pointerSensor, touchSensor, keyboardSensor])
  );

  const onDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setNotes(prev => {
      const oldIndex = prev.findIndex(p => p._id === active.id);
      const newIndex = prev.findIndex(p => p._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const next = arrayMove(prev, oldIndex, newIndex);
      // persist order to server and local fallback so reload keeps placement
      try { localStorage.setItem('notesOrder', JSON.stringify(next.map(n => n._id))); } catch (e) {}
      API.post('/api/notes/reorder', { order: next.map(n => n._id) }).catch(() => {});
      return next;
    });
  }, []);

  // sidebar list sorted by timestamp (used for both desktop and mobile views)
  const sidebarNotes = useMemo(() => notes.slice().sort((a,b) => getNoteTimestamp(b) - getNoteTimestamp(a)), [notes]);

  return (
    <div className="min-h-screen bg-black text-gray-200">
      <style jsx global>{`
@media (min-width: 768px){
  /* narrow, darker scrollbar for desktop */
  .custom-scrollbar::-webkit-scrollbar{width:6px}
  .custom-scrollbar::-webkit-scrollbar-track{background:transparent}
  .custom-scrollbar::-webkit-scrollbar-thumb{background-color:#0f0f10;border-radius:9999px;border:2px solid transparent;background-clip:padding-box}

  /* main area scrollbar (applies to the main container when you add .main-scroll) */
  .main-scroll::-webkit-scrollbar{width:6px}
  .main-scroll::-webkit-scrollbar-track{background:transparent}
  .main-scroll::-webkit-scrollbar-thumb{background-color:#0f0f10;border-radius:9999px;border:2px solid transparent;background-clip:padding-box}

  /* body fallback */
  body::-webkit-scrollbar{width:6px}
  body::-webkit-scrollbar-track{background:transparent}
  body::-webkit-scrollbar-thumb{background-color:#0f0f10;border-radius:9999px;border:2px solid transparent;background-clip:padding-box}

  /* Firefox */
  .custom-scrollbar{scrollbar-width:thin;scrollbar-color:#0f0f10 transparent}
  .main-scroll{scrollbar-width:thin;scrollbar-color:#0f0f10 transparent}
  body{scrollbar-width:thin;scrollbar-color:#0f0f10 transparent}
}

/* mobile / touch devices: prefer natural vertical pan-y scrolling unless actively dragging */
@media (pointer: coarse) {
  .main-scroll, .custom-scrollbar, .panel-transparent {
    touch-action: pan-y;
    -ms-touch-action: pan-y;
  }
}
      `}</style>
      <style jsx>{`.note-card-wrapper{min-height:56px}`}</style>
      <div className="md:flex">
        <aside className="hidden md:flex flex-col w-72 fixed left-0 top-0 bottom-0 border-r border-gray-800 bg-black overflow-y-auto custom-scrollbar">
          <div className="p-4 border-b border-gray-800">
            <div className="text-gray-400 text-xl uppercase tracking-wide mb-2">All Notes</div>
            <button onClick={() => fetchNotes()} className="w-full py-4 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200">Refresh</button>
          </div>
          <nav className="flex-1 p-2 overflow-y-auto">
            {notes.length === 0 && <div className="text-xs text-gray-500 p-4 text-center">No notes</div>}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={sidebarNotes.map(n=>n._id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2">
                  {sidebarNotes.map(n => (
                    <SortableItem key={n._id} id={n._id}>
                      <button onClick={() => openEdit(n)} className="flex flex-col items-start gap-2 w-full text-left px-3 py-3 transition border border-transparent hover:border-gray-700" title={String(n.title || (n.content ? String(n.content).slice(0,120) : ''))}>
                        <div className="font-semibold text-sm truncate w-full">{n.title || (n.content ? String(n.content).split('\n')[0].slice(0,40) : 'Untitled')}</div>
                        <div className="text-[11px] text-gray-400 line-clamp-2 w-full">{String(n.content || '').slice(0,80)}</div>
                      </button>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </nav>
        </aside>

        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/40 z-30" onClick={() => setMobileDrawerOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-80 p-4 bg-black overflow-y-auto border-r border-gray-800 z-40">
              <div className="flex items-center justify-end mb-4"><button onClick={() => setMobileDrawerOpen(false)} className="px-2 py-1 text-xs rounded-sm panel-transparent">Close</button></div>
              <div className="p-4 border-b border-gray-800"><div className="text-gray-400 text-xl uppercase tracking-wide mb-2">All Notes</div><button onClick={() => fetchNotes()} className="w-full py-4 text-xs bg-gray-800 hover:bg-gray-700 text-gray-200">Refresh</button></div>
              <nav className="mt-3">
                {notes.length === 0 && <div className="text-xs text-gray-500 p-4 text-center">No notes</div>}
                {/* use the same sorted sidebarNotes here so mobile shows most-recent-first */}
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                  <SortableContext items={sidebarNotes.map(n=>n._id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                      {sidebarNotes.map(n => (
                        <SortableItem key={n._id} id={n._id}>
                          <button onClick={() => openEdit(n)} className="flex flex-col items-start gap-2 w-full text-left px-3 py-3 transition border border-transparent hover:border-gray-700" title={String(n.title || (n.content ? String(n.content).slice(0,120) : ''))}>
                            <div className="font-semibold text-sm truncate w-full">{n.title || (n.content ? String(n.content).split('\n')[0].slice(0,40) : 'Untitled')}</div>
                            <div className="text-[11px] text-gray-400 line-clamp-2 w-full">{String(n.content || '').slice(0,80)}</div>
                          </button>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1 md:ml-72 main-scroll">
          <Header />
          <div className="p-4 max-w-7xl mx-auto">
            <header className="flex items-center justify-between p-2 border-b border-gray-800 bg-black sticky top-0 z-20">
              <div className="flex items-center gap-2"><button aria-label="Open menu" onClick={() => setMobileDrawerOpen(true)} className="md:hidden px-2 py-1 text-xs rounded-sm panel-transparent">☰</button><div className="text-3xl">Noted</div></div>
              <div className="flex-1 max-w-xs mx-4"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="|    S E A R C H  ..." className="w-full px-8 py-10 text-l bg-transparent border border-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-500"/></div>
            </header>

            <div className="mb-6">
              <div ref={quickRef} className="p-3 panel-transparent border border-gray-800">
                <textarea value={quickText} onChange={e=>setQuickText(e.target.value)} placeholder="Quick note — first line becomes title, rest is content" rows={3} className="w-full p-2 text-xs bg-transparent resize-none focus:outline-none" />
                <div className="flex items-center justify-end gap-2 mt-8"><button onClick={()=>setQuickText('')} className="px-3 py-1 text-xs rounded-sm panel-transparent">Clear</button><button onClick={createQuickNote} className="px-6 py-6 text-xs rounded-none bg-gray-800 text-white">New Note</button></div>
              </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={notes.map(n=>n._id)} strategy={rectSortingStrategy}>
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {loading && <div className="text-xs text-gray-400">Loading...</div>}
                  {!loading && filtered.length === 0 && <div className="text-xs text-gray-400">No notes found</div>}
                  {filtered.map(note => (
  <SortableItem id={note._id} key={note._id}>
    <NoteCard
      note={note}
      onClick={() => openEdit(note)}
      onDelete={() => deleteNote(note._id)}
    />
  </SortableItem>



                  ))}
                </section>
              </SortableContext>
            </DndContext>

          </div>
        </main>
      </div>

      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingNote(null)} />
          <div className="relative w-full max-w-2xl p-4 bg-transparent border border-gray-800 rounded">
            <input value={editingNote.title} onChange={e=>setEditingNote(prev=>prev?{...prev,title:e.target.value}:prev)} placeholder="Title" className="w-full p-2 mb-2 text-sm bg-transparent border-b border-gray-800 focus:outline-none" />
            <textarea value={editingNote.content} onChange={e=>setEditingNote(prev=>prev?{...prev,content:e.target.value}:prev)} rows={10} className="w-full p-2 text-sm bg-transparent resize-none focus:outline-none" />

            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="flex items-center gap-2">
                <button onClick={() => { setDialogOpen(true); setReminderMessage(''); }} className="px-3 py-1 text-xs rounded-sm panel-transparent">Set reminder</button>
                {editingNote?.reminder?.at ? <div className="text-xs text-gray-400">Scheduled: {new Date(String(editingNote.reminder.at)).toLocaleString()} • Sent: {editingNote.reminder.sent ? 'Yes' : 'No'}</div> : <div className="text-xs text-gray-400">No reminder</div>}
              </div>
              <div className="flex items-center gap-2"><button onClick={() => setEditingNote(null)} className="px-3 py-1 text-xs rounded-sm panel-transparent">Cancel</button><button onClick={saveEdit} className="w-18 h-15 flex items-center justify-center bg-gray-800 text-white text-sm">Save</button></div>
            </div>
            {editingNote.reminder?.at && <div className="text-xs text-gray-400 mt-2">Scheduled at: {new Date(String(editingNote.reminder.at)).toLocaleString()} • Sent: {editingNote.reminder.sent ? 'Yes' : 'No'}</div>}
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

      {reminderMessage && <div className="fixed bottom-6 right-6 text-xs text-green-400">{reminderMessage}</div>}
    </div>
  );
}
