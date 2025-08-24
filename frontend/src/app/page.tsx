'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '../components/Header';
import NoteCard from '../components/NoteCard';
import API from '../lib/api';
import { useRouter } from 'next/navigation';

type Note = {
  _id: string;
  title: string;
  content: string;
};

export default function HomePage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [quickText, setQuickText] = useState(''); // single box for title+content
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const router = useRouter();

  // --- NEW: refs for outside-click handling (no styling changes) ---
  const quickRef = useRef<HTMLDivElement | null>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/login');
      return;
    }
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- NEW: outside click -> auto-create quick note ---
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      const target = e.target as Node;
      if (!quickRef.current) return;
      // if clicked inside quick add, do nothing
      if (quickRef.current.contains(target)) return;
      // clicked outside; if quickText has content, create note
      if (quickText.trim() && !creatingRef.current) {
        creatingRef.current = true;
        // call createQuickNote and unset the flag when done
        createQuickNote().finally(() => {
          creatingRef.current = false;
        });
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [quickText]); // keep dependency so latest quickText is used

  async function fetchNotes() {
    setLoading(true);
    try {
      const res = await API.get('/api/notes');
      setNotes(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // parse quickText: first non-empty line => title, rest => content
  function parseQuickText(text: string) {
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
  }

  async function createQuickNote() {
    if (!quickText.trim()) return;
    const { title, content } = parseQuickText(quickText);
    try {
      const res = await API.post('/api/notes', { title, content });
      setNotes(prev => [res.data, ...prev]);
      setQuickText('');
      setEditingNote(res.data);
    } catch (err) {
      console.error(err);
    }
  }

  const filtered = notes.filter(n => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
  });

  function openEdit(note: Note) {
    setEditingNote({ ...note });
    setMobileDrawerOpen(false);
  }

  async function saveEdit() {
    if (!editingNote) return;
    try {
      const res = await API.put(`/api/notes/${editingNote._id}`, {
        title: editingNote.title,
        content: editingNote.content,
      });
      setNotes(prev => prev.map(n => (n._id === res.data._id ? res.data : n)));
      setEditingNote(null);
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteNote(id: string) {
    try {
      await API.delete(`/api/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
      if (editingNote && editingNote._id === id) setEditingNote(null);
    } catch (err) {
      console.error(err);
    }
  }

  // Sidebar content reused for desktop and mobile (keeps same markup & classes)
  function SidebarContent() {
    return (
      <>
        <div className="p-4 border-b border-gray-800">
          <div className="text-gray-400 text-xl uppercase tracking-wide mb-2">All Notes</div>
          <button
            onClick={fetchNotes}
            className="w-full  py-4 text-xs bg-gray-800 hover:bg-gray-700  text-gray-200"
          >
            Refresh
          </button>
        </div>

        {/* Notes list */}
        <nav className="flex-1 p-2 overflow-y-auto">
          {notes.length === 0 && (
            <div className="text-xs text-gray-500 p-4 text-center">No notes</div>
          )}

          <div className="flex flex-col gap-2">
            {notes.map(n => (
              <button
                key={n._id}
                onClick={() => openEdit(n)}
                className="flex flex-col items-start gap-2 w-full text-left px-3 py-3  hover:black transition border border-transparent hover:border-gray-700"
                title={n.title || (n.content ? n.content.slice(0, 120) : '')}
              >
                <div className="font-semibold text-sm truncate w-full">
                  {n.title || (n.content ? n.content.split('\n')[0].slice(0, 40) : 'Untitled')}
                </div>
                <div className="text-[11px] text-gray-400 line-clamp-2 w-full">
                  {(n.content || '').slice(0, 80)}
                </div>
              </button>
            ))}
          </div>
        </nav>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Desktop-only scrollbar styling: dark grey thumbs, thin width. Mobile unaffected. */}
      <style jsx global>{`
        @media (min-width: 768px) {
          /* Sidebar scrollbars (applies to elements given the .custom-scrollbar class) */
          .custom-scrollbar::-webkit-scrollbar { width: 10px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #2f2f2f; border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          .custom-scrollbar { scrollbar-width: thin; scrollbar-color: #2f2f2f transparent; }

          /* Main page (body) scrollbar for desktop */
          body::-webkit-scrollbar { width: 12px; }
          body::-webkit-scrollbar-track { background: transparent; }
          body::-webkit-scrollbar-thumb { background-color: #2f2f2f; border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
          body { scrollbar-width: thin; scrollbar-color: #2f2f2f transparent; }
        }
      `}</style>

      <div className="md:flex">
        {/* Left Sidebar for md+ (shows all notes properly) */}
        <aside className="hidden md:flex flex-col w-72 fixed left-0 top-0 bottom-0 border-r border-gray-800 bg-black overflow-y-auto custom-scrollbar">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        {mobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            {/* overlay — dim + blur */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileDrawerOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-80 p-4 bg-black overflow-y-auto border-r border-gray-800">
              {/* close button at top */}
              <div className="flex items-center justify-end mb-4">
                <button onClick={() => setMobileDrawerOpen(false)} className="px-2 py-1 text-xs rounded-sm panel-transparent">Close</button>
              </div>

              {/* Reuse exact same sidebar content as desktop */}
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 md:ml-72">
          <Header />

          <div className="p-4 max-w-7xl mx-auto">
            {/* top header + search */}
            <header className="flex items-center justify-between p-2 border-b border-gray-800 bg-black sticky top-0 z-20">
              <div className="flex items-center gap-2">
                {/* Mobile menu button */}
                <button
                  aria-label="Open menu"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="md:hidden px-2 py-1 text-xs rounded-sm panel-transparent"
                >
                  ☰
                </button>
                <div className="text-4xl ">Noted</div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-xs mx-4">
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="|    S E A R C H  ..."
                  className="w-full px-8 py-10 text-xl bg-transparent border border-gray-700  placeholder-gray-400 focus:outline-none focus:border-gray-500"
                />
              </div>
            </header>

            {/* Combined Quick Add - single textarea: first line = title, rest = content */}
            <div className="mb-6">
              <div ref={quickRef} className="p-3 panel-transparent border border-gray-800">
                <textarea
                  value={quickText}
                  onChange={e => setQuickText(e.target.value)}
                  placeholder="Quick note — first line becomes title, rest is content"
                  rows={3}
                  className="w-full p-2 text-xs bg-transparent resize-none focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2 mt-8">
                  <button onClick={() => setQuickText('')} className="px-3 py-1 text-xs rounded-sm panel-transparent">Clear</button>
                  <button onClick={createQuickNote} className="px-6 py-6 text-xs rounded-none bg-gray-800 text-white ">New Note</button>
                </div>
              </div>
            </div>

            {/* Notes grid */}
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

      {/* Edit modal — overlay dims AND blurs the background */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingNote(null)}
          />
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

            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => setEditingNote(null)} className="px-3 py-1 text-xs rounded-sm panel-transparent">Cancel</button>
              <button onClick={saveEdit} className="w-18 h-15 flex items-center justify-center bg-gray-800 text-white text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
