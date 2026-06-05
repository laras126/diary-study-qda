import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  downloadAll,
  downloadFile,
  exportEntriesToCSV,
  exportSnippetsToCSV,
  exportTagsToCSV,
  exportToJSON,
} from '../utils/export';

export function ExportButton() {
  const { entries, tags, snippets } = useStore();
  const [open, setOpen] = useState(false);
  const ts = new Date().toISOString().split('T')[0];

  const dl = (content: string, name: string, mime: string) => {
    downloadFile(content, name, mime);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
        </svg>
        Export
      </button>

      {open && (
        <>
          <div className="fixed inset-0" style={{ zIndex: 49 }} onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-52"
            style={{ zIndex: 50 }}
          >
            <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Individual files</div>
            {[
              { label: 'Entries CSV', content: () => exportEntriesToCSV(entries), name: `entries_${ts}.csv`, mime: 'text/csv' },
              { label: 'Snippets CSV', content: () => exportSnippetsToCSV(snippets, entries, tags), name: `snippets_${ts}.csv`, mime: 'text/csv' },
              { label: 'Tags CSV', content: () => exportTagsToCSV(tags, snippets), name: `tags_${ts}.csv`, mime: 'text/csv' },
              { label: 'Full export JSON', content: () => exportToJSON(entries, tags, snippets), name: `full_export_${ts}.json`, mime: 'application/json' },
            ].map(({ label, content, name, mime }) => (
              <button
                key={name}
                onClick={() => dl(content(), name, mime)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {label}
              </button>
            ))}
            <div className="border-t border-gray-100 mx-3 my-1" />
            <button
              onClick={() => { downloadAll(entries, tags, snippets); setOpen(false); }}
              className="w-full text-left px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              Download all (4 files)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
