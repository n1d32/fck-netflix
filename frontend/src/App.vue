<script setup lang="ts">
import { ref } from 'vue'
import LibraryView from './components/LibraryView.vue'
import MoviePlayer from './components/MoviePlayer.vue'
import type { Movie } from './types/movie'
import { useLibrary } from './composables/useLibrary'

const { source, movies, posterUrls, status, error, selectFolder } = useLibrary()
const selectedMovie = ref<Movie | null>(null)
</script>

<template>
  <LibraryView
    :movies="movies"
    :poster-urls="posterUrls"
    :status="status"
    :error="error"
    :supported="source.isSupported"
    @choose="selectFolder"
    @select="selectedMovie = $event"
  />
  <MoviePlayer
    v-if="selectedMovie"
    :movie="selectedMovie"
    :source="source"
    @close="selectedMovie = null"
  />
</template>
