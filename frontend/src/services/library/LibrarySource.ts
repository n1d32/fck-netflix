import type { Movie, SubtitleTrack } from '../../types/movie'

/** Raised when a library operation cannot be completed. */
export class LibraryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LibraryError'
  }
}

/**
 * Abstraction over the storage that holds the movie library.
 *
 * The browser implementation uses the File System Access API. A future native
 * (Tauri/Electron) implementation can satisfy the same contract without the UI
 * changing.
 */
export interface LibrarySource {
  /** Whether the runtime can read local folders at all. */
  readonly isSupported: boolean
  /**
   * Ask the user to select the library root folder.
   *
   * @returns `true` when a folder was chosen, `false` when the user cancelled.
   */
  pickRoot(): Promise<boolean>
  /** Read every movie folder under the selected root, sorted by title. */
  scanMovies(): Promise<Movie[]>
  /** Object URL for a movie's poster, or `undefined` when it has none. */
  getPosterUrl(movie: Movie): Promise<string | undefined>
  /** Object URL for a movie's video, or `undefined` when it has none. */
  getVideoUrl(movie: Movie): Promise<string | undefined>
  /** Read the raw text contents of a subtitle file. */
  readSubtitle(movie: Movie, subtitle: SubtitleTrack): Promise<string>
  /** Release cached handles and revoke any object URLs created so far. */
  dispose(): void
}
