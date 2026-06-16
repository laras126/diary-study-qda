import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { isChildTag, getEffectiveColor } from '../utils/tags';
import { Snippet } from '../types';

export function AnalysisView() {
  const {
    entries, tags, snippets,
    analysisPresetTagIds, setAnalysisPreset,
    analysisSelectedTagIds: selectedTagIds, setAnalysisSelectedTagIds: setSelectedTagIds,
    analysisMode: mode, setAnalysisMode: setMode,
    analysisCompareMode: compareMode, setAnalysisCompareMode: setCompareMode,
    addTag, updateSnippetTags, updateSnippetNote,
    setSelectedEntry, setCurrentView, setPendingFocusSnippet,
  } = useStore();

  const [addingCodeFor, setAddingCodeFor] = useState<string | null>(null);
  const [codeInput, setCodeInput] = useState('');
  const codeInputRef = useRef<HTMLInputElement>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [editingParentTag, setEditingParentTag] = useState<{ snippetId: string; tagId: string } | null>(null);

  const parentTags = useMemo(() => tags.filter((t) => !isChildTag(t)), [tags]);

  const swapParentTag = (snippetId: string, oldTagId: string, newTagId: string, currentTagIds: string[]) => {
    const deduped = [...new Set(currentTagIds.map((id) => (id === oldTagId ? newTagId : id)))];
    updateSnippetTags(snippetId, deduped);
    setEditingParentTag(null);
  };

  const removeParentTag = (snippetId: string, tagId: string, currentTagIds: string[]) => {
    updateSnippetTags(snippetId, currentTagIds.filter((id) => id !== tagId));
    setEditingParentTag(null);
  };

  const goToEntry = (entryId: string, snippetId: string) => {
    setSelectedEntry(entryId);
    setPendingFocusSnippet(snippetId);
    setCurrentView('code');
  };

  const toggleExpanded = (snippetId: string) =>
    setExpandedEntries((prev) => {
      const next = new Set(prev);
      next.has(snippetId) ? next.delete(snippetId) : next.add(snippetId);
      return next;
    });

  useEffect(() => {
    if (analysisPresetTagIds.length) {
      setSelectedTagIds(analysisPresetTagIds);
      setAnalysisPreset([]);
    }
  }, [analysisPresetTagIds]);

  const toggle = (id: string) =>
    setSelectedTagIds(selectedTagIds.includes(id) ? selectedTagIds.filter((x) => x !== id) : [...selectedTagIds, id]);

  const submitCode = (snippetId: string, currentTagIds: string[]) => {
    const name = codeInput.trim();
    if (!name) return;
    let tag = tags.find((t) => t.name === name);
    if (!tag) tag = addTag(name);
    if (!currentTagIds.includes(tag.id)) {
      updateSnippetTags(snippetId, [...currentTagIds, tag.id]);
    }
    setAddingCodeFor(null);
    setCodeInput('');
  };

  const addExistingCode = (snippetId: string, tagId: string, currentTagIds: string[]) => {
    if (!currentTagIds.includes(tagId)) {
      updateSnippetTags(snippetId, [...currentTagIds, tagId]);
    }
    setAddingCodeFor(null);
    setCodeInput('');
  };

  const cancelCode = () => {
    setAddingCodeFor(null);
    setCodeInput('');
  };

  const filtered = useMemo(() => {
    if (!selectedTagIds.length) return snippets;
    if (mode === 'any') {
      return snippets.filter((s) => selectedTagIds.some((id) => s.tagIds.includes(id)));
    }
    // "All codes in snippet": find entries where every selected code appears
    // in at least one snippet, then show those snippets that carry any selected code.
    const qualifyingEntryIds = new Set(
      entries
        .filter((entry) => {
          const entrySnippets = snippets.filter((s) => s.entryId === entry.id);
          return selectedTagIds.every((tagId) =>
            entrySnippets.some((s) => s.tagIds.includes(tagId))
          );
        })
        .map((e) => e.id)
    );
    return snippets.filter(
      (s) => qualifyingEntryIds.has(s.entryId) && selectedTagIds.some((id) => s.tagIds.includes(id))
    );
  }, [snippets, selectedTagIds, mode, entries]);

  const compareGroups = useMemo(() => {
    if (!compareMode) return [];
    const byDate: Record<string, { am: Snippet[]; pm: Snippet[] }> = {};
    for (const s of filtered) {
      const entry = entries.find((e) => e.id === s.entryId);
      if (!entry) continue;
      if (!byDate[entry.date]) byDate[entry.date] = { am: [], pm: [] };
      if (entry.type === 'AM') byDate[entry.date].am.push(s);
      else byDate[entry.date].pm.push(s);
    }
    return Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
  }, [compareMode, filtered, entries]);

  const renderCard = (s: Snippet) => {
    const entry = entries.find((e) => e.id === s.entryId);
    const sTags = tags.filter((t) => s.tagIds.includes(t.id));
    const primaryColor = sTags[0] ? getEffectiveColor(sTags[0], tags) : '#d1d5db';
    const typeAccent = entry?.type === 'AM' ? '#f59e0b' : '#818cf8';

    return (
      <div
        key={s.id}
        className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
        style={{ borderLeftWidth: '3px', borderLeftColor: typeAccent }}
      >
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <div className="flex flex-wrap gap-1 items-center">
            {sTags.map((t) => {
              const color = getEffectiveColor(t, tags);
              return isChildTag(t) ? (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: color }}
                >
                  {t.name}
                  <button
                    onClick={() => updateSnippetTags(s.id, s.tagIds.filter((id) => id !== t.id))}
                    className="text-white/60 hover:text-white leading-none"
                    title={`Remove ${t.name}`}
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span key={t.id} className="relative">
                  <button
                    onClick={() => setEditingParentTag(
                      editingParentTag?.snippetId === s.id && editingParentTag?.tagId === t.id
                        ? null
                        : { snippetId: s.id, tagId: t.id }
                    )}
                    className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full text-white font-medium hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: color }}
                    title="Click to change code"
                  >
                    {t.name}
                    <svg className="w-2.5 h-2.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
                    </svg>
                  </button>
                  {editingParentTag?.snippetId === s.id && editingParentTag?.tagId === t.id && (
                    <>
                      <div className="fixed inset-0" style={{ zIndex: 48 }} onClick={() => setEditingParentTag(null)} />
                      <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 w-48" style={{ zIndex: 49 }}>
                        {parentTags.map((pt) => (
                          <button
                            key={pt.id}
                            onClick={() => swapParentTag(s.id, t.id, pt.id, s.tagIds)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50"
                          >
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: pt.color }} />
                            <span className={pt.id === t.id ? 'font-semibold text-gray-900' : 'text-gray-700'}>{pt.name}</span>
                            {pt.id === t.id && <span className="ml-auto text-gray-400">current</span>}
                          </button>
                        ))}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={() => removeParentTag(s.id, t.id, s.tagIds)}
                            className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50"
                          >
                            Remove code
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </span>
              );
            })}
            {addingCodeFor === s.id ? (() => {
              const available = parentTags.filter((t) => !s.tagIds.includes(t.id));
              const q = codeInput.trim().toLowerCase();
              const filteredCodes = available.filter((t) => t.name.toLowerCase().includes(q));
              const exactMatch = tags.find((t) => !isChildTag(t) && t.name.toLowerCase() === q);
              return (
                <span className="relative">
                  <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 w-52 z-50">
                    <div className="p-1.5 border-b border-gray-100">
                      <input
                        ref={codeInputRef}
                        autoFocus
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitCode(s.id, s.tagIds);
                          if (e.key === 'Escape') cancelCode();
                        }}
                        placeholder="Search or create…"
                        className="w-full text-xs px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto py-1">
                      {filteredCodes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => addExistingCode(s.id, t.id, s.tagIds)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-gray-50"
                        >
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          <span className="text-gray-700">{t.name}</span>
                        </button>
                      ))}
                      {codeInput.trim() && !exactMatch && (
                        <button
                          onClick={() => submitCode(s.id, s.tagIds)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-blue-50 text-blue-600"
                        >
                          <span className="font-medium">Create "{codeInput.trim()}"</span>
                        </button>
                      )}
                      {filteredCodes.length === 0 && !codeInput.trim() && (
                        <p className="text-xs text-gray-400 px-3 py-2">Type to search or create a code</p>
                      )}
                    </div>
                    {!codeInput.includes('/') && (
                      <p className="text-xs text-gray-400 px-3 py-2 border-t border-gray-100">
                        Tip: use <span className="font-mono text-gray-500">/</span> to add a subcode, e.g. <span className="font-mono text-gray-500">feeling/frustration</span>
                      </p>
                    )}
                  </div>
                  <div className="fixed inset-0 z-40" onClick={cancelCode} />
                </span>
              );
            })() : (
              <button
                onClick={() => { setAddingCodeFor(s.id); setCodeInput(''); }}
                className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-0.5 rounded border border-dashed border-gray-200 hover:border-gray-400 leading-4"
              >
                + code
              </button>
            )}
          </div>
          {entry && (
            <div className="flex items-center gap-2 text-xs shrink-0">
              <span className={`font-bold px-1.5 py-0.5 rounded ${entry.type === 'AM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {entry.type}
              </span>
              <span className="text-gray-400">
                {(() => { try { return format(parseISO(entry.date + 'T12:00:00'), 'MMM d, yyyy'); } catch { return entry.date; } })()}
              </span>
              <button
                onClick={() => toggleExpanded(s.id)}
                className="text-blue-500 hover:text-blue-700 hover:underline"
              >
                {expandedEntries.has(s.id) ? 'Collapse ↑' : 'See full entry ↓'}
              </button>
              <button
                onClick={() => goToEntry(entry.id, s.id)}
                className="text-blue-500 hover:text-blue-700 hover:underline"
              >
                View in context →
              </button>
            </div>
          )}
        </div>

        <blockquote
          className="text-gray-700 italic border-l-[3px] pl-3 py-0.5 text-sm leading-relaxed"
          style={{ borderColor: primaryColor }}
        >
          "{s.text}"
        </blockquote>

        {entry && expandedEntries.has(s.id) && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-700 leading-relaxed">
            <span>{entry.text.slice(0, s.startOffset)}</span>
            <mark
              className="rounded-sm"
              style={{ backgroundColor: primaryColor + '33', outline: `2px solid ${primaryColor}55`, outlineOffset: '1px' }}
            >{entry.text.slice(s.startOffset, s.endOffset)}</mark>
            <span>{entry.text.slice(s.endOffset)}</span>
          </div>
        )}

        <div className="mt-2 pt-2 border-t border-gray-100">
          <textarea
            value={s.note}
            onChange={(e) => updateSnippetNote(s.id, e.target.value)}
            placeholder="Add a note…"
            rows={1}
            className="w-full text-xs text-gray-700 bg-gray-50 rounded px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 placeholder:text-gray-400 leading-relaxed"
            style={{ minHeight: '1.25rem', height: s.note ? 'auto' : '1.25rem' }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = el.scrollHeight + 'px';
            }}
          />
        </div>
      </div>
    );
  };

  if (!entries.length)
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data loaded.</div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Analysis</h2>
      <p className="text-gray-500 text-sm mb-6">
        Browse coded snippets by code. Click "View in context" to jump to the source entry.
      </p>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Filter by code</span>
          {selectedTagIds.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-400 mr-1">Match:</span>
              {(['any', 'all'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-1 rounded ${mode === m ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {m === 'any' ? 'Any code' : 'All codes in snippet'}
                </button>
              ))}
            </div>
          )}
        </div>

        {tags.length === 0 ? (
          <p className="text-sm text-gray-400">No codes created yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const on = selectedTagIds.includes(tag.id);
              const count = snippets.filter((s) => s.tagIds.includes(tag.id)).length;
              return (
                <button
                  key={tag.id}
                  onClick={() => toggle(tag.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    on
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                  style={on ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: on ? 'rgba(255,255,255,0.7)' : tag.color }}
                  />
                  {tag.name}
                  <span className={`text-xs ${on ? 'text-white/70' : 'text-gray-400'}`}>({count})</span>
                </button>
              );
            })}
            {selectedTagIds.length > 0 && (
              <button
                onClick={() => setSelectedTagIds([])}
                className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs text-gray-400">
          {filtered.length} snippet{filtered.length !== 1 ? 's' : ''}
          {selectedTagIds.length > 0
            ? ` with ${mode === 'any' ? 'any' : 'all'} selected code${selectedTagIds.length !== 1 ? 's' : ''} in snippet`
            : ' total'}
        </div>
        {filtered.length > 0 && (
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              compareMode
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
            }`}
          >
            AM ↔ PM
          </button>
        )}
      </div>

      {/* Snippet cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {snippets.length === 0
            ? 'No snippets yet — go to Coding to highlight text.'
            : 'No snippets match the selected filters.'}
        </div>
      ) : compareMode ? (
        <div className="space-y-10">
          {compareGroups.map(([date, { am, pm }]) => {
            const label = (() => { try { return format(parseISO(date + 'T12:00:00'), 'EEEE, MMMM d, yyyy'); } catch { return date; } })();
            return (
              <div key={date}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-2 border-b border-gray-200">{label}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">AM</span>
                      <span className="text-xs text-gray-400">{am.length} snippet{am.length !== 1 ? 's' : ''}</span>
                    </div>
                    {am.length === 0
                      ? <p className="text-xs text-gray-300 italic py-6 text-center border border-dashed border-gray-100 rounded-xl">No AM snippets this day</p>
                      : <div className="space-y-3">{am.map((s) => renderCard(s))}</div>
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">PM</span>
                      <span className="text-xs text-gray-400">{pm.length} snippet{pm.length !== 1 ? 's' : ''}</span>
                    </div>
                    {pm.length === 0
                      ? <p className="text-xs text-gray-300 italic py-6 text-center border border-dashed border-gray-100 rounded-xl">No PM snippets this day</p>
                      : <div className="space-y-3">{pm.map((s) => renderCard(s))}</div>
                    }
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => renderCard(s))}
        </div>
      )}
    </div>
  );
}
