# Architecture — Schriftsatzprüfung Word Add-in (local, single-user)

> **Status:** Slice A (engine analysis endpoint) built & tested in the engine repo.
> Slice B (add-in scaffold) is this repo. Slices C–D (live-document review, Office.js
> write-back) in progress.
> **Companion doc:** `review_ui_integration_plan.md` in the engine repo
> (`Litigation-submission-proofreading`) — the Option C local review window, a
> *different* delivery of the same engine.

---

## 1. What this is

A proofreading tool that lives **inside Microsoft Word** as an Office.js task-pane
add-in. The attorney opens a German legal brief (*Schriftsatz*), clicks a ribbon
button, and a docked pane runs five independent LLM "lenses" over the document,
shows the findings as review cards, and — on a click per finding — writes the
accepted change into *that* document as a native **tracked change**.

It is scoped to run **entirely on one machine, for one user**. That scoping is the
whole reason the add-in is viable here: it removes the cloud host, the app-store
distribution, and the shared key-proxy service that would otherwise make an
Office.js add-in a heavyweight commitment.

## 2. The three moving parts

```
┌─────────────────────────────────────┐   same-origin /api/*   ┌──────────────────────────┐
│  Word (desktop, Windows)             │  ───────────────────▶  │  Vite dev server         │
│  ┌────────────────────────────────┐ │                        │  https://localhost:3000  │
│  │ Task pane (webview)            │ │   proxy /api → :8000    │  (serves the pane UI)    │
│  │  • ported React review UI      │ │  ───────────────────▶  ├──────────────────────────┤
│  │  • Office.js: read text,       │ │                        │  Python analysis bridge  │
│  │    navigate, insert tracked    │ │   POST /api/run        │  http://localhost:8000   │
│  │    changes                     │ │   {paragraphs}         │  engine.serve_addin      │
│  └────────────────────────────────┘ │  ◀───────────────────  │  ingest_text→lenses→merge │
└─────────────────────────────────────┘   {findings:[…]}       │  (NO COM, NO write-back) │
                                                                └──────────────────────────┘
        THIS REPO (front-end)                                    ENGINE REPO (Python)
```

1. **The task pane** (this repo) — a web page (React + Vite + Tailwind) that Word
   renders in a docked webview. It is the ported *review-UI slice* of the earlier
   prototype: finding cards, accept/reject, lens filters, phase states, the
   brass/pilcrow design system. It talks to Word through **Office.js**
   (`Word.run`, `body.paragraphs`, `body.search`, `range.insertText`) and to the
   engine through `/api/*`.
2. **The Vite dev server** (`https://localhost:3000`) — serves the pane over HTTPS
   (required by Office) and **proxies `/api` to the Python bridge**. Because the
   pane only ever calls same-origin `/api/*`, there is no CORS or mixed-content
   problem: the browser talks only to `:3000`, and `:3000` talks to `:8000`
   server-to-server.
3. **The Python analysis bridge** (engine repo: `engine.serve_addin`,
   `http://localhost:8000`) — a **COM-free, stateless** FastAPI app. It reuses the
   existing engine wholesale: `ingest_text` → `orchestrate.run` (five parallel
   lenses) → deterministic `merge` → a list of `Finding` objects returned as JSON.

## 3. Data flow

