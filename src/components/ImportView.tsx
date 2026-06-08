import React, { useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { parseCSV, readCSVHeaders, detectColumns, ColumnMap } from '../utils/csvParser';
import { Entry, Tag, Snippet } from '../types';

interface BackupPreview {
  entries: Entry[];
  tags: Tag[];
  snippets: Snippet[];
}

const COLUMN_FIELDS: { key: keyof ColumnMap; label: string; required: boolean; hint: string }[] = [
  { key: 'am',             label: 'AM entries',   required: true,  hint: 'Morning / start-of-day responses' },
  { key: 'pm',             label: 'PM entries',   required: true,  hint: 'Evening / end-of-day responses' },
  { key: 'completionTime', label: 'Date column',  required: false, hint: 'Used to date each entry (e.g. submission timestamp)' },
  { key: 'startTime',      label: 'Start time',   required: false, hint: 'Optional — stored but not displayed' },
  { key: 'id',             label: 'Response ID',  required: false, hint: 'Optional — falls back to row number' },
];

export function ImportView() {
  const { setEntries, setCurrentView, restoreFromBackup, entries: existing } = useStore();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[] | null>(null);
  const [columnMap, setColumnMap] = useState<ColumnMap | null>(null);
  const [preview, setPreview] = useState<Entry[] | null>(null);
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const resetCSV = () => {
    setCsvFile(null);
    setHeaders(null);
    setColumnMap(null);
    setPreview(null);
    setError(null);
  };

  const handleCSVFile = async (file: File) => {
    resetCSV();
    setBackupPreview(null);
    try {
      const hdrs = await readCSVHeaders(file);
      if (hdrs.length === 0) {
        setError('Could not read columns from this file.');
        return;
      }
      setCsvFile(file);
      setHeaders(hdrs);
      setColumnMap(detectColumns(hdrs));
    } catch {
      setError('Failed to read CSV — make sure it is a valid CSV file.');
    }
  };

  const handleJSONFile = async (file: File) => {
    resetCSV();
    setBackupPreview(null);
    setError(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data.entries) || !Array.isArray(data.tags) || !Array.isArray(data.snippets)) {
        setError('Invalid backup file — expected a full_export JSON with entries, tags, and snippets.');
        return;
      }
      setBackupPreview({ entries: data.entries, tags: data.tags, snippets: data.snippets });
    } catch {
      setError('Failed to parse JSON backup file.');
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (file.name.endsWith('.json')) handleJSONFile(file);
      else handleCSVFile(file);
    },
    [] // eslint-disable-line
  );

  const handleConfirmMapping = async () => {
    if (!csvFile || !columnMap) return;
    setError(null);
    try {
      const parsed = await parseCSV(csvFile, columnMap);
      if (parsed.length === 0) {
        setError('No entries found with the selected columns. Check the AM and PM column selections.');
        return;
      }
      setPreview(parsed);
    } catch {
      setError('Failed to parse CSV.');
    }
  };

  const confirmImport = (replace: boolean) => {
    if (!preview) return;
    setEntries(replace ? preview : [...existing, ...preview]);
    setCurrentView('clean');
  };

  const canPreview = !!columnMap?.am && !!columnMap?.pm;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Import data</h2>
      <p className="text-gray-500 mb-6 text-sm">
        Upload a CSV from Microsoft Forms or Google Forms, or a{' '}
        <code className="bg-gray-100 px-1 rounded">full_export_*.json</code> backup to restore all entries, tags, and snippets.
      </p>

      {/* ── Drop zone ── */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        className={`border-2 border-dashed rounded-xl p-14 text-center transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'
        }`}
      >
        <div className="text-5xl mb-4">📂</div>
        <p className="text-gray-500 mb-4">Drag & drop your CSV or JSON backup here, or</p>
        <label className="cursor-pointer inline-block bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          Choose file
          <input
            type="file"
            accept=".csv,.json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              if (f.name.endsWith('.json')) handleJSONFile(f);
              else handleCSVFile(f);
            }}
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Column mapping ── */}
      {headers && columnMap && !preview && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900">Map your columns</h3>
            <button onClick={resetCSV} className="text-xs text-gray-400 hover:text-gray-600">
              ← Choose a different file
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-5">
            {headers.length} columns found. AM and PM are pre-filled where detected — confirm or adjust before continuing.
          </p>

          <div className="space-y-4">
            {COLUMN_FIELDS.map(({ key, label, required, hint }) => (
              <div key={key}>
                <div className="flex items-baseline gap-2 mb-1">
                  <label className="text-sm font-medium text-gray-700">{label}</label>
                  {required
                    ? <span className="text-xs text-red-500">required</span>
                    : <span className="text-xs text-gray-400">optional</span>}
                </div>
                <p className="text-xs text-gray-400 mb-1.5">{hint}</p>
                <select
                  value={columnMap[key]}
                  onChange={(e) => setColumnMap({ ...columnMap, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— not in this file —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            onClick={handleConfirmMapping}
            disabled={!canPreview}
            className="mt-6 w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Preview entries →
          </button>
        </div>
      )}

      {/* ── Entry preview ── */}
      {preview && (
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Preview</h3>
            <button
              onClick={() => setPreview(null)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Change column mapping
            </button>
          </div>

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
                onClick={() => confirmImport(false)}
                className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Append to {existing.length} existing
              </button>
            )}
            <button
              onClick={() => confirmImport(true)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {existing.length > 0 ? 'Replace all & continue' : 'Import & continue →'}
            </button>
          </div>
        </div>
      )}

      {existing.length > 0 && !headers && !preview && !backupPreview && (
        <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-gray-600">
          {existing.length} entries already loaded.{' '}
          <button onClick={() => setCurrentView('clean')} className="text-blue-600 hover:underline">
            Continue working →
          </button>
        </div>
      )}

      {/* ── JSON backup restore ── */}
      {backupPreview && (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-800 mb-3">Ready to restore from backup:</p>
          <div className="flex gap-4 text-sm mb-5">
            <span className="text-gray-600"><strong>{backupPreview.entries.length}</strong> entries</span>
            <span className="text-gray-600"><strong>{backupPreview.tags.length}</strong> tags</span>
            <span className="text-gray-600"><strong>{backupPreview.snippets.length}</strong> snippets</span>
          </div>
          <button
            onClick={() => { restoreFromBackup(backupPreview); setBackupPreview(null); }}
            className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            Restore all data →
          </button>
        </div>
      )}
    </div>
  );
}
