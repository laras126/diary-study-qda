import React, { useMemo, useState } from 'react';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { useStore } from '../store/useStore';
import { Entry } from '../types';

function formatTimestamp(ts: string): string {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return format(d, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return ts;
  }
}

function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr + 'T12:00:00'), 'MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

interface DayGroup {
  date: string;
  am: Entry[];
  pm: Entry[];
}

export function DataCleanView() {
  const { entries, updateEntryDate, setCurrentView } = useStore();
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');

  const days = useMemo<DayGroup[]>(() => {
    const map = new Map<string, DayGroup>();
    for (const e of entries) {
      if (!map.has(e.date)) map.set(e.date, { date: e.date, am: [], pm: [] });
      const g = map.get(e.date)!;
      e.type === 'AM' ? g.am.push(e) : g.pm.push(e);
    }
    return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [entries]);

  const startEdit = (e: Entry) => { setEditId(e.id); setEditDate(e.date); };
  const saveEdit = (id: string) => { if (editDate) updateEntryDate(id, editDate); setEditId(null); };
  const cancelEdit = () => setEditId(null);
  const shiftDay = (e: Entry, delta: number) => {
    const base = parseISO(e.date + 'T12:00:00');
    updateEntryDate(e.id, format(delta > 0 ? addDays(base, delta) : subDays(base, -delta), 'yyyy-MM-dd'));
  };

  if (!entries.length) return (
    <div className="p-8 text-center text-gray-400 text-sm">
      No data loaded.{' '}
      <button onClick={() => setCurrentView('import')} className="text-blue-500 hover:underline">Import first.</button>
    </div>
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Data Cleaning</h2>
        <p className="text-gray-500 text-sm mt-1">
          Entries are grouped by their assigned date. Use the controls to move entries to the correct day.
        </p>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> AM</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> PM</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-300 inline-block" /> Day has gap</span>
        </div>
      </div>

      <div className="space-y-4">
        {days.map((day) => {
          const missing = day.am.length === 0 || day.pm.length === 0;
          const dateLabel = (() => {
            try { return format(parseISO(day.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy'); }
            catch { return day.date; }
          })();

          return (
            <div
              key={day.date}
              className={`rounded-xl border-2 bg-white overflow-hidden ${missing ? 'border-orange-200' : 'border-gray-100'}`}
            >
              {/* Day header */}
              <div className={`flex items-center justify-between px-4 py-2 ${missing ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <span className="font-semibold text-gray-800 text-sm">{dateLabel}</span>
                {missing && (
                  <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                    {day.am.length === 0 && day.pm.length === 0
                      ? 'No entries'
                      : day.am.length === 0 ? 'Missing AM' : 'Missing PM'}
                  </span>
                )}
              </div>

              {/* AM / PM columns */}
              <div className="grid grid-cols-2 divide-x divide-gray-100">
                <EntryColumn
                  label="AM"
                  entries={day.am}
                  editId={editId}
                  editDate={editDate}
                  onEditDateChange={setEditDate}
                  onStartEdit={startEdit}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  onShift={shiftDay}
                />
                <EntryColumn
                  label="PM"
                  entries={day.pm}
                  editId={editId}
                  editDate={editDate}
                  onEditDateChange={setEditDate}
                  onStartEdit={startEdit}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  onShift={shiftDay}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface EntryColumnProps {
  label: 'AM' | 'PM';
  entries: Entry[];
  editId: string | null;
  editDate: string;
  onEditDateChange: (v: string) => void;
  onStartEdit: (e: Entry) => void;
  onSave: (id: string) => void;
  onCancel: () => void;
  onShift: (e: Entry, delta: number) => void;
}

function EntryColumn({ label, entries, editId, editDate, onEditDateChange, onStartEdit, onSave, onCancel, onShift }: EntryColumnProps) {
  const badgeCls = label === 'AM'
    ? 'bg-amber-100 text-amber-700'
    : 'bg-indigo-100 text-indigo-700';

  if (entries.length === 0) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[80px]">
        <span className="text-xs text-gray-300 italic">No {label} entry</span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {entries.map((entry) => (
        <div key={entry.id}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded ${badgeCls}`}>{label}</span>
          </div>

          <p className="text-sm text-gray-700 leading-relaxed mb-1.5">{entry.text}</p>

          <p className="text-xs text-gray-400 mb-2">
            Submitted {formatTimestamp(entry.completionTime)}
          </p>

          {entry.dateModified && (
            <div className="text-xs bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1.5 mb-2">
              <span className="text-blue-500 font-medium">↕ Date moved</span>
              <div className="text-blue-700 mt-0.5">
                {formatShortDate(entry.originalDate)}{' '}
                <span className="text-blue-400">→</span>{' '}
                <span className="font-medium">{formatShortDate(entry.date)}</span>
              </div>
            </div>
          )}

          {editId === entry.id ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="date"
                value={editDate}
                onChange={(e) => onEditDateChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => onSave(entry.id)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
              <button
                onClick={onCancel}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => onShift(entry, -1)}
                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                title="Move to previous day"
              >
                ← prev day
              </button>
              <button
                onClick={() => onStartEdit(entry)}
                className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
              >
                Set date
              </button>
              <button
                onClick={() => onShift(entry, 1)}
                className="text-xs text-gray-400 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                title="Move to next day"
              >
                next day →
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
