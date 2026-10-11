import { ref, shallowRef, type Ref, type ShallowRef } from 'vue'
import type { Movie } from '../types/movie'
import { createLibrarySource, LibraryError, type LibrarySource } from '../services/library'

export type LibraryStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface UseLibrary {
  /** Filesystem access used by the grid and the player. */
  source: LibrarySource
  movies: ShallowRef<Movie[]>
  /** Poster object URLs keyed by movie id. */
  posterUrls: Ref<Record<string, string>>
  status: Ref<LibraryStatus>
  error: Ref<string | null>
  /** Prompt for a folder and scan it. */
  selectFolder: () => Promise<void>
}

/**
 * Owns the library state: which movies are loaded, their poster URLs and the
 * status of the current load. Components stay presentation-only.
 */
export function useLibrary(): UseLibrary {
  const source = createLibrarySource()
  const movies = shallowRef<Movie[]>([])
  const posterUrls = ref<Record<string, string>>({})
  const status = ref<LibraryStatus>('idle')
  const error = ref<string | null>(null)

  async function selectFolder(): Promise<void> {
    status.value = 'loading'
    error.value = null

    try {
      const picked = await source.pickRoot()
      if (!picked) {
        status.value = movies.value.length > 0 ? 'ready' : 'idle'
        return
      }

      const scanned = await source.scanMovies()
      revokePosterUrls()
      movies.value = scanned
      posterUrls.value = await resolvePosterUrls(scanned)
      status.value = 'ready'
    } catch (caught) {
      status.value = 'error'
      error.value =
        caught instanceof LibraryError ? caught.message : 'Could not load the library.'
    }
  }

  async function resolvePosterUrls(list: Movie[]): Promise<Record<string, string>> {
    const entries = await Promise.all(
      list.map(async (movie) => {
        const url = await source.getPosterUrl(movie)
        return url === undefined ? null : ([movie.id, url] as const)
      }),
    )
    return Object.fromEntries(
      entries.filter((entry): entry is readonly [string, string] => entry !== null),
    )
  }

  function revokePosterUrls(): void {
    for (const url of Object.values(posterUrls.value)) URL.revokeObjectURL(url)
    posterUrls.value = {}
  }

  return { source, movies, posterUrls, status, error, selectFolder }
}
