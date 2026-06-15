import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { Tag } from '../types';
import { getEffectiveColor } from '../utils/tags';
import { CodebookPrintView } from './CodebookPrintView';

interface DetailsMeta {
  description: string;
  example: string;
  nonExample: string;
}

export function TagManagerView() {
  const { tags, snippets, addTag, renameTag, updateTagMeta, deleteTag, setCurrentView, setAnalysisPreset } = useStore();

  const goToAnalysis = (tagId: string) => {
    setAnalysisPreset([tagId]);
    setCurrentView('analysis');
  };

  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');

  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [detailsMeta, setDetailsMeta] = useState<DetailsMeta>({ description: '', example: '', nonExample: '' });
  const [showPrint, setShowPrint] = useState(false);

  const startEdit = (t: Tag) => { setEditId(t.id); setEditName(t.name); };
  const saveEdit = () => {
    if (editId && editName.trim()) renameTag(editId, editName.trim());
    setEditId(null);
  };

  const toggleDetails = (t: Tag) => {
    if (detailsId === t.id) {
      setDetailsId(null);
    } else {
      setDetailsId(t.id);
      setDetailsMeta({
        description: t.description ?? '',
        example: t.example ?? '',
        nonExample: t.nonExample ?? '',
      });
    }
  };

  const saveDetails = (tagId: string) => {
    updateTagMeta(tagId, {
      description: detailsMeta.description.trim(),
      example: detailsMeta.example.trim(),
      nonExample: detailsMeta.nonExample.trim(),
    });
    setDetailsId(null);
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    addTag(name);
    setNewName('');
  };

  const handleDelete = (t: Tag) => {
    const count = snippets.filter((s) => s.tagIds.includes(t.id)).length;
    const msg = count > 0
      ? `Delete "${t.name}"? It's used on ${count} snippet${count !== 1 ? 's' : ''}. Those snippets will also be removed if they have no other tags.`
      : `Delete tag "${t.name}"?`;
    if (window.confirm(msg)) deleteTag(t.id);
  };

  const orderedTags = useMemo(() => {
    const parents = tags.filter((t) => !t.name.includes('/'));
    const children = tags.filter((t) => t.name.includes('/'));
    const rows: Array<{ tag: Tag; isChild: boolean }> = [];
    for (const parent of parents) {
      rows.push({ tag: parent, isChild: false });
      for (const child of children.filter((c) => c.name.startsWith(parent.name + '/'))) {
        rows.push({ tag: child, isChild: true });
      }
    }
    for (const orphan of children.filter((c) => !parents.some((p) => c.name.startsWith(p.name + '/')))) {
      rows.push({ tag: orphan, isChild: true });
    }
    return rows;
  }, [tags]);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-2xl font-bold text-gray-900">Codebook</h2>
        <button
          onClick={() => setShowPrint(true)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
          </svg>
          Print codebook
        </button>
      </div>
      <p className="text-gray-500 text-sm mb-6">
        Define your qualitative codes. Add a description, example, and non-example to document each one.
      </p>
      {showPrint && <CodebookPrintView onClose={() => setShowPrint(false)} />}

      {/* Create */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Create new code</h3>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Tag name…"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleCreate}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Create
          </button>
        </div>
      </div>

      {/* List */}
      {tags.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          No tags yet. Create your first tag above.
        </div>
      ) : (
        <div className="space-y-2">
          {orderedTags.map(({ tag, isChild }) => {
            const count = snippets.filter((s) => s.tagIds.includes(tag.id)).length;
            const editing = editId === tag.id;
            const showingDetails = detailsId === tag.id;
            const hasDetails = !!(tag.description || tag.example || tag.nonExample);
            const dotColor = getEffectiveColor(tag, tags);

            return (
              <div
                key={tag.id}
                className={`bg-white rounded-xl border p-4 transition-shadow ${isChild ? 'ml-6' : ''} ${editing ? 'border-blue-300 shadow-sm' : showingDetails ? 'border-gray-300 shadow-sm' : 'border-gray-200'}`}
              >
                {/* Top row */}
                <div className="flex items-center gap-3">
                  {editing ? (
                    <>
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditId(null); }}
                        className="flex-1 border border-blue-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </>
                  ) : (
                    <button
                      onClick={() => goToAnalysis(tag.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left group"
                      title={`View ${count} snippet${count !== 1 ? 's' : ''} tagged "${tag.name}"`}
                    >
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                      <span className="text-gray-800 font-medium text-sm group-hover:text-blue-600 transition-colors">
                        {tag.name}
                      </span>
                      <span className="text-xs text-gray-400 group-hover:text-blue-400 transition-colors">
                        {count} snippet{count !== 1 ? 's' : ''} →
                      </span>
                    </button>
                  )}

                  {editing ? (
                    <div className="flex items-center gap-2">
                      <button onClick={saveEdit} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">Save</button>
                      <button onClick={() => setEditId(null)} className="text-xs text-gray-400 hover:text-gray-600">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(tag)} className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors">
                        Rename
                      </button>
                      <button
                        onClick={() => toggleDetails(tag)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${showingDetails ? 'text-gray-700 bg-gray-100' : hasDetails ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      >
                        {showingDetails ? 'Close' : 'Details'}
                        {!showingDetails && hasDetails && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-400 inline-block align-middle" />}
                      </button>
                      <button onClick={() => handleDelete(tag)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Details panel */}
                {showingDetails && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Description</label>
                      <textarea
                        value={detailsMeta.description}
                        onChange={(e) => setDetailsMeta((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="What does this code mean? What are you looking for?"
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Example</label>
                      <textarea
                        value={detailsMeta.example}
                        onChange={(e) => setDetailsMeta((prev) => ({ ...prev, example: e.target.value }))}
                        placeholder="A passage or idea that fits this code…"
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 block mb-1">Non-example</label>
                      <textarea
                        value={detailsMeta.nonExample}
                        onChange={(e) => setDetailsMeta((prev) => ({ ...prev, nonExample: e.target.value }))}
                        placeholder="Something that might look like this code but isn't…"
                        rows={2}
                        className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveDetails(tag.id)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setDetailsId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Cancel
                      </button>
                    </div>
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
