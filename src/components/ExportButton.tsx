import React from 'react';
import { useStore } from '../store/useStore';
import { downloadJSON } from '../utils/export';

interface Props {
  onExport?: () => void;
}

export function ExportButton({ onExport }: Props) {
  const { entries, tags, snippets } = useStore();

  const handleExport = () => {
    downloadJSON(entries, tags, snippets);
    onExport?.();
  };

  return (
    <button
      onClick={handleExport}
      className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
    >
      Export backup
    </button>
  );
}
