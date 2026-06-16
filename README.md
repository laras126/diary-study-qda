# Diary Study QDA

![Tests](https://github.com/laras126/diary-study-qda/actions/workflows/test.yml/badge.svg) ![Deploy](https://github.com/laras126/diary-study-qda/actions/workflows/deploy.yml/badge.svg)

A browser-based qualitative data analysis tool for the [Diary Study](https://laras126.github.io/cog-sci-and-llms/assignments/diary-study/) assignment in [Cognitive Science & LLMs](https://laras126.github.io/cog-sci-and-llms/). Built and maintained by [Lara Karki](https://larakarki.com).

All data is stored in your browser's **IndexedDB** — nothing is sent to a server.

> This app was created entirely with [Claude Code](https://claude.ai/claude-code), as directed by Lara Karki.

---

## Using the app

**The app is deployed at:** `https://laras126.github.io/diary-study-qda/`

No installation needed. Open the link in your browser and follow the on-screen instructions to get started.

### Getting started

1. Export your MS Forms (or Google Forms) diary study responses as a CSV
2. Go to **Import** and upload the file — the tool auto-detects the `AM:` and `PM:` columns
3. Use **Clean** to fix any entries submitted on the wrong day
4. Go to **Coding**, select an entry, highlight a phrase, and assign a code to start building your codebook
5. Use **Analysis** to browse snippets by code and find patterns across entries

### CSV format

The app expects a CSV with these column headers (standard MS Forms export):

| Column | Notes |
|--------|-------|
| `Id` | Row identifier |
| `Start time` | When the form was opened |
| `Completion time` | Used to determine the entry date |
| `Email` | Ignored |
| `Name` | Ignored |
| `AM: Think about your tasks coming up today…` | Must start with `AM:` |
| `PM: How did you use LLMs today?…` | Must start with `PM:` |

Each row can have an AM response, a PM response, or both. Empty cells are skipped.

You can also re-import a previously exported JSON backup to restore your work.

### Views

| View | What it does |
|------|-------------|
| **Home** | Project dashboard — stats, code breakdown, resume card, uncoded entries list |
| **Import** | Upload a CSV or a JSON backup; preview before committing; append or replace existing data |
| **Clean** | Fix entry dates — days with a missing AM or PM are flagged; drag entries to the correct day |
| **Coding** | Highlight text and assign codes to create snippets. Supports child codes, overlapping highlights, notes on snippets, Backspace to delete, ‹ › to navigate, and a search bar |
| **Codebook** | Create, rename (propagates to all snippets), and delete codes. Add a description, example, and non-example to document your coding scheme. Rename a code to an existing one to merge them. Print or save the codebook as a PDF |
| **Analysis** | Filter snippets by one or more codes (Any / All); expand the full entry to read a snippet in context; jump directly to the Coding view with the snippet highlighted; edit codes or add notes without leaving the view; side-by-side AM/PM comparison panel |

### Exporting your data

The **Export backup** button (top right) downloads a single JSON file containing all entries, codes, and snippets. You can re-import this file at any time to restore your work.

Export regularly — clearing your browser data will erase everything. The app will also remind you after 30 minutes of inactivity or after a significant number of unsaved changes.

---

## Contributing

### Requirements

**Node.js 18 or later** — check with `node --version`.  
If you use [nvm](https://github.com/nvm-sh/nvm): `nvm use 22`

### Local development

```bash
git clone https://github.com/laras126/diary-study-qda.git
cd diary-study-qda
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Running tests

```bash
npm run test:run   # single pass
npm test           # watch mode
```

### Deploying

Pushes to `main` automatically build and deploy to GitHub Pages via the workflow in `.github/workflows/deploy.yml`. Tests must pass before the deploy runs.

To deploy to a different Pages URL, update `GITHUB_PAGES_BASE` in the workflow file to match your repo name.

```bash
npm run build      # output goes to dist/
```
