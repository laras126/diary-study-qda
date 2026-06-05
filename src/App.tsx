import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { HomeView } from './components/HomeView';
import { ImportView } from './components/ImportView';
import { DataCleanView } from './components/DataCleanView';
import { CodingView } from './components/CodingView';
import { TagManagerView } from './components/TagManagerView';
import { AnalysisView } from './components/AnalysisView';
import { ExportButton } from './components/ExportButton';
import { ViewType } from './types';

const NAV: { id: ViewType; label: string }[] = [
  { id: 'import', label: 'Import' },
  { id: 'clean', label: 'Clean' },
  { id: 'code', label: 'Coding' },
  { id: 'tags', label: 'Tags' },
  { id: 'analysis', label: 'Analysis' },
];

const VALID_VIEWS: ViewType[] = ['home', 'import', 'clean', 'code', 'tags', 'analysis'];

function viewFromHash(): ViewType | null {
  const slug = window.location.hash.replace(/^#\//, '');
  return VALID_VIEWS.includes(slug as ViewType) ? (slug as ViewType) : null;
}

export default function App() {
  const { currentView, setCurrentView, entries, tags, snippets } = useStore();

  // On first load: if there's a valid hash, honour it; otherwise stamp the current view into the hash.
  useEffect(() => {
    const fromHash = viewFromHash();
    if (fromHash && fromHash !== currentView) {
      // Navigate to the hashed view without triggering another hash write
      useStore.setState({ currentView: fromHash });
    } else if (!fromHash) {
      window.location.hash = `#/${currentView}`;
    }
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for browser back / forward.
  useEffect(() => {
    const handler = () => {
      const view = viewFromHash();
      if (view && view !== useStore.getState().currentView) {
        // Update store without pushing another history entry.
        useStore.setState({ currentView: view });
      }
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 bg-gray-900 text-white px-5 h-12 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setCurrentView('home')}
            className="text-sm font-bold tracking-widest text-white/70 uppercase hover:text-white transition-colors"
          >
            Diary Study Studio
          </button>
          <nav className="flex gap-0.5">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  currentView === item.id
                    ? 'bg-white/20 text-white font-medium'
                    : 'text-white/50 hover:text-white hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-4 text-xs text-white/30">
            <span>{entries.length} entries</span>
            <span>{tags.length} tags</span>
            <span>{snippets.length} snippets</span>
          </div>
          <ExportButton />
        </div>
      </header>

      {/* Content */}
      <main className={`flex-1 min-h-0 ${currentView === 'code' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {currentView === 'home' && <HomeView />}
        {currentView === 'import' && <ImportView />}
        {currentView === 'clean' && <DataCleanView />}
        {currentView === 'code' && <CodingView />}
        {currentView === 'tags' && <TagManagerView />}
        {currentView === 'analysis' && <AnalysisView />}
      </main>
    </div>
  );
}
