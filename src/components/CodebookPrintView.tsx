import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Tag } from '../types';
import { getEffectiveColor } from '../utils/tags';

interface Props {
  onClose: () => void;
}

export function CodebookPrintView({ onClose }: Props) {
  const { tags, snippets } = useStore();

  const grouped = useMemo(() => {
    const parents = tags.filter((t) => !t.name.includes('/'));
    const children = tags.filter((t) => t.name.includes('/'));
    const groups: Array<{ parent: Tag; children: Tag[] }> = parents.map((parent) => ({
      parent,
      children: children.filter((c) => c.name.startsWith(parent.name + '/')),
    }));
    const orphans = children.filter((c) => !parents.some((p) => c.name.startsWith(p.name + '/')));
    return { groups, orphans };
  }, [tags]);

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #codebook-print-root, #codebook-print-root * { visibility: visible; }
          #codebook-print-root { position: fixed; inset: 0; overflow: visible; }
          .no-print { display: none !important; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

      <div id="codebook-print-root" className="fixed inset-0 bg-white z-50 overflow-auto">

        {/* Toolbar */}
        <div className="no-print sticky top-0 bg-gray-900 text-white px-6 py-3 flex items-center justify-between shadow">
          <span className="font-semibold text-sm">Codebook — print preview</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
              </svg>
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Page content */}
        <div className="max-w-5xl mx-auto px-10 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Codebook</h1>
            <p className="text-sm text-gray-400 mt-1">{today} · {tags.length} code{tags.length !== 1 ? 's' : ''} · {snippets.length} snippet{snippets.length !== 1 ? 's' : ''}</p>
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 text-left">
                <th className="pb-2 pr-4 font-semibold text-gray-700 w-[22%]">Code</th>
                <th className="pb-2 pr-4 font-semibold text-gray-700 w-[30%]">Description</th>
                <th className="pb-2 pr-4 font-semibold text-gray-700 w-[24%]">Example</th>
                <th className="pb-2 font-semibold text-gray-700 w-[24%]">Non-example</th>
              </tr>
            </thead>
            <tbody>
              {grouped.groups.map(({ parent, children }) => (
                <React.Fragment key={parent.id}>
                  <ParentRow tag={parent} snippetCount={snippets.filter((s) => s.tagIds.includes(parent.id)).length} />
                  {children.map((child) => (
                    <ChildRow key={child.id} tag={child} allTags={tags} snippetCount={snippets.filter((s) => s.tagIds.includes(child.id)).length} />
                  ))}
                </React.Fragment>
              ))}
              {grouped.orphans.map((tag) => (
                <ChildRow key={tag.id} tag={tag} allTags={tags} snippetCount={snippets.filter((s) => s.tagIds.includes(tag.id)).length} />
              ))}
            </tbody>
          </table>

          {tags.length === 0 && (
            <p className="text-gray-400 text-sm mt-8 text-center">No codes in the codebook yet.</p>
          )}
        </div>
      </div>
    </>
  );
}

function ParentRow({ tag, snippetCount }: { tag: Tag; snippetCount: number }) {
  return (
    <tr className="border-b border-gray-200 align-top" style={{ backgroundColor: tag.color + '0d' }}>
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ backgroundColor: tag.color }} />
          <span className="font-semibold text-gray-900">{tag.name}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5 pl-5">{snippetCount} snippet{snippetCount !== 1 ? 's' : ''}</div>
      </td>
      <td className="py-3 pr-4 text-gray-700 leading-relaxed">{tag.description || <span className="text-gray-300">—</span>}</td>
      <td className="py-3 pr-4 text-gray-700 leading-relaxed">{tag.example || <span className="text-gray-300">—</span>}</td>
      <td className="py-3 text-gray-700 leading-relaxed">{tag.nonExample || <span className="text-gray-300">—</span>}</td>
    </tr>
  );
}

function ChildRow({ tag, allTags, snippetCount }: { tag: Tag; allTags: Tag[]; snippetCount: number }) {
  const color = getEffectiveColor(tag, allTags);
  return (
    <tr className="border-b border-gray-100 align-top">
      <td className="py-2.5 pr-4 pl-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5 opacity-70" style={{ backgroundColor: color }} />
          <span className="text-gray-700">{tag.name}</span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5 pl-[18px]">{snippetCount} snippet{snippetCount !== 1 ? 's' : ''}</div>
      </td>
      <td className="py-2.5 pr-4 text-gray-600 leading-relaxed">{tag.description || <span className="text-gray-300">—</span>}</td>
      <td className="py-2.5 pr-4 text-gray-600 leading-relaxed">{tag.example || <span className="text-gray-300">—</span>}</td>
      <td className="py-2.5 text-gray-600 leading-relaxed">{tag.nonExample || <span className="text-gray-300">—</span>}</td>
    </tr>
  );
}
