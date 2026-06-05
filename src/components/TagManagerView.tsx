import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Tag } from '../types';

export function TagManagerView() {
  const { tags, snippets, addTag, renameTag, deleteTag, setCurrentView, setAnalysisPreset } = useStore();

  const goToAnalysis = (tagId: string) => {
    setAnalysisPreset([tagId]);
    setCurrentView('analysis');
  };
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');

  const startEdit = (t: Tag) => { setEditId(t.id); setEditName(t.name); };
  const saveEdit = () => {
    if (editId && editName.trim()) renameTag(editId, editName.trim());
    setEditId(null);
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

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Tag Manager</h2>
      <p className="text-gray-500 text-sm mb-6">
        Manage your qualitative codes. Renaming a tag updates every snippet automatically.
      </p>

      {/* Create */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Create new tag</h3>
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
          {tags.map((tag) => {
            const count = snippets.filter((s) => s.tagIds.includes(tag.id)).length;
            const editing = editId === tag.id;
            return (
              <div
                key={tag.id}
                className={`bg-white rounded-xl border p-4 flex items-center gap-3 transition-shadow ${editing ? 'border-blue-300 shadow-sm' : 'border-gray-200'}`}
              >
                {editing ? (
                  <>
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
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
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
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
                    <button onClick={() => handleDelete(tag)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors">
                      Delete
                    </button>
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
