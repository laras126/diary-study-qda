import React, { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';

export function HomeView() {
  const { entries, tags, snippets, selectedEntryId, setCurrentView, setSelectedEntry } = useStore();

  const hasData = entries.length > 0;

  // Coding progress
  const codedEntryIds = useMemo(
    () => new Set(snippets.map((s) => s.entryId)),
    [snippets]
  );
  const codedCount = entries.filter((e) => codedEntryIds.has(e.id)).length;
  const uncoded = entries.filter((e) => !codedEntryIds.has(e.id));

  // "Resume" entry — last selected, or first uncoded, or first entry
  const resumeEntry = useMemo(() => {
    if (selectedEntryId) {
      const e = entries.find((e) => e.id === selectedEntryId);
      if (e) return e;
    }
    return uncoded[0] ?? entries[0] ?? null;
  }, [entries, selectedEntryId, uncoded]);

  // Tag breakdown sorted by snippet count desc
  const tagStats = useMemo(
    () =>
      tags
        .map((t) => ({ tag: t, count: snippets.filter((s) => s.tagIds.includes(t.id)).length }))
        .sort((a, b) => b.count - a.count),
    [tags, snippets]
  );
  const maxTagCount = tagStats[0]?.count ?? 1;

  const goCode = (entryId?: string) => {
    if (entryId) setSelectedEntry(entryId);
    setCurrentView('code');
  };

  const fmtDate = (dateStr: string) => {
    try { return format(parseISO(dateStr + 'T12:00:00'), 'EEE, MMM d'); }
    catch { return dateStr; }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Diary Study Studio</h1>
        <p className="text-gray-500 mt-1">
          {hasData ? 'Your project at a glance.' : 'Get started by importing your diary study CSV.'}
        </p>
      </div>

      {!hasData ? (
        /* ── Empty state ── */
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <div className="text-5xl mb-4">📂</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No data loaded yet</h2>
          <p className="text-gray-500 mb-6 text-sm max-w-sm mx-auto">
            Import your diary study CSV to start coding entries and building your analysis.
          </p>
          <button
            onClick={() => setCurrentView('import')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Import data →
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Stat strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Entries', value: entries.length, sub: `${uncoded.length} uncoded`, color: 'text-gray-800' },
              { label: 'Coded', value: codedCount, sub: `${Math.round((codedCount / entries.length) * 100)}% of entries`, color: 'text-green-700' },
              { label: 'Tags', value: tags.length, sub: 'qualitative codes', color: 'text-blue-700' },
              { label: 'Snippets', value: snippets.length, sub: 'text selections', color: 'text-purple-700' },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className={`text-3xl font-bold ${color}`}>{value}</div>
                <div className="text-xs font-medium text-gray-600 mt-0.5">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* ── Two-column layout ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Resume coding */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                {selectedEntryId ? 'Resume where you left off' : 'Start coding'}
              </h2>

              {resumeEntry && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${resumeEntry.type === 'AM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {resumeEntry.type}
                    </span>
                    <span className="text-xs text-gray-500">{fmtDate(resumeEntry.date)}</span>
                    {!codedEntryIds.has(resumeEntry.id) && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">uncoded</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{resumeEntry.text}</p>
                </div>
              )}

              <button
                onClick={() => goCode(resumeEntry?.id)}
                className="w-full bg-gray-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                {selectedEntryId ? 'Continue coding →' : 'Start coding →'}
              </button>

              {uncoded.length > 0 && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  {uncoded.length} {uncoded.length === 1 ? 'entry' : 'entries'} still to code
                </p>
              )}
              {uncoded.length === 0 && entries.length > 0 && (
                <p className="text-xs text-green-600 text-center mt-3 font-medium">
                  ✓ All entries coded
                </p>
              )}
            </div>

            {/* Tag breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">Tag breakdown</h2>
                <button onClick={() => setCurrentView('tags')} className="text-xs text-blue-500 hover:text-blue-700">
                  Manage →
                </button>
              </div>

              {tags.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-400 mb-3">No tags yet</p>
                  <button onClick={() => setCurrentView('tags')} className="text-xs text-blue-500 hover:underline">
                    Create your first tag →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {tagStats.map(({ tag, count }) => (
                    <div key={tag.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                          <span className="text-sm text-gray-700">{tag.name}</span>
                        </div>
                        <button
                          onClick={() => { useStore.getState().setAnalysisPreset([tag.id]); setCurrentView('analysis'); }}
                          className="text-xs text-gray-400 hover:text-blue-500 tabular-nums"
                        >
                          {count} snippet{count !== 1 ? 's' : ''} →
                        </button>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            backgroundColor: tag.color,
                            width: maxTagCount > 0 ? `${(count / maxTagCount) * 100}%` : '0%',
                            opacity: count === 0 ? 0.3 : 1,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Uncoded entries list ── */}
          {uncoded.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Uncoded entries <span className="text-gray-400 font-normal">({uncoded.length})</span>
              </h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uncoded.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => goCode(e.id)}
                    className="w-full flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-left transition-colors group"
                  >
                    <span className={`shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded ${e.type === 'AM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                      {e.type}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs text-gray-400 mr-2">{fmtDate(e.date)}</span>
                      <span className="text-sm text-gray-600 line-clamp-1">{e.text}</span>
                    </div>
                    <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">Code →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
