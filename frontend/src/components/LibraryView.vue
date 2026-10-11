<script setup lang="ts">
import type { Movie } from '../types/movie'
import type { LibraryStatus } from '../composables/useLibrary'
import MovieGrid from './MovieGrid.vue'

defineProps<{
  movies: Movie[]
  posterUrls: Record<string, string>
  status: LibraryStatus
  error: string | null
  supported: boolean
}>()

const emit = defineEmits<{
  choose: []
  select: [movie: Movie]
}>()
</script>

<template>
  <section class="library">
    <header class="library__header">
      <h1 class="library__title">Localflix</h1>
      <button
        v-if="supported"
        type="button"
        class="library__choose"
        :disabled="status === 'loading'"
        @click="emit('choose')"
      >
        {{ movies.length > 0 ? 'Change folder' : 'Choose folder' }}
      </button>
    </header>

    <p v-if="!supported" class="library__message library__message--error" role="alert">
      This browser cannot read local folders. Please use a Chromium-based browser
      (Chrome, Edge or Opera).
    </p>

    <p v-else-if="status === 'loading'" class="library__message">Reading your library…</p>

    <p v-else-if="status === 'error'" class="library__message library__message--error" role="alert">
      {{ error }}
    </p>

    <p v-else-if="status === 'idle'" class="library__message">
      Choose the folder that contains your movies to get started.
    </p>

    <p v-else-if="movies.length === 0" class="library__message">
      No movies were found. Each movie must be in its own subfolder with a video file
      inside.
    </p>

    <MovieGrid
      v-else
      :movies="movies"
      :poster-urls="posterUrls"
      @select="emit('select', $event)"
    />
  </section>
</template>

<style scoped>
.library {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.library__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.library__title {
  font-size: 24px;
  margin: 0;
}

.library__choose {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius);
  background: var(--color-accent);
  color: #fff;
  font-weight: 500;
}

.library__choose:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.library__choose:disabled {
  opacity: 0.6;
  cursor: default;
}

.library__message {
  color: var(--color-text-muted);
  padding: 48px 0;
  text-align: center;
}

.library__message--error {
  color: #f5a623;
}
</style>
