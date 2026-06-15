import React from 'react';
import { useStore } from '../store/useStore';
import { downloadCSV, downloadJSON } from '../utils/export';

interface Props {
  onExport?: () => void;
}

export function ExportButton({ onExport }: Props) {
  const { entries, tags, snippets } = useStore();

  const handleCSV = () => {
    downloadCSV(entries, tags, snippets);
    onExport?.();
  };

  const handleJSON = () => {
    downloadJSON(entries, tags, snippets);
    onExport?.();
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleCSV}
        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
      >
        Export CSV
      </button>
      <button
        onClick={handleJSON}
        className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
      >
        Export JSON
      </button>
    </div>
  );
}
