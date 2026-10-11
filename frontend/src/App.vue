<script setup lang="ts">
import LibraryView from './components/LibraryView.vue'
import { useLibrary } from './composables/useLibrary'

const { source, movies, posterUrls, status, error, selectFolder } = useLibrary()
</script>

<template>
  <LibraryView
    :movies="movies"
    :poster-urls="posterUrls"
    :status="status"
    :error="error"
    :supported="source.isSupported"
    @choose="selectFolder"
  />
</template>
