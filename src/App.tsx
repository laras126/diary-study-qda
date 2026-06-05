import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { HomeView } from './components/HomeView';
import { AboutView } from './components/AboutView';
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
  { id: 'about', label: 'About' },
];

const VALID_VIEWS: ViewType[] = ['home', 'import', 'clean', 'code', 'tags', 'analysis', 'about'];

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
            Diary Study QDA
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

        <div className="flex items-center gap-3">
          <div className="hidden md:flex gap-4 text-xs text-white/60">
            <span>{entries.length} entries</span>
            <span>{tags.length} tags</span>
            <span>{snippets.length} snippets</span>
          </div>
          {/* GitHub link */}
          <a
            href="https://github.com/laras126/diary-study-qda"
            target="_blank"
            rel="noopener noreferrer"
            title="View source on GitHub"
            className="text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
          {/* Creator link */}
          <a
            href="https://larakarki.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Made by Lara Karki"
            className="text-xs text-white/60 hover:text-white transition-colors hidden sm:block"
          >
            larakarki.com
          </a>
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
        {currentView === 'about' && <AboutView />}
      </main>
    </div>
  );
}
