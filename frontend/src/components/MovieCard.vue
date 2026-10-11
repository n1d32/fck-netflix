<script setup lang="ts">
import type { Movie } from '../types/movie'

const props = defineProps<{
  movie: Movie
  posterUrl?: string
}>()

const emit = defineEmits<{
  select: [movie: Movie]
}>()
</script>

<template>
  <button type="button" class="card" @click="emit('select', props.movie)">
    <span class="card__poster">
      <img v-if="posterUrl" :src="posterUrl" :alt="`${movie.title} poster`" />
      <span v-else class="card__placeholder" aria-hidden="true">
        {{ movie.title.charAt(0).toUpperCase() }}
      </span>
    </span>
    <span class="card__meta">
      <span class="card__title">{{ movie.title }}</span>
      <span v-if="movie.year" class="card__year">{{ movie.year }}</span>
      <span
        v-if="movie.warnings.length"
        class="card__warning"
        role="img"
        aria-label="Metadata warning"
        :title="movie.warnings.join('\n')"
        >⚠</span
      >
    </span>
  </button>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  overflow: hidden;
  text-align: left;
  transition: transform 0.15s ease, background 0.15s ease;
}

.card:hover,
.card:focus-visible {
  background: var(--color-surface-hover);
  transform: translateY(-2px);
  outline: none;
}

.card:focus-visible {
  border-color: var(--color-accent);
}

.card__poster {
  display: grid;
  place-items: center;
  aspect-ratio: 2 / 3;
  background: #000;
}

.card__poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card__placeholder {
  font-size: 48px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.card__meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 10px;
}

.card__title {
  flex: 1;
  font-size: 15px;
  font-weight: 500;
}

.card__year {
  color: var(--color-text-muted);
  font-size: 14px;
}

.card__warning {
  color: #f5a623;
}
</style>
