import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';

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
import { useStore } from '../store/useStore';
import { Snippet, Tag } from '../types';
import { buildSegments, getTextOffset } from '../utils/highlights';

export function CodingView() {
  const { entries, tags, snippets, selectedEntryId, setSelectedEntry, addSnippet, deleteSnippet, updateSnippetNote } =
    useStore();

  const [pending, setPending] = useState<{ start: number; end: number; text: string } | null>(null);
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [focusedSnippetId, setFocusedSnippetId] = useState<string | null>(null);
  const [overlapPickerPos, setOverlapPickerPos] = useState<{ x: number; y: number } | null>(null);
  const [overlapSnippetIds, setOverlapSnippetIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const textRef = useRef<HTMLDivElement>(null);
  const selectedEntry = entries.find((e) => e.id === selectedEntryId);

  const dayGroups = useMemo(() => {
    const map = new Map<string, typeof entries>();
    for (const e of entries) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, es]) => ({ date, entries: es.sort((a, b) => a.type.localeCompare(b.type)) }));
  }, [entries]);

  const entrySnippets = useMemo(
    () => (selectedEntry ? snippets.filter((s) => s.entryId === selectedEntry.id) : []),
    [snippets, selectedEntry]
  );

  // Search filtering
  const q = searchQuery.trim().toLowerCase();
  const filteredDayGroups = useMemo(() => {
    if (!q) return dayGroups;
    return dayGroups
      .map((g) => ({ ...g, entries: g.entries.filter((e) => e.text.toLowerCase().includes(q)) }))
      .filter((g) => g.entries.length > 0);
  }, [dayGroups, q]);

  const countMatches = (text: string) => {
    if (!q) return 0;
    let count = 0;
    let idx = text.toLowerCase().indexOf(q);
    while (idx !== -1) { count++; idx = text.toLowerCase().indexOf(q, idx + 1); }
    return count;
  };

  // Flat ordered list matching the sidebar order (date asc, AM before PM)
  const flatEntries = useMemo(
    () => dayGroups.flatMap(({ entries: es }) => es),
    [dayGroups]
  );
  const currentIdx = flatEntries.findIndex((e) => e.id === selectedEntryId);
  const prevEntry = currentIdx > 0 ? flatEntries[currentIdx - 1] : null;
  const nextEntry = currentIdx < flatEntries.length - 1 ? flatEntries[currentIdx + 1] : null;

  const navigateTo = (id: string) => {
    setSelectedEntry(id);
    setFocusedSnippetId(null);
    setOverlapSnippetIds([]);
    setOverlapPickerPos(null);
  };

  // Backspace deletes the focused snippet when not typing in an input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Backspace' && e.key !== 'Delete') return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (!focusedSnippetId) return;
      e.preventDefault();
      deleteSnippet(focusedSnippetId);
      setFocusedSnippetId(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusedSnippetId, deleteSnippet]);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!textRef.current) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      if (
        !textRef.current.contains(range.startContainer) ||
        !textRef.current.contains(range.endContainer)
      )
        return;

      const rawStart = getTextOffset(textRef.current, range.startContainer, range.startOffset);
      const rawEnd = getTextOffset(textRef.current, range.endContainer, range.endOffset);
      const start = Math.min(rawStart, rawEnd);
      const end = Math.max(rawStart, rawEnd);
      const text = sel.toString().trim();
      if (!text || start === end) return;

      setPending({ start, end, text });
      setPickerPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const applyTag = useCallback(
    (tagId: string) => {
      if (!pending || !selectedEntry) return;

      addSnippet({
        entryId: selectedEntry.id,
        startOffset: pending.start,
        endOffset: pending.end,
        text: pending.text,
        tagIds: [tagId],
      });
      dismiss();
    },
    [pending, selectedEntry, entrySnippets, addSnippet]
  );

  const dismiss = () => {
    setPending(null);
    setPickerPos(null);
    window.getSelection()?.removeAllRanges();
  };

  if (!entries.length)
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">
        No entries loaded.
      </div>
    );

  return (
    <div className="h-full flex overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-60 shrink-0 border-r border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
        {/* Search */}
        <div className="px-3 py-2 border-b border-gray-200 bg-white space-y-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Entries</span>
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search entries…"
              className="w-full text-xs border border-gray-200 rounded-lg pl-7 pr-7 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            )}
          </div>
          {q && (
            <p className="text-xs text-gray-400">
              {filteredDayGroups.reduce((n, g) => n + g.entries.length, 0)} matching entries
            </p>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {filteredDayGroups.length === 0 && q && (
            <p className="text-xs text-gray-400 text-center py-8">No entries match "{searchQuery}"</p>
          )}
          {filteredDayGroups.map(({ date, entries: dayEs }) => (
            <div key={date} className="border-b border-gray-100 last:border-0">
              <div className="px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 sticky top-0">
                {(() => { try { return format(parseISO(date + 'T12:00:00'), 'EEE, MMM d'); } catch { return date; } })()}
              </div>
              {dayEs.map((entry) => {
                const sc = snippets.filter((s) => s.entryId === entry.id).length;
                const active = entry.id === selectedEntryId;
                const matchCount = countMatches(entry.text);
                return (
                  <button
                    key={entry.id}
                    onClick={() => { setSelectedEntry(entry.id); setFocusedSnippetId(null); }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 transition-colors hover:bg-white ${active ? 'bg-white shadow-sm border-l-2 border-blue-500' : ''}`}
                  >
                    <span className={`shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${entry.type === 'AM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {entry.type}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-600 truncate leading-snug">{entry.text.slice(0, 60)}{entry.text.length > 60 ? '…' : ''}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {sc > 0 && <span className="text-xs text-blue-400">{sc} snippet{sc !== 1 ? 's' : ''}</span>}
                        {matchCount > 0 && <span className="text-xs text-amber-600 font-medium">{matchCount} match{matchCount !== 1 ? 'es' : ''}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main panel ── */}
      {selectedEntry ? (
        <div className="flex-1 overflow-y-auto p-6 min-w-0">
          {/* Entry meta */}
          <div className="flex items-start justify-between gap-3 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-bold px-2 py-0.5 rounded ${selectedEntry.type === 'AM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {selectedEntry.type}
              </span>
              <span className="text-gray-700 font-medium text-sm">
                {(() => { try { return format(parseISO(selectedEntry.date + 'T12:00:00'), 'EEEE, MMMM d, yyyy'); } catch { return selectedEntry.date; } })()}
              </span>
            </div>

            {/* Prev / Next navigation */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => prevEntry && navigateTo(prevEntry.id)}
                disabled={!prevEntry}
                title={prevEntry ? `Previous: ${prevEntry.type} · ${prevEntry.date}` : 'No previous entry'}
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ‹
              </button>
              <span className="text-xs text-gray-400 tabular-nums px-1 select-none">
                {currentIdx + 1} / {flatEntries.length}
              </span>
              <button
                onClick={() => nextEntry && navigateTo(nextEntry.id)}
                disabled={!nextEntry}
                title={nextEntry ? `Next: ${nextEntry.type} · ${nextEntry.date}` : 'No next entry'}
                className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ›
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <span className="text-xs text-gray-400">
              Submitted {formatTimestamp(selectedEntry.completionTime)}
            </span>
            {selectedEntry.dateModified && (
              <span className="text-xs bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
                <span className="text-blue-500 font-medium">↕ Date moved: </span>
                <span className="text-blue-700">{formatShortDate(selectedEntry.originalDate)}</span>
                <span className="text-blue-400"> → </span>
                <span className="text-blue-700 font-medium">{formatShortDate(selectedEntry.date)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs text-gray-400">
              Select text to apply a tag.{tags.length === 0 ? ' Create tags in the Tags tab first.' : ''}
            </p>
            {q && countMatches(selectedEntry.text) > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                {countMatches(selectedEntry.text)} match{countMatches(selectedEntry.text) !== 1 ? 'es' : ''}
              </span>
            )}
          </div>

          {/* Text with highlights */}
          <div
            ref={textRef}
            onMouseUp={handleMouseUp}
            className="text-[15px] leading-relaxed text-gray-800 select-text cursor-text bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <HighlightedText
              text={selectedEntry.text}
              snippets={entrySnippets}
              tags={tags}
              focusedId={focusedSnippetId}
              searchQuery={q}
              onSegmentClick={(ids, pos) => {
                if (ids.length === 1) {
                  setFocusedSnippetId((prev) => (prev === ids[0] ? null : ids[0]));
                  setOverlapSnippetIds([]);
                  setOverlapPickerPos(null);
                } else {
                  setOverlapSnippetIds(ids);
                  setOverlapPickerPos(pos);
                  setFocusedSnippetId(null);
                }
              }}
            />
          </div>

          {/* Snippet list */}
          {entrySnippets.length > 0 && (
            <div className="mt-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Snippets in this entry
              </h4>
              <div className="space-y-2">
                {entrySnippets
                  .sort((a, b) => a.startOffset - b.startOffset)
                  .map((s) => {
                    const sTags = tags.filter((t) => s.tagIds.includes(t.id));
                    const focused = focusedSnippetId === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setFocusedSnippetId(focused ? null : s.id)}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer ${focused ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <div className="flex items-start gap-2">
                          <p className="text-sm text-gray-700 italic flex-1">"{s.text}"</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSnippet(s.id); if (focusedSnippetId === s.id) setFocusedSnippetId(null); }}
                            className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0"
                            title="Delete snippet"
                          >×</button>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {sTags.map((t) => (
                            <span key={t.id} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: t.color }}>
                              {t.name}
                            </span>
                          ))}
                        </div>
                        {/* Annotation */}
                        <div className="mt-2 pt-2 border-t border-gray-200/60" onClick={(e) => e.stopPropagation()}>
                          <textarea
                            value={s.note}
                            onChange={(e) => updateSnippetNote(s.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Add a note..."
                            rows={1}
                            className="w-full text-xs text-gray-600 bg-transparent resize-none focus:outline-none placeholder:text-gray-300 leading-relaxed"
                            style={{ minHeight: '1.25rem', height: s.note ? 'auto' : '1.25rem' }}
                            onInput={(e) => {
                              const t = e.currentTarget;
                              t.style.height = 'auto';
                              t.style.height = t.scrollHeight + 'px';
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Select an entry to begin coding
        </div>
      )}

      {/* Tag picker */}
      {pickerPos && pending && (
        <TagPicker
          tags={tags}
          pos={pickerPos}
          selectedText={pending.text}
          onSelect={applyTag}
          onCancel={dismiss}
        />
      )}

      {/* Overlap picker — shown when clicking a region with multiple snippets */}
      {overlapPickerPos && overlapSnippetIds.length > 1 && (
        <SnippetOverlapPicker
          snippetIds={overlapSnippetIds}
          snippets={entrySnippets}
          tags={tags}
          pos={overlapPickerPos}
          onFocus={(id) => setFocusedSnippetId(id)}
          onDelete={(id) => { deleteSnippet(id); if (focusedSnippetId === id) setFocusedSnippetId(null); }}
          onCancel={() => { setOverlapPickerPos(null); setOverlapSnippetIds([]); }}
        />
      )}
    </div>
  );
}

/* ── Search term highlighter within a text string ── */
function highlightSearch(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const q = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let pos = 0;
  let idx = text.toLowerCase().indexOf(q);
  while (idx !== -1) {
    if (idx > pos) parts.push(text.slice(pos, idx));
    parts.push(
      <span key={idx} style={{ backgroundColor: '#fde68a', borderRadius: '2px' }}>
        {text.slice(idx, idx + q.length)}
      </span>
    );
    pos = idx + q.length;
    idx = text.toLowerCase().indexOf(q, pos);
  }
  if (pos < text.length) parts.push(text.slice(pos));
  return parts.length === 0 ? text : <>{parts}</>;
}

/* ── HighlightedText ── */
interface HighlightedTextProps {
  text: string;
  snippets: Snippet[];
  tags: Tag[];
  focusedId: string | null;
  searchQuery?: string;
  onSegmentClick: (ids: string[], pos: { x: number; y: number }) => void;
}

function markStyle(colors: string[], focused: boolean): React.CSSProperties {
  if (!colors.length) return {};
  const n = colors.length;
  // Striped gradient underline — each tag gets an equal-width band
  const stops = colors.flatMap((c, i) => [
    `${c} ${(i / n) * 100}%`,
    `${c} ${((i + 1) / n) * 100}%`,
  ]).join(', ');
  const underlineH = n === 1 ? 2 : n * 2;
  return {
    backgroundColor: colors[0] + '22',
    backgroundImage: `linear-gradient(to right, ${stops})`,
    backgroundSize: `100% ${underlineH}px`,
    backgroundPosition: '0 100%',
    backgroundRepeat: 'no-repeat',
    paddingBottom: `${underlineH + 2}px`,
    cursor: 'pointer',
    outline: focused ? `2px solid ${colors[0]}` : 'none',
    outlineOffset: '1px',
  };
}

function HighlightedText({ text, snippets, tags, focusedId, searchQuery = '', onSegmentClick }: HighlightedTextProps) {
  const segments = buildSegments(text, snippets);
  return (
    <>
      {segments.map((seg, i) => {
        if (!seg.snippets.length) return <span key={i}>{highlightSearch(seg.text, searchQuery)}</span>;

        // Collect one color per snippet (primary tag of each)
        const colors = seg.snippets.map((s) => {
          const t = tags.find((t) => s.tagIds.includes(t.id));
          return t?.color ?? '#fbbf24';
        });
        const focused = seg.snippets.some((s) => s.id === focusedId);
        const label = seg.snippets
          .map((s) => tags.find((t) => s.tagIds.includes(t.id))?.name)
          .filter(Boolean)
          .join(', ');

        return (
          <mark
            key={i}
            onClick={(e) => onSegmentClick(seg.snippets.map((s) => s.id), { x: e.clientX, y: e.clientY })}
            title={label}
            className="highlight-mark rounded-sm"
            style={markStyle(colors, focused)}
          >
            {highlightSearch(seg.text, searchQuery)}
          </mark>
        );
      })}
    </>
  );
}

/* ── SnippetOverlapPicker ── shown when clicking a region covered by 2+ snippets */
interface SnippetOverlapPickerProps {
  snippetIds: string[];
  snippets: Snippet[];
  tags: Tag[];
  pos: { x: number; y: number };
  onFocus: (id: string) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

function SnippetOverlapPicker({ snippetIds, snippets, tags, pos, onFocus, onDelete, onCancel }: SnippetOverlapPickerProps) {
  const overlapping = snippets.filter((s) => snippetIds.includes(s.id));
  const left = Math.min(pos.x, window.innerWidth - 256);
  const top = Math.min(pos.y + 8, window.innerHeight - 320);

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 998 }} onMouseDown={onCancel} />
      <div
        className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-64"
        style={{ left, top, zIndex: 999 }}
      >
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          {overlapping.length} overlapping snippets
        </p>
        <div className="space-y-1">
          {overlapping.map((s) => {
            const sTags = tags.filter((t) => s.tagIds.includes(t.id));
            const primaryColor = sTags[0]?.color ?? '#d1d5db';
            return (
              <div
                key={s.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 group"
              >
                <div className="w-1.5 h-full shrink-0 mt-1 rounded-full self-stretch" style={{ backgroundColor: primaryColor, minHeight: '1rem' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1 mb-0.5">
                    {sTags.map((t) => (
                      <span key={t.id} className="text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: t.color }}>
                        {t.name}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 italic truncate">"{s.text}"</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { onFocus(s.id); onCancel(); }}
                    className="text-xs text-blue-500 hover:text-blue-700 px-1.5 py-0.5 rounded hover:bg-blue-50"
                    title="Focus in list"
                  >
                    focus
                  </button>
                  <button
                    onClick={() => { onDelete(s.id); onCancel(); }}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none"
                    title="Delete snippet"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── TagPicker popup ── */
interface TagPickerProps {
  tags: Tag[];
  pos: { x: number; y: number };
  selectedText: string;
  onSelect: (tagId: string) => void;
  onCancel: () => void;
}

function TagPicker({ tags, pos, selectedText, onSelect, onCancel }: TagPickerProps) {
  const { addTag } = useStore();
  const [newName, setNewName] = useState('');

  const left = Math.min(pos.x, window.innerWidth - 224);
  const top = Math.min(pos.y + 8, window.innerHeight - 320);

  const createAndApply = () => {
    const name = newName.trim();
    if (!name) return;
    const tag = addTag(name);
    onSelect(tag.id);
  };

  return (
    <>
      <div className="fixed inset-0" style={{ zIndex: 998 }} onMouseDown={onCancel} />
      <div
        className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-56"
        style={{ left, top, zIndex: 999 }}
      >
        <p className="text-xs text-gray-400 mb-2 truncate">"{selectedText}"</p>

        {tags.length > 0 && (
          <div className="space-y-0.5 mb-2 max-h-44 overflow-y-auto">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => onSelect(tag.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 text-left"
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                <span className="text-sm text-gray-700">{tag.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-gray-100 pt-2 flex gap-1">
          <input
            autoFocus={tags.length === 0}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') createAndApply(); if (e.key === 'Escape') onCancel(); }}
            placeholder={tags.length === 0 ? 'New tag name…' : 'Create new tag…'}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={createAndApply} className="text-xs bg-blue-600 text-white px-2 py-1.5 rounded-lg hover:bg-blue-700 font-medium">
            +
          </button>
        </div>
      </div>
    </>
  );
}
