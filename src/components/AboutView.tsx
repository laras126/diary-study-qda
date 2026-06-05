import React from 'react';

export function AboutView() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">About</h2>
        <p className="text-gray-500 text-sm mt-1">Qualitative data analysis for your LLM diary study.</p>
      </div>

      {/* What is this? */}
      <div className="bg-white rounded-2xl border border-gray-200 p-7">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">What is this?</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          This is a qualitative data analysis tool for the{' '}
          <a href="https://laras126.github.io/cog-sci-and-llms/assignments/diary-study/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Diary Study
          </a>{' '}
          assignment in{' '}
          <a href="https://laras126.github.io/cog-sci-and-llms/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Cognitive Science &amp; LLMs
          </a>.
          It is built and maintained by{' '}
          <a href="https://larakarki.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            Lara Karki
          </a>.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed mb-3">
          The goal of the diary study is to collect qualitative data to better understand your own LLM use — finding themes around what use cases are successful or frustrating, and building a habit of reflection. Over weeks 1–5 you record a short entry at the <strong>start</strong> and <strong>end</strong> of each workday:
        </p>
        <div className="space-y-2 mb-3">
          <div className="flex gap-3 text-sm">
            <span className="shrink-0 font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-xs mt-0.5">AM</span>
            <p className="text-gray-600 italic">"Think about your tasks coming up today. How do you think you will use LLMs?"</p>
          </div>
          <div className="flex gap-3 text-sm">
            <span className="shrink-0 font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded text-xs mt-0.5">PM</span>
            <p className="text-gray-600 italic">"How did you use LLMs today? Were there any moments that stood out — successful usage, or frustrating usage?"</p>
          </div>
        </div>
        <p className="text-gray-500 text-xs">
          Entries range from a sentence to ~150 words. Missing a day is fine — you can mark a PM entry as belonging to the previous day during data cleaning.
        </p>
      </div>

      {/* Getting started */}
      <div className="bg-white rounded-2xl border border-gray-200 p-7">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Getting started</h3>
        <ol className="space-y-3">
          {[
            'Export your MS Forms (or Google Forms) responses as a CSV.',
            'Click Import and upload the CSV. The tool will detect the AM and PM columns automatically.',
            'Use the Clean view to fix any entries submitted on the wrong day.',
            'Open the Coding view, select an entry, highlight a phrase, and assign it a tag to start building your codebook.',
            'Use the Analysis view to browse all snippets by tag and look for patterns across entries.',
          ].map((text, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-600">
              <span className="shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-semibold flex items-center justify-center text-xs">
                {i + 1}
              </span>
              <span className="leading-relaxed">{text}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Data & privacy */}
      <div className="bg-white rounded-2xl border border-gray-200 p-7">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Data &amp; privacy</h3>
        <p className="text-gray-600 text-sm leading-relaxed mb-2">
          All data is stored entirely in <strong>your browser's IndexedDB</strong> — nothing is sent to a server. Your entries and coded snippets are private to you on this device and browser.
        </p>
        <p className="text-gray-600 text-sm leading-relaxed">
          Use the <strong>Export</strong> button (top right) regularly to download a backup. Clearing your browser data will erase everything.
        </p>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-3 text-sm">
        <a href="https://github.com/laras126/diary-study-qda" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
          </svg>
          View source on GitHub
        </a>
        <span className="text-gray-300">·</span>
        <a href="https://larakarki.com" target="_blank" rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-800 transition-colors">
          larakarki.com
        </a>
        <span className="text-gray-300">·</span>
        <a href="https://laras126.github.io/cog-sci-and-llms/" target="_blank" rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-800 transition-colors">
          Cognitive Science &amp; LLMs
        </a>
      </div>
    </div>
  );
}
