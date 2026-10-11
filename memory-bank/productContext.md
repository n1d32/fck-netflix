# Product Context

## Why
Personal media collections live on disks in folders, but existing players are
either heavyweight or not "browse-like". This project gives a streaming-style
browsing and playback experience for a local folder.

## Problems solved
- No import/copy step: the app reads the folder in place.
- Metadata lives next to the media (`movie.toml`), so it travels with backups.
- Zero backend: everything runs in the browser.

## How it should work
1. The user clicks **Choose folder** and picks the root movies folder.
2. Each immediate subfolder is treated as one movie. The app scans for the
   video, poster and subtitle files by extension, reads `movie.toml` if present,
   and falls back to the folder name for the title.
3. Movies appear as a poster grid; clicking one opens the player.
4. The player plays the video and offers subtitle selection plus adding an
   external `.srt`/`.vtt` file.

## UX goals
- Minimal, dark, Netflix-like but not fancy.
- Every data-driven view handles loading, empty and error states.
- Accessibility: keyboard-operable controls, labels/aria on inputs.
- Clear, non-blocking messages for unreadable or missing files.

## Honest limitations
- Chromium-only (File System Access API); Firefox/Safari cannot read folders.
- Only codecs the browser can decode play (MP4/H.264/AAC, WebM). MKV/HEVC/AC3
  typically do not — the main driver for a native shell later.