**Analysis (pane → engine → pane).**
On *Prüfung starten*, the pane reads the open document's paragraphs via Office.js
and `POST`s them to `/api/run`. The bridge ingests that text into the engine's
`Document` model, fans the five lenses out concurrently, merges the results
(computing each finding's anchor and `anchorStatus`), and returns findings in the
exact camelCase shape the pane's `Suggestion` type already expects.

**Write-back (pane → Word, via Office.js only).**
Accepting findings does **not** call the server. When the attorney applies, the
pane turns on Word's Track Changes and, for each accepted finding, searches the
finding's paragraph for its verbatim `original` span and replaces it with the
`suggestion`. The result is a native Word tracked revision in the live document —
no file is written, nothing is round-tripped through Python.

## 4. Reused vs. new (and what stays untouched)

| Layer | Disposition |
|---|---|
| Analysis engine (`ingest` normalization, 5 lenses, `merge`, `Finding` schema) | **Reused wholesale** behind a new text-in endpoint (`ingest_text`, `serve_addin`) — engine repo. |
| Review UI (cards, accept/reject, filters, design tokens) | **Ported** from the prototype — the pane *slice* only (this repo). |
| Fake Word window + simulated document renderer (`WordChrome`, `DocumentView`) | **Dropped** — Word is real now and renders the document itself. |
| COM tracked-changes write-back (engine repo: `engine/writeback.py`, `serve.py`) | **Untouched.** The add-in writes via Office.js; the COM path is left exactly as-is for the separate Option C local review window. |
| Office.js glue (manifest, HTTPS/sideload, read text, navigate, insert tracked changes) | **New** (this repo). |

## 5. System characteristics

- **Local-only, single-user.** Nothing leaves the machine *except* the document
  text sent to the LLM provider (see §6 / the security issue). No cloud host, no
  AppSource/admin deployment (the add-in is *sideloaded* into the user's own Word),
  no shared backend.
- **Stateless bridge.** `serve_addin` holds no document between requests; each
  `/api/run` is self-contained. The prompt pack is loaded once at startup.
- **HTTPS on localhost.** Office requires the task pane to load over HTTPS; a
  self-signed, locally-trusted certificate (`office-addin-dev-certs`) provides it.
- **Secrets stay server-side.** The LLM API key (`ANTHROPIC_API_KEY`) lives only in
  the environment of the local Python process, never in the pane's client-side JS.
- **Provider-agnostic.** `claude` (default), `openai`, or the hermetic `fake`
  provider — selected by env/argument, swappable per request.
- **Windows-only (by design, for now).** The COM sibling is Windows-only anyway; the
  Office.js add-in *could* later run on Mac/Word-on-the-web, but the write-back's
  search/anchoring would need revalidation there.

## 6. Key behaviors worth knowing

- **Anchoring & the placeable/manual split.** `merge` marks each finding's
  `anchorStatus` as `unique` (one match — safely auto-placeable), `ambiguous`
  (multiple matches — a human must pick), or `none` (not found). The pane only
  auto-applies `unique` findings; `ambiguous`/`none` are shown as cards with a
  "*direkt in Word prüfen*" note. **The tool never guesses a location.**
- **Office.js Search limits.** Word's search matches up to ~255 characters. Short
  spelling/punctuation/grammar spans apply cleanly; a long consistency/citation
  span that exceeds the limit (or returns zero/multiple matches) is routed to the
  manual bucket rather than mis-applied. This is the main correctness guard.
- **Paragraph-index alignment.** The pane sends `body.paragraphs` in order and the
  engine indexes the same list, so a finding's `anchor.paraIndex` maps 1:1 back to a
  Word paragraph — used to scope both navigation and the write-back search.
- **Tracked-changes ingest bug is sidestepped.** Reading live text through Office.js
  bypasses the `python-docx` path that silently drops `<w:ins>/<w:del>` runs, so the
  add-in never proofreads a stale layer of a mid-revision document.
- **No separate undo snapshot.** Applied changes are Word tracked revisions; the
  revert path is Word's own (reject revision / undo). The add-in edits the open
  document in place (unlike the COM path, which writes a new `*.tracked.docx`). See
  the safety-net issue.

## 7. Where things live (two repositories)

**This repo — `Litigation-submission-proofreading-Word-Add-in`** (front-end add-in):

```
manifest.xml                   ← ribbon button, points at https://localhost:3000
index.html                     ← loads Office.js (CDN) + fonts, mounts React
src/                           ← ported React pane + Office.js glue
public/assets/                 ← ribbon-button icons
architecture_explanation.md    ← this document
```

**Engine repo — `Litigation-submission-proofreading`** (under `03_COM-engine/engine/`):

```
ingest.py         ← ingest() (docx) + ingest_text() (live text)   [ingest_text = new]
serve_addin.py    ← COM-free analysis bridge the add-in calls (POST /api/run)  [new]
orchestrate.py, lenses.py, merge.py, models.py   ← the reused engine
writeback.py, serve.py   ← COM write-back — UNTOUCHED
```

`04_Prototype/` (engine repo) was the source of the ported pane UI + design tokens.

## 8. Prerequisites to run

- Node on PATH (currently `v24.17.0`) for the pane; the engine repo's Python venv
  for the analysis bridge.
- In the engine repo: `Lens_Prompts_German.txt` present (git-ignored) and
  `ANTHROPIC_API_KEY` set in the bridge process's environment.
- Two local processes during development: the Vite dev server (this repo, the pane)
  and `python -m engine.serve_addin` (engine repo, analysis). A later slice folds
  these into one launcher.
