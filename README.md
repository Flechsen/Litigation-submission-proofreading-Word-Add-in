# Litigation-submission-proofreading — Word Add-in

An Office.js **Word task-pane add-in** that proofreads German legal briefs
(*Schriftsätze*) in place: it runs five parallel LLM "lenses" over the open
document and lets the attorney accept/reject each suggestion, writing the
accepted ones back as native Word **tracked changes** — all locally, single-user.

This repo is the **front-end add-in only**. The analysis engine (ingest → parallel
lenses → deterministic merge) and the COM write-back live in the separate engine
repo (**`Litigation-submission-proofreading`**); the add-in calls that engine's
local analysis bridge over `http://localhost:8000`. See
[`architecture_explanation.md`](architecture_explanation.md).

## Prerequisites

- Node (tested with v24.17.0) and npm.
- The engine repo checked out, with its add-in bridge running **from inside
  `03_COM-engine`** (so the relative prompt-pack path resolves) — or pass
  `--prompt-pack <path>`:
  `python -m engine.serve_addin --port 8000`. Needs `ANTHROPIC_API_KEY` in its env,
  or run with `--provider fake` for a keyless smoke test.

## First-time setup

```bash
npm install
npm run cert     # install the locally-trusted HTTPS dev certificate (one time)
```

## Run (development)

```bash
npm run dev      # serves the pane at https://localhost:3000, proxies /api → :8000
```

Then sideload the add-in into Word (single user, Windows desktop):

1. Word → **File → Options → Trust Center → Trust Center Settings → Trusted Add-in Catalogs**.
2. Add **this folder's path** as a catalog URL, tick **Show in Menu**, OK, then restart Word.
3. **Insert → My Add-ins → Shared Folder → Schriftsatzprüfung**.

The **Schriftsatzprüfung** button then appears on the **Home** ribbon tab.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server (HTTPS on :3000, proxies `/api` to the engine bridge on :8000). |
| `npm run build` | Type-check (`tsc --noEmit`) + production build to `dist/`. |
| `npm run cert` | Install the Office HTTPS development certificate. |

## Status

Scaffold (Slice B): the add-in loads in Word and shows the pane shell. The review
workflow (Slice C — read the live document, show real findings) and the Office.js
tracked-changes write-back (Slice D) are in progress. See the issues.
