# Project Brief — Localflix

## Purpose
A local "personal Netflix": point the app at a folder of movies on the machine
and browse/play them with subtitles. No server, no uploads, everything stays on
the user's disk.

## Scope (current)
- Vue 3 + Vite + TypeScript SPA in `frontend/`.
- Reads the library from disk via the File System Access API.
- Per-movie metadata from a `movie.toml` inside each movie folder, falling back
  to the folder name.
- Playback via `<video>` with subtitle support (SRT converted to WebVTT).
- Architected so a native shell (Tauri/Electron) can replace the storage backend
  later without touching the UI.

## Out of scope (for now)
- Persisting the chosen folder across reloads (IndexedDB handles).
- Transcoding / playing codecs the browser cannot decode (MKV/HEVC/AC3).
- Remote sources, user accounts, multi-device sync.

## Repository layout
- `frontend/` — the SPA.
- `memory-bank/` — project documentation (this folder).
- `.clinerules/` — working agreements for the agent.
