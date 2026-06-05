import React, { useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';

export function AnalysisView() {
  const { entries, tags, snippets, setSelectedEntry, setCurrentView, analysisPresetTagIds, setAnalysisPreset } = useStore();

  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'any' | 'all'>('any');

  // Apply (and immediately clear) any tag preset set by the Tag Manager
  useEffect(() => {
    if (analysisPresetTagIds.length) {
      setSelectedTagIds(analysisPresetTagIds);
      setAnalysisPreset([]);
    }
  }, [analysisPresetTagIds]);

  const toggle = (id: string) =>
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const filtered = useMemo(() => {
    if (!selectedTagIds.length) return snippets;
    return snippets.filter((s) =>
      mode === 'any'
        ? selectedTagIds.some((id) => s.tagIds.includes(id))
        : selectedTagIds.every((id) => s.tagIds.includes(id))
    );
  }, [snippets, selectedTagIds, mode]);

  const goToEntry = (entryId: string) => {
    setSelectedEntry(entryId);
    setCurrentView('code');
  };

  if (!entries.length)
    return (
      <div className="h-full flex items-center justify-center text-gray-400 text-sm">No data loaded.</div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Analysis</h2>
      <p className="text-gray-500 text-sm mb-6">
        Browse coded snippets by tag. Click "View in context" to jump to the source entry.
      </p>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">Filter by tag</span>
          {selectedTagIds.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-gray-400 mr-1">Match:</span>
              {(['any', 'all'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-2 py-1 rounded ${mode === m ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {m === 'any' ? 'Any tag' : 'All tags'}
                </button>
              ))}
            </div>
          )}
        </div>

        {tags.length === 0 ? (
          <p className="text-sm text-gray-400">No tags created yet.</p>
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
      <div className="text-xs text-gray-400 mb-3">
        {filtered.length} snippet{filtered.length !== 1 ? 's' : ''}
        {selectedTagIds.length > 0
          ? ` matching ${mode === 'any' ? 'any' : 'all'} of the selected tag${selectedTagIds.length !== 1 ? 's' : ''}`
          : ' total'}
      </div>

      {/* Snippet cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {snippets.length === 0
            ? 'No snippets yet — go to Coding to highlight text.'
            : 'No snippets match the selected filters.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const entry = entries.find((e) => e.id === s.entryId);
            const sTags = tags.filter((t) => s.tagIds.includes(t.id));
            const primaryColor = sTags[0]?.color ?? '#d1d5db';

            return (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex flex-wrap gap-1">
                    {sTags.map((t) => (
                      <span
                        key={t.id}
                        className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                        style={{ backgroundColor: t.color }}
                      >
                        {t.name}
                      </span>
                    ))}
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
                        onClick={() => goToEntry(entry.id)}
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

                {entry && (
                  <p className="text-xs text-gray-400 mt-2 truncate">
                    {entry.text.length > 120 ? entry.text.slice(0, 120) + '…' : entry.text}
                  </p>
                )}

                {s.note && (
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-start gap-1.5">
                    <span className="text-xs text-gray-400 shrink-0 mt-px">Note:</span>
                    <p className="text-xs text-gray-600 leading-relaxed">{s.note}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
