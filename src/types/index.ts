export interface Entry {
  id: string;
  originalId: string;
  rowIndex: number;
  startTime: string;
  completionTime: string;
  type: 'AM' | 'PM';
  text: string;
  date: string;         // YYYY-MM-DD — the working date, can be changed
  originalDate: string; // YYYY-MM-DD — from completionTime, immutable
  dateModified: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Snippet {
  id: string;
  entryId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  tagIds: string[];
  note: string;
  createdAt: string;
}

export type ViewType = 'home' | 'import' | 'clean' | 'code' | 'tags' | 'analysis' | 'about';
