'use client';

import React, { useEffect, useRef, useState } from 'react';

type Note = {
  _id: string;
  title?: string;
  content?: string;
};

type Props = {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
};

export default function NoteCard({ note, onClick, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && menuOpen) setMenuOpen(false);
    }

    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  // Accessibility: allow Enter / Space to activate the card
  function handleCardKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  }

  function toggleMenu(e?: React.MouseEvent<HTMLButtonElement>) {
    e?.stopPropagation();
    setMenuOpen((s) => !s);
  }

  return (
    <article
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleCardKey}
      aria-label={note.title ? `Open note ${note.title}` : 'Open note'}
      className="relative w-full h-full p-4 bg-transparent text-gray-100 text-sm shadow-sm border border-gray-800 hover:border-gray-600 cursor-pointer flex flex-col min-w-[220px] md:min-w-[260px]"
    >
      {/* header / title */}
      <header className="mb-2">
        <h3 className="text-sm font-semibold truncate" title={note.title}>
          {note.title || 'Untitled'}
        </h3>
      </header>

      {/* content */}
      <div className="flex-1 overflow-hidden">
        <div
          className="text-[13px] text-gray-300 whitespace-pre-wrap break-words"
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 6,
            maxHeight: '9.6rem',
            overflow: 'hidden',
          }}
        >
          {note.content || ''}
        </div>
      </div>

      {/* three-dot button */}
      <div className="absolute right-2 bottom-2">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={(e) => toggleMenu(e)}
          aria-haspopup="true"
          aria-expanded={menuOpen}
          aria-label="Open note menu"
          onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleMenu();
            }
          }}
          className="px-2 py-1 text-xs panel-transparent"
        >
          . . .
        </button>
      </div>

      {/* menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Note actions"
          className="absolute right-0 top-full mt-2 w-36 bg-transparent border border-gray-800 shadow-sm p-1 text-xs z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className="w-full text-center px-3 py-3 text-xs hover:bg-gray-800/20"
          >
            Delete
          </button>
        </div>
      )}
    </article>
  );
}
