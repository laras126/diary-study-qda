import React, { useEffect, useRef, useState } from 'react';
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
  { id: 'tags', label: 'Codebook' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'about', label: 'About' },
];

const VALID_VIEWS: ViewType[] = ['home', 'import', 'clean', 'code', 'tags', 'analysis', 'about'];

function viewFromHash(): ViewType | null {
  const slug = window.location.hash.replace(/^#\//, '');
  return VALID_VIEWS.includes(slug as ViewType) ? (slug as ViewType) : null;
}

const LS_LAST_EXPORT = 'diary-qual-last-export';
const LS_SEEN_NOTICE = 'diary-qual-seen-notice';
const SESSION_START = Date.now();
const IDLE_MS = 30 * 60 * 1000; // 30 minutes
const CHANGE_THRESHOLD = 20;

function formatLastExported(iso: string | null): string {
  if (!iso) return 'never';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function App() {
  const { currentView, setCurrentView, entries, tags, snippets } = useStore();

  const [lastExported, setLastExported] = useState<string | null>(
    () => localStorage.getItem(LS_LAST_EXPORT)
  );
  const [showBanner, setShowBanner] = useState(
    () => !localStorage.getItem(LS_SEEN_NOTICE)
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showIdleBanner, setShowIdleBanner] = useState(false);

  const handleExport = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LS_LAST_EXPORT, now);
    setLastExported(now);
    setShowIdleBanner(false);
  };

  const dismissBanner = () => {
    localStorage.setItem(LS_SEEN_NOTICE, '1');
    setShowBanner(false);
  };

  // Request persistent storage so the browser won't evict IndexedDB under pressure.
  useEffect(() => { navigator.storage?.persist?.(); }, []);

  // Show a backup reminder after 30 minutes of inactivity (only when data exists).
  useEffect(() => {
    if (!entries.length) return;
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setShowIdleBanner(true), IDLE_MS);
    };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [entries.length]);

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

  const navigate = (view: ViewType) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 bg-gray-900 text-white px-5 h-12 flex items-center justify-between relative z-40">
        <div className="flex items-center gap-5">
          <button
            onClick={() => navigate('home')}
            className="text-sm font-bold tracking-widest text-white/70 uppercase hover:text-white transition-colors"
          >
            Diary Study QDA
          </button>
          {/* Desktop nav */}
          <nav className="hidden md:flex gap-0.5">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.id)}
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
          <div className="hidden xl:flex gap-4 text-xs text-white/60">
            <span>{entries.length} entries</span>
            <span>{tags.length} codes</span>
            <span>{snippets.length} snippets</span>
            <span className={lastExported && new Date(lastExported).getTime() >= SESSION_START ? 'text-white/60' : 'text-amber-400'}>
              last backup: {formatLastExported(lastExported)}
            </span>
          </div>
          {/* GitHub link */}
          <a
            href="https://github.com/laras126/diary-study-qda"
            target="_blank"
            rel="noopener noreferrer"
            title="View source on GitHub"
            className="text-white/60 hover:text-white transition-colors hidden xl:block"
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
            className="text-xs text-white/60 hover:text-white transition-colors hidden lg:block"
          >
            larakarki.com
          </a>
          <div className="hidden md:flex">
            <ExportButton onExport={handleExport} />
          </div>
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 text-white/70 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <span className={`block w-5 h-0.5 bg-current transition-transform origin-center ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block w-5 h-0.5 bg-current transition-opacity ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block w-5 h-0.5 bg-current transition-transform origin-center ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>
      </header>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative z-40 md:hidden bg-gray-900 border-t border-white/10 shadow-xl">
            <nav className="flex flex-col py-2">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  className={`px-5 py-3 text-sm text-left transition-colors ${
                    currentView === item.id
                      ? 'bg-white/20 text-white font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between">
              <div className="flex gap-3 text-xs text-white/50">
                <span>{entries.length} entries</span>
                <span>{tags.length} codes</span>
                <span>{snippets.length} snippets</span>
              </div>
              <ExportButton onExport={handleExport} />
            </div>
            <div className="px-5 pb-3 text-xs">
              <span className={lastExported && new Date(lastExported).getTime() >= SESSION_START ? 'text-white/40' : 'text-amber-400'}>
                last backup: {formatLastExported(lastExported)}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Idle backup reminder */}
      {showIdleBanner && !showBanner && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between gap-4 text-sm">
          <p className="text-amber-800">
            You've been inactive for 30 minutes — consider downloading a backup so your work is safe.
          </p>
          <div className="flex items-center gap-3 shrink-0">
            <ExportButton onExport={handleExport} />
            <button onClick={() => setShowIdleBanner(false)} className="text-amber-700 hover:text-amber-900 font-medium">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Backup notice banner */}
      {showBanner && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between gap-4 text-sm">
          <p className="text-amber-800">
            Your data is stored in this browser only and may be lost if browser storage is cleared.{' '}
            Use the <strong>Export</strong> button to download a backup and keep it safe.
          </p>
          <button
            onClick={dismissBanner}
            className="shrink-0 text-amber-700 hover:text-amber-900 font-medium"
          >
            Got it
          </button>
        </div>
      )}

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
