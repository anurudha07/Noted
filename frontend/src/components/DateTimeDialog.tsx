'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Props = {
  isOpen: boolean;
  initialIso?: string | null;
  minuteStep?: number;
  onClose: () => void;
  onConfirm: (isoUtc: string) => void;
  title?: string;
};

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function startWeekday(year: number, monthIndex: number) {
  return new Date(year, monthIndex, 1).getDay(); // 0..6 (Sun..Sat)
}

function parseIsoLocal(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    monthIndex: d.getMonth(), // 0..11
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
}

export default function DateTimeDialog({
  isOpen,
  initialIso = null,
  minuteStep = 5,
  onClose,
  onConfirm,
  title = 'Pick date & time',
}: Props) {
  const now = useMemo(() => new Date(), []);
  const initial = useMemo(
    () =>
      parseIsoLocal(initialIso) || {
        year: now.getFullYear(),
        monthIndex: now.getMonth(),
        day: now.getDate(),
        hour: now.getHours(),
        minute: Math.floor(now.getMinutes() / minuteStep) * minuteStep,
      },
    [initialIso, now, minuteStep]
  );

  const [year, setYear] = useState(initial.year);
  const [monthIndex, setMonthIndex] = useState(initial.monthIndex);
  const [day, setDay] = useState(initial.day);
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);

  useEffect(() => {
    if (!isOpen) return;
    const parsed = parseIsoLocal(initialIso);
    if (parsed) {
      setYear(parsed.year);
      setMonthIndex(parsed.monthIndex);
      setDay(parsed.day);
      setHour(parsed.hour);
      setMinute(parsed.minute - (parsed.minute % minuteStep));
    } else {
      setYear(now.getFullYear());
      setMonthIndex(now.getMonth());
      setDay(now.getDate());
      setHour(now.getHours());
      setMinute(Math.floor(now.getMinutes() / minuteStep) * minuteStep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialIso]);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<Element | null>(null);
  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement;
      setTimeout(() => dialogRef.current?.focus(), 10);
    } else {
      (previouslyFocused.current as HTMLElement | null)?.focus?.();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Build weeks array
  const weeks = useMemo(() => {
    const firstWeekday = startWeekday(year, monthIndex);
    const totalDays = daysInMonth(year, monthIndex);
    const out: (number | null)[][] = [];
    const week: (number | null)[] = new Array(7).fill(null);
    let dayCounter = 1;

    for (let i = firstWeekday; i < 7; i++) {
      week[i] = dayCounter++;
    }
    out.push(week);

    while (dayCounter <= totalDays) {
      const w: (number | null)[] = new Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= totalDays; i++) {
        w[i] = dayCounter++;
      }
      out.push(w);
    }
    return out;
  }, [year, monthIndex]);

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function prevMonth() {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear(y => y - 1);
    } else setMonthIndex(m => m - 1);
  }
  function nextMonth() {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear(y => y + 1);
    } else setMonthIndex(m => m + 1);
  }

  function produceIsoUtc() {
    const local = new Date(year, monthIndex, day, hour, minute, 0, 0);
    return local.toISOString();
  }

  const isPast = useMemo(() => {
    const selected = new Date(year, monthIndex, day, hour, minute, 0, 0);
    return selected.getTime() <= Date.now();
  }, [year, monthIndex, day, hour, minute]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className="relative w-full max-w-2xl mx-auto bg-[#0b0b0c] border border-gray-800 rounded-lg shadow-2xl text-gray-100 p-4"
        aria-label={title}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-200 p-1">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button onClick={prevMonth} className="px-2 py-1 rounded panel-transparent">‹</button>
                <div className="text-sm font-medium">{monthLabels[monthIndex]} {year}</div>
                <button onClick={nextMonth} className="px-2 py-1 rounded panel-transparent">›</button>
              </div>
              <div className="text-xs text-gray-400">Local time</div>
            </div>

            <div className="grid grid-cols-7 text-xs text-center gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={`wd-${i}`} className="text-[11px] text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Render each week as a row (each row gets a stable key) */}
            <div className="mt-2 space-y-1">
              {weeks.map((week, wi) => (
                <div key={`week-${year}-${monthIndex}-${wi}`} className="grid grid-cols-7 gap-1">
                  {week.map((d, di) => {
                    const cellKey = d ? `day-${year}-${monthIndex}-${d}` : `empty-${year}-${monthIndex}-${wi}-${di}`;
                    const isSelected = d === day;
                    const today = new Date();
                    const isToday = d === today.getDate() && monthIndex === today.getMonth() && year === today.getFullYear();

                    return (
                      <button
                        key={cellKey}
                        onClick={() => d && setDay(d)}
                        disabled={!d}
                        className={`py-2 rounded-md text-sm focus:outline-none ${d ? 'hover:bg-gray-800' : 'opacity-0'}
                          ${isSelected ? 'bg-gray-700 ring-2 ring-gray-600' : ''}
                          ${isToday && !isSelected ? 'border border-gray-700' : ''}
                        `}
                        aria-pressed={isSelected}
                      >
                        <span className={`${isSelected ? 'font-semibold' : 'text-gray-200'}`}>{d ?? ''}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-1 flex flex-col gap-3">
            <div className="text-xs text-gray-400">Time</div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <label className="text-[11px] text-gray-400 mb-1">Hour</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => setHour(h => (h === 0 ? 23 : h - 1))} className="px-2 py-1 rounded panel-transparent" aria-label="Decrease hour">−</button>
                  <div className="px-3 py-2 bg-gray-900 border border-gray-800 rounded text-sm w-16 text-center">{String(hour).padStart(2, '0')}</div>
                  <button onClick={() => setHour(h => (h === 23 ? 0 : h + 1))} className="px-2 py-1 rounded panel-transparent" aria-label="Increase hour">+</button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex flex-col">
                <label className="text-[11px] text-gray-400 mb-1">Minute</label>
                <div className="flex items-center gap-1">
                  <button onClick={() => setMinute(m => { const next = m - minuteStep; return next < 0 ? 60 - minuteStep : next; })} className="px-2 py-1 rounded panel-transparent" aria-label="Decrease minutes">−</button>
                  <div className="px-3 py-2 bg-gray-900 border border-gray-800 rounded text-sm w-16 text-center">{String(minute).padStart(2, '0')}</div>
                  <button onClick={() => setMinute(m => { const next = m + minuteStep; return next >= 60 ? 0 : next; })} className="px-2 py-1 rounded panel-transparent" aria-label="Increase minutes">+</button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button onClick={() => setMinute(0)} className="px-2 py-1 text-xs rounded panel-transparent">:00</button>
              <button onClick={() => setMinute(15)} className="px-2 py-1 text-xs rounded panel-transparent">:15</button>
              <button onClick={() => setMinute(30)} className="px-2 py-1 text-xs rounded panel-transparent">:30</button>
              <button onClick={() => setMinute(45)} className="px-2 py-1 text-xs rounded panel-transparent">:45</button>
            </div>

            <div className="mt-2 text-[12px] text-gray-400">
              Selected: <span className="font-medium">{`${String(day).padStart(2, '0')} ${monthLabels[monthIndex]} ${year} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-2 rounded text-sm panel-transparent">Cancel</button>
          <button
            onClick={() => onConfirm(produceIsoUtc())}
            disabled={isPast}
            className={`px-4 py-2 rounded text-sm ${isPast ? 'opacity-50 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
