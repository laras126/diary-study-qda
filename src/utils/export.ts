import Papa from 'papaparse';
import { Entry, Tag, Snippet } from '../types';

export function exportToJSON(entries: Entry[], tags: Tag[], snippets: Snippet[]): string {
  return JSON.stringify({ entries, tags, snippets }, null, 2);
}

export function exportEntriesToCSV(entries: Entry[]): string {
  return Papa.unparse(
    entries.map((e) => ({
      id: e.id,
      originalId: e.originalId,
      type: e.type,
      date: e.date,
      originalDate: e.originalDate,
      dateModified: e.dateModified,
      text: e.text,
      startTime: e.startTime,
      completionTime: e.completionTime,
    }))
  );
}

export function exportSnippetsToCSV(snippets: Snippet[], entries: Entry[], tags: Tag[]): string {
  return Papa.unparse(
    snippets.map((s) => {
      const entry = entries.find((e) => e.id === s.entryId);
      const tagNames = s.tagIds
        .map((id) => tags.find((t) => t.id === id)?.name ?? id)
        .join('; ');
      return {
        snippetId: s.id,
        entryId: s.entryId,
        entryDate: entry?.date ?? '',
        entryType: entry?.type ?? '',
        tags: tagNames,
        text: s.text,
        note: s.note,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        createdAt: s.createdAt,
      };
    })
  );
}

export function exportTagsToCSV(tags: Tag[], snippets: Snippet[]): string {
  return Papa.unparse(
    tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      snippetCount: snippets.filter((s) => s.tagIds.includes(t.id)).length,
    }))
  );
}

function download(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a tick so the browser has time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 250);
}

export function downloadFile(
  content: string,
  filename: string,
  mime: string = 'text/plain'
) {
  download(content, filename, mime);
}

export function downloadAll(entries: Entry[], tags: Tag[], snippets: Snippet[]) {
  const ts = new Date().toISOString().split('T')[0];
  const pairs: [string, string, string][] = [
    [exportEntriesToCSV(entries), `entries_${ts}.csv`, 'text/csv'],
    [exportSnippetsToCSV(snippets, entries, tags), `snippets_${ts}.csv`, 'text/csv'],
    [exportTagsToCSV(tags, snippets), `tags_${ts}.csv`, 'text/csv'],
    [exportToJSON(entries, tags, snippets), `full_export_${ts}.json`, 'application/json'],
  ];
  pairs.forEach(([content, name, mime], i) => {
    setTimeout(() => download(content, name, mime), i * 120);
  });
}
