# System Patterns

## Architecture

```
App.vue
  └─ useLibrary()  ─────────────►  createLibrarySource()
        │                                 │
        │  state: movies, posterUrls,     └─ browserLibrarySource (File System Access API)
        │         status, error               └─ metadataLoader (pure)
        │                                          ├─ utils/fileName
        ├─ LibraryView ─ MovieGrid ─ MovieCard     └─ utils/mediaTypes
        └─ <dialog> MoviePlayer ─ subtitleService (pure)
```

### Layers
- **Presentation** (`components/*.vue`): dumb; props in, events out.
- **State** (`composables/useLibrary.ts`): owns library state, orchestrates the
  source, resolves poster object URLs.
- **Data access** (`services/library/*`): the `LibrarySource` interface plus its
  browser implementation. This is the seam for a future native backend.
- **Domain logic** (`services/metadataLoader.ts`, `services/subtitleService.ts`,
  `utils/*`): pure, unit-tested, no DOM or filesystem dependencies.

## Key decisions
- `LibrarySource` hides all file handles and object URLs. Components only ever
  see plain `Movie` data plus URLs fetched through the source.
- A `MovieFolderScan` (file names found on disk) is passed to the pure
  `createMovieFromFolder`, which merges `movie.toml` → detected files → folder
  name, and collects `warnings` instead of throwing.
- Subtitles are converted SRT → WebVTT in memory and exposed as blob URLs.
- Object URLs are cached per movie inside the source and revoked on `dispose()`
  or re-scan. The player owns its extra subtitle URLs and revokes them on unmount.
- `verbatimModuleSyntax` is on, so type-only imports must use `import type`.

## Critical paths
- **Scan:** `useLibrary.selectFolder` → `source.pickRoot` → `source.scanMovies`
  (per subfolder: read entries, classify by extension, read `movie.toml`) →
  resolve poster URLs.
- **Play:** `MoviePlayer` → `source.getVideoUrl` (object URL) → `<video>`;
  subtitles → `source.readSubtitle` → `subtitleService.createVttBlobUrl` →
  `<track>`; the active track is toggled by index via `video.textTracks`.
- **Open:** the grid stays mounted and the player is a modal `<dialog>` shown
  with `showModal()` (focus trap, Escape-to-close and the backdrop come from the
  element itself). The video is rendered before playback starts, so the default
  subtitle track is already enabled when `play()` is called.
- **Fullscreen:** the target is `.player__shell`, an inner wrapper holding the
  film and the controls — never the `<dialog>` itself, which is already in the
  top layer and cannot reliably be moved into the fullscreen top layer. Inside
  the shell, `.player__viewport` is the positioning context (the fullscreen
  element must keep the browser's own `position: fixed`): in fullscreen the film
  takes the whole screen and the bar is overlaid at the bottom. The chrome
  auto-hides after 3 s of idle while playing (`--idle` class → fade, slide down,
  `pointer-events: none`, hidden cursor) and comes back on mouse move, pointer
  tap or key press; it never hides while paused or while the pointer/focus is on
  it. The windowed dialog keeps its bar pinned. Escape exits fullscreen first
  (browser behaviour), a second Escape closes the dialog.
