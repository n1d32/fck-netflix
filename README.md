# Localflix

A local, browser-based "Netflix" for movies stored on your own hard disk.
Browse your collection as a grid and watch films with subtitles — no backend,
no uploads, everything stays on your machine.

## Requirements

- **Node 20+** and npm.
- A **Chromium-based browser** (Chrome, Edge, Opera). The app reads folders
  from disk using the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API),
  which is not available in Firefox or Safari.
- Movies encoded so the browser can play them: **MP4 (H.264/AAC)** or
  **WebM**. Files such as MKV with H.265/HEVC or AC3 audio generally will not
  play in a plain browser. (A future native shell may lift this restriction.)

## Getting started

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
```

Other scripts:

```bash
npm run build      # type-check + production build into dist/
npm run preview    # preview the production build
npm run typecheck  # type-check only
npm run test       # run unit tests
```

When the app opens, click **Choose folder** and select the folder that
contains your movies. The browser will ask you to grant read access; the
selection is not persisted across reloads yet.

## Library layout

The library **is** your folder structure. Each film lives in its own folder,
together with its subtitles (and optionally a poster):

```
Movies/
├── Blade Runner (1982)/
│   ├── movie.toml            # optional metadata (recommended)
│   ├── Blade Runner.mkv      # the video file
│   ├── poster.jpg            # optional poster
│   ├── Blade Runner.en.srt   # subtitle files (auto-detected)
│   └── Blade Runner.es.srt
└── Arrival/
    └── Arrival.mp4           # no movie.toml → title falls back to folder name
```

### How metadata is resolved

1. If the folder contains a `movie.toml`, its values are authoritative.
2. Otherwise, the **folder name** is used as the title.

The video file, subtitle files and poster are auto-detected by file
extension. They can be overridden explicitly in `movie.toml`.

### `movie.toml` format

```toml
title = "Blade Runner"
year = 1982
genres = ["Sci-Fi", "Thriller"]
description = "A blade runner must pursue and terminate four replicants..."

# Optional explicit overrides (auto-detected when omitted):
video  = "Blade Runner (1982).mp4"
poster = "poster.jpg"

# Optional explicit subtitle list (auto-detected when omitted):
subtitles = [
  { file = "Blade Runner.en.srt", label = "English", default = true },
  { file = "Blade Runner.es.srt", label = "Español" },
]
```

## Project structure

```
src/
├── App.vue                  # application shell
├── components/              # presentation components
├── composables/             # reusable reactive state
├── services/                # data access & business logic
│   └── library/             # filesystem access, behind an interface
├── types/                   # shared TypeScript types
├── utils/                   # small pure helpers
└── main.ts
```
