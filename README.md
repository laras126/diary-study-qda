# Diary Study Studio
![Tests](https://github.com/<your-username>/<your-repo>/actions/workflows/test.yml/badge.svg)

A local, browser-based tool for qualitative coding of diary study data. Import a CSV, clean dates, tag and annotate text snippets, and export your coded data.

All data is stored in your browser's **IndexedDB** — nothing is sent to a server. If you have existing data from a previous version that used `localStorage`, it is migrated automatically on first load.

**Note:** This was created entirely with [Claude Code](https://claude.ai/claude-code).

---

## Requirements

- **Node.js 18 or later** — check with `node --version`  
  If you have [nvm](https://github.com/nvm-sh/nvm), run `nvm use 18` (or higher).

---

## Setup

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd diary-qual-tool

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## CSV format

The app expects a CSV exported from Microsoft Forms (or a compatible tool) with these column headers:

| Column | Description |
|--------|-------------|
| `Id` | Row identifier |
| `Start time` | When the form was opened |
| `Completion time` | When the form was submitted — used to determine the entry date |
| `Email` | Ignored on import |
| `Name` | Ignored on import |
| `AM: Think about your tasks coming up today…` | Morning reflection (column must start with `AM:`) |
| `PM: How did you use LLMs today?…` | Evening reflection (column must start with `PM:`) |

Each row can contain an AM response, a PM response, or both. Rows with empty AM/PM cells are skipped for that type.

---

## Views

### Home
Project dashboard — stats at a glance, tag breakdown with frequency bars, "resume where you left off" card, and a list of uncoded entries.

### Import
Drag-and-drop or browse for a CSV file. Preview parsed entries before committing. You can append to existing data or replace it.

### Clean
Entries are grouped by date in AM/PM columns. Days with a missing AM or PM are flagged in orange. Use the date controls to reassign entries that were submitted on the wrong day (e.g. a PM entry submitted the morning of the next day).

### Coding
Select text within any entry and assign a tag to create a **snippet**. Supports overlapping highlights — each overlap zone shows a striped multi-colour underline. Click an overlap to see a picker listing all snippets at that position.

- **Backspace / Delete** removes the focused snippet
- **‹ ›** arrows navigate between entries in order
- The **search bar** in the sidebar filters entries and highlights matches in the text

Each snippet can have a free-text annotation added below it.

### Tags
Create and rename qualitative codes. Renaming a tag updates every snippet automatically. Click a tag name to jump to all its snippets in Analysis.

### Analysis
Browse all snippets filtered by one or more tags (Any / All match modes). Click "View in context →" to jump to the source entry in Coding.

---

## Export

The **Export** button (top right, always visible) lets you download:

| File | Contents |
|------|----------|
| `entries_DATE.csv` | All entries with assigned dates and metadata |
| `snippets_DATE.csv` | All snippets with tag names, text, offsets, and annotations |
| `tags_DATE.csv` | Tag definitions with snippet counts |
| `full_export_DATE.json` | Everything in a single JSON file |

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve it with any static file host — the app has no backend.
