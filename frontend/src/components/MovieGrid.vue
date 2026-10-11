<script setup lang="ts">
import type { Movie } from '../types/movie'
import MovieCard from './MovieCard.vue'

defineProps<{
  movies: Movie[]
  posterUrls: Record<string, string>
}>()

const emit = defineEmits<{
  select: [movie: Movie]
}>()
</script>

<template>
  <ul class="grid">
    <li v-for="movie in movies" :key="movie.id">
      <MovieCard
        :movie="movie"
        :poster-url="posterUrls[movie.id]"
        @select="emit('select', $event)"
      />
    </li>
  </ul>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
