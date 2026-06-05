import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { parseCSV } from '../utils/csvParser';
import { Entry } from '../types';

export function ImportView() {
  const { setEntries, setCurrentView, entries: existing } = useStore();
  const [preview, setPreview] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    setError(null);
    setPreview(null);
    try {
      const parsed = await parseCSV(file);
      if (parsed.length === 0) {
        setError('No entries found. Check that the file has AM: or PM: column headers.');
        return;
      }
      setPreview(parsed);
    } catch {
      setError('Failed to parse CSV — make sure it matches the expected format.');
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [] // eslint-disable-line
  );

  const confirm = (replace: boolean) => {
    if (!preview) return;
    setEntries(replace ? preview : [...existing, ...preview]);
    setCurrentView('clean');
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Import data</h2>
      <p className="text-gray-500 mb-6 text-sm">
        Upload the CSV exported from Microsoft Forms. Expects columns starting with <code className="bg-gray-100 px-1 rounded">AM:</code> and <code className="bg-gray-100 px-1 rounded">PM:</code>.
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-xl p-14 text-center transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <div className="text-5xl mb-4">📂</div>
        <p className="text-gray-500 mb-4">Drag & drop your CSV here, or</p>
        <label className="cursor-pointer inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Choose file
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {preview && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[
              { label: 'Total entries', value: preview.length, cls: 'bg-slate-50 text-slate-700' },
              { label: 'AM entries', value: preview.filter((e) => e.type === 'AM').length, cls: 'bg-amber-50 text-amber-700' },
              { label: 'PM entries', value: preview.filter((e) => e.type === 'PM').length, cls: 'bg-indigo-50 text-indigo-700' },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`rounded-lg p-4 ${cls}`}>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs mt-0.5 opacity-70">{label}</div>
              </div>
            ))}
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto mb-5">
            {preview.slice(0, 12).map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50 text-sm">
                <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${
                  e.type === 'AM' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'
                }`}>{e.type}</span>
                <span className="text-gray-400 shrink-0 tabular-nums">{e.date}</span>
                <span className="text-gray-700 line-clamp-1">{e.text}</span>
              </div>
            ))}
            {preview.length > 12 && (
              <p className="text-xs text-gray-400 text-center py-1">…and {preview.length - 12} more</p>
            )}
          </div>

          <div className="flex gap-3">
            {existing.length > 0 && (
              <button
                onClick={() => confirm(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Append to {existing.length} existing
              </button>
            )}
            <button
              onClick={() => confirm(true)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {existing.length > 0 ? 'Replace all & continue' : 'Import & continue →'}
            </button>
          </div>
        </div>
      )}

      {existing.length > 0 && !preview && (
        <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
          {existing.length} entries already loaded.{' '}
          <button onClick={() => setCurrentView('clean')} className="text-blue-600 hover:underline">
            Continue working →
          </button>
        </div>
      )}
    </div>
  );
}
