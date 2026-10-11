<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { Movie, SubtitleTrack } from '../types/movie'
import type { LibrarySource } from '../services/library'
import { createVttBlobUrl } from '../services/subtitleService'

const SUBTITLES_OFF = 'off'

const props = defineProps<{
  movie: Movie
  source: LibrarySource
}>()

const emit = defineEmits<{
  close: []
}>()

interface LoadedSubtitle extends SubtitleTrack {
  /** Object URL of the track converted to WebVTT. */
  url: string
}

const container = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const videoUrl = ref<string | null>(null)
const tracks = ref<LoadedSubtitle[]>([])
const selectedTrack = ref<string>(SUBTITLES_OFF)
const isPlaying = ref(false)
const isMuted = ref(false)
const volume = ref(1)
const currentTime = ref(0)
const duration = ref(0)
const isLoading = ref(true)
const error = ref<string | null>(null)
const subtitleNotice = ref<string | null>(null)

// Object URLs created for subtitles, revoked when the player unmounts.
const subtitleUrls: string[] = []

onMounted(load)
onBeforeUnmount(() => {
  for (const url of subtitleUrls) URL.revokeObjectURL(url)
})

watch(selectedTrack, applyTrackModes)

async function load(): Promise<void> {
  try {
    const url = await props.source.getVideoUrl(props.movie)
    if (url === undefined) {
      error.value = 'No playable video file was found for this movie.'
      return
    }
    videoUrl.value = url
    await loadSubtitles()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not open the movie.'
  } finally {
    isLoading.value = false
  }
}

async function loadSubtitles(): Promise<void> {
  const loaded: LoadedSubtitle[] = []
  let failed = 0

  for (const subtitle of props.movie.subtitles) {
    try {
      const content = await props.source.readSubtitle(props.movie, subtitle)
      const url = createVttBlobUrl(content, subtitle.fileName)
      subtitleUrls.push(url)
      loaded.push({ ...subtitle, url })
    } catch {
      failed += 1
    }
  }

  if (failed > 0) {
    subtitleNotice.value = `${failed} subtitle file(s) could not be read.`
  }

  tracks.value = loaded
  selectedTrack.value =
    (loaded.find((track) => track.isDefault) ?? loaded[0])?.fileName ?? SUBTITLES_OFF
}

function applyTrackModes(): void {
  const element = video.value
  if (element === null) return

  const list = element.textTracks
  for (let index = 0; index < list.length; index += 1) {
    const textTrack = list[index]
    if (textTrack === undefined) continue
    const active = tracks.value[index]?.fileName === selectedTrack.value
    textTrack.mode = active ? 'showing' : 'disabled'
  }
}

function onMetadata(): void {
  const element = video.value
  if (element === null) return
  duration.value = Number.isFinite(element.duration) ? element.duration : 0
  element.volume = volume.value
  applyTrackModes()
}

function onPlayStateChange(): void {
  isPlaying.value = video.value?.paused === false
}

function onTimeUpdate(): void {
  const element = video.value
  if (element === null) return
  currentTime.value = element.currentTime
  if (Number.isFinite(element.duration)) duration.value = element.duration
}

function togglePlay(): void {
  const element = video.value
  if (element === null) return
  if (element.paused) void element.play()
  else element.pause()
}

function seekTo(value: number): void {
  const element = video.value
  if (element === null) return
  element.currentTime = value
}

function setVolume(value: number): void {
  const element = video.value
  if (element === null) return
  element.volume = value
  element.muted = false
  isMuted.value = false
}

function toggleMute(): void {
  const element = video.value
  if (element === null) return
  element.muted = !element.muted
  isMuted.value = element.muted
}

function onSeekInput(event: Event): void {
  seekTo(Number((event.target as HTMLInputElement).value))
}

function onVolumeInput(event: Event): void {
  setVolume(Number((event.target as HTMLInputElement).value))
}

async function toggleFullscreen(): Promise<void> {
  if (document.fullscreenElement !== null) {
    await document.exitFullscreen()
  } else {
    await container.value?.requestFullscreen()
  }
}

async function addSubtitle(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file === undefined) return

  try {
    const url = createVttBlobUrl(await file.text(), file.name)
    subtitleUrls.push(url)
    tracks.value = [
      ...tracks.value,
      { fileName: file.name, label: file.name, isDefault: false, url },
    ]
    selectedTrack.value = file.name
    await nextTick()
    applyTrackModes()
  } catch {
    subtitleNotice.value = 'Could not read the subtitle file.'
  }
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (value: number): string => value.toString().padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`
}
</script>


<template>
  <div ref="container" class="player">
    <div class="player__stage">
      <video
        v-if="videoUrl"
        ref="video"
        class="player__video"
        :src="videoUrl"
        playsinline
        @click="togglePlay"
        @play="onPlayStateChange"
        @pause="onPlayStateChange"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onMetadata"
      >
        <track
          v-for="track in tracks"
          :key="track.fileName"
          :src="track.url"
          :label="track.label"
          kind="subtitles"
        />
      </video>

      <p v-if="isLoading" class="player__status">Loading…</p>
      <p v-else-if="error" class="player__status player__status--error" role="alert">
        {{ error }}
      </p>
    </div>

    <div class="player__bar">
      <button type="button" class="player__button" @click="togglePlay">
        {{ isPlaying ? 'Pause' : 'Play' }}
      </button>

      <span class="player__time">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </span>

      <input
        class="player__seek"
        type="range"
        min="0"
        :max="duration || 0"
        step="0.1"
        :value="currentTime"
        aria-label="Seek"
        @input="onSeekInput"
      />

      <button type="button" class="player__button" @click="toggleMute">
        {{ isMuted ? 'Unmute' : 'Mute' }}
      </button>

      <input
        class="player__volume"
        type="range"
        min="0"
        max="1"
        step="0.05"
        :value="volume"
        aria-label="Volume"
        @input="onVolumeInput"
      />

      <label class="player__field">
        Subtitles
        <select v-model="selectedTrack">
          <option :value="SUBTITLES_OFF">Off</option>
          <option v-for="track in tracks" :key="track.fileName" :value="track.fileName">
            {{ track.label }}
          </option>
        </select>
      </label>

      <label class="player__field">
        Add subtitle
        <input type="file" accept=".srt,.vtt" @change="addSubtitle" />
      </label>

      <button type="button" class="player__button" @click="toggleFullscreen">
        Fullscreen
      </button>
      <button type="button" class="player__button" @click="emit('close')">Close</button>
    </div>

    <p v-if="subtitleNotice" class="player__notice">{{ subtitleNotice }}</p>
  </div>
</template>

<style scoped>
.player {
  display: flex;
  flex-direction: column;
  height: 100svh;
  background: #000;
}

.player__stage {
  position: relative;
  display: grid;
  place-items: center;
  flex: 1;
  min-height: 0;
}

.player__video {
  width: 100%;
  height: 100%;
  background: #000;
}

.player__status {
  position: absolute;
  padding: 16px;
  color: var(--color-text-muted);
}

.player__status--error {
  color: #f5a623;
}

.player__bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.player__button {
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface-hover);
}

.player__button:hover {
  border-color: var(--color-accent);
}

.player__time {
  min-width: 96px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  font-size: 14px;
}

.player__seek {
  flex: 1;
  min-width: 120px;
}

.player__volume {
  width: 100px;
}

.player__field {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--color-text-muted);
}

.player__field select,
.player__field input {
  padding: 4px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface-hover);
  color: inherit;
  font-size: 14px;
}

.player__notice {
  margin: 0;
  padding: 8px 16px;
  color: #f5a623;
  font-size: 14px;
}
</style>
