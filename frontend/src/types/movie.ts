/** Where a movie's metadata was resolved from. */
export type MetadataSource = 'toml' | 'folder-name'

/** A subtitle available for a movie, resolved within the movie's folder. */
export interface SubtitleTrack {
  /** File name inside the movie folder. */
  fileName: string
  /** Human-readable label shown in the subtitle menu. */
  label: string
  /** Whether the track should be enabled automatically on playback. */
  isDefault: boolean
}

/** A movie in the library, described independently of the filesystem. */
export interface Movie {
  /** Stable identifier, unique within the selected root folder. */
  id: string
  /** Name of the folder the movie lives in. */
  folderName: string
  title: string
  year?: number
  genres: string[]
  description?: string
  /** File name of the poster image, when one was found. */
  posterFileName?: string
  /** File name of the video, when one was found. */
  videoFileName?: string
  subtitles: SubtitleTrack[]
  metadataSource: MetadataSource
  /** Non-fatal problems found while reading the folder (e.g. invalid TOML). */
  warnings: string[]
}
