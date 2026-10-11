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

const dialog = ref<HTMLDialogElement | null>(null)
// Fullscreen target: a plain element, never the modal dialog itself, because a
// modal dialog already lives in the top layer and browsers refuse to move it.
const shell = ref<HTMLElement | null>(null)
const video = ref<HTMLVideoElement | null>(null)
const videoUrl = ref<string | null>(null)
const tracks = ref<LoadedSubtitle[]>([])
const selectedTrack = ref<string>(SUBTITLES_OFF)
const isPlaying = ref(false)
const isMuted = ref(false)
const isFullscreen = ref(false)
const volume = ref(1)
const currentTime = ref(0)
const duration = ref(0)
const isLoading = ref(true)
const error = ref<string | null>(null)
const subtitleNotice = ref<string | null>(null)
const playbackNotice = ref<string | null>(null)

// Object URLs created for subtitles, revoked when the player unmounts.
const subtitleUrls: string[] = []

// Body overflow to restore when the modal closes.
let previousBodyOverflow = ''

// How long the fullscreen player stays idle before it hides its own chrome.
const CONTROLS_HIDE_DELAY_MS = 3000
const controlsVisible = ref(true)
let hideTimer: ReturnType<typeof setTimeout> | undefined
// True while the pointer or keyboard focus is on the controls: they must not
// fade out under the user's hands.
let isHoldingControls = false

onMounted(async () => {
  // The element must be connected before it can be shown modally.
  await nextTick()
  dialog.value?.showModal()
  document.addEventListener('fullscreenchange', onFullscreenChange)
  document.addEventListener('mousemove', onActivity)
  document.addEventListener('keydown', onActivity)
  previousBodyOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  await load()
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  document.removeEventListener('mousemove', onActivity)
  document.removeEventListener('keydown', onActivity)
  clearHideTimer()
  document.body.style.overflow = previousBodyOverflow
  for (const url of subtitleUrls) URL.revokeObjectURL(url)
})

watch(selectedTrack, applyTrackModes)

// The windowed dialog always shows its bar; the fullscreen player only hides it
// while playing, and never while paused or while the user is on the controls.
watch([isFullscreen, isPlaying], ([fullscreen, playing]) => {
  if (fullscreen && playing) showControls()
  else pinControls()
})

async function load(): Promise<void> {
  try {
    const url = await props.source.getVideoUrl(props.movie)
    if (url === undefined) {
      error.value = 'No playable video file was found for this movie.'
      return
    }
    videoUrl.value = url
    await nextTick()
    await loadSubtitles()
    isLoading.value = false
    await startPlayback()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not open the movie.'
  } finally {
    isLoading.value = false
  }
}

/**
 * Start playback. Opening the dialog is a user gesture, but browsers may still
 * block unmuted autoplay, so fall back to a muted start and tell the user.
 */
async function startPlayback(): Promise<void> {
  const element = video.value
  if (element === null) return

  element.volume = volume.value
  try {
    await element.play()
  } catch (caught) {
    if (!(caught instanceof DOMException) || caught.name !== 'NotAllowedError') return

    element.muted = true
    isMuted.value = true
    playbackNotice.value = 'Autoplay was blocked by the browser, so playback started muted.'
    try {
      await element.play()
    } catch {
      playbackNotice.value = 'The browser blocked playback. Press Play to start.'
    }
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

  // Let Vue render the <track> elements before enabling the default one, so
  // subtitles are already on screen when playback starts.
  await nextTick()
  applyTrackModes()
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
  const element = shell.value
  if (element === null) return

  try {
    if (document.fullscreenElement !== null) {
      await document.exitFullscreen()
    } else {
      await element.requestFullscreen()
    }
  } catch (caught) {
    // Never fail silently: the browser can refuse to go fullscreen.
    console.error('Fullscreen request failed', caught)
    playbackNotice.value = 'Fullscreen is not available in this window.'
  }
}

function onFullscreenChange(): void {
  isFullscreen.value = document.fullscreenElement !== null
}

/** Show the controls and, in fullscreen, restart the idle countdown. */
function showControls(): void {
  controlsVisible.value = true
  clearHideTimer()
  if (!isFullscreen.value || !isPlaying.value || isHoldingControls) return
  hideTimer = setTimeout(() => {
    controlsVisible.value = false
  }, CONTROLS_HIDE_DELAY_MS)
}

/** Keep the controls on screen indefinitely (windowed, paused, or in use). */
function pinControls(): void {
  controlsVisible.value = true
  clearHideTimer()
}

function onControlsEnter(): void {
  isHoldingControls = true
  pinControls()
}

function onControlsLeave(): void {
  isHoldingControls = false
  showControls()
}

function clearHideTimer(): void {
  if (hideTimer === undefined) return
  clearTimeout(hideTimer)
  hideTimer = undefined
}

/** Pointer or keyboard activity: wake the controls up while in fullscreen. */
function onActivity(): void {
  if (isFullscreen.value) showControls()
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
  <dialog ref="dialog" class="player" :aria-label="movie.title" @close="emit('close')">
    <div
      ref="shell"
      class="player__shell"
      :class="{ 'player__shell--idle': !controlsVisible }"
      @mousemove="onActivity"
      @touchstart="onActivity"
    >
      <!-- Positioning context for the bar, which overlays the film in fullscreen. -->
      <div class="player__viewport">
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

        <div
          class="player__bar"
          @mouseenter="onControlsEnter"
          @mouseleave="onControlsLeave"
          @focusin="onControlsEnter"
          @focusout="onControlsLeave"
        >
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

          <div class="player__controls">
            <span class="player__title" :title="movie.title">{{ movie.title }}</span>

            <button type="button" class="player__button" @click="togglePlay">
              {{ isPlaying ? 'Pause' : 'Play' }}
            </button>

            <span class="player__time">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </span>

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
              {{ isFullscreen ? 'Exit fullscreen' : 'Fullscreen' }}
            </button>

            <button type="button" class="player__button" @click="emit('close')">Close</button>
          </div>
        </div>
      </div>

      <p v-if="subtitleNotice" class="player__notice">{{ subtitleNotice }}</p>
      <p v-if="playbackNotice" class="player__notice">{{ playbackNotice }}</p>
    </div>
  </dialog>
</template>

<style scoped>
.player {
  width: clamp(320px, 50vw, 960px);
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 32px);
  margin: auto;
  padding: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background: var(--color-surface);
  color: var(--color-text);
  overflow: hidden;
}

.player::backdrop {
  background: rgb(0 0 0 / 65%);
}

/* Fullscreen targets the shell, not the dialog: see the shell ref comment. */
.player__shell {
  display: flex;
  flex-direction: column;
}

.player__shell:fullscreen {
  width: 100vw;
  height: 100vh;
  max-width: none;
  max-height: none;
  background: var(--color-surface);
}

.player__stage {
  display: grid;
  place-items: center;
  min-height: 160px;
  background: #000;
}

.player__video {
  display: block;
  width: 100%;
  height: auto;
  max-height: 60vh;
  object-fit: contain;
  background: #000;
}

/* In fullscreen the film takes the whole screen and the bar overlays it. The
   viewport is the positioning context, not the shell: the fullscreen element
   must keep the browser's own fixed positioning. */
.player__shell:fullscreen .player__viewport {
  position: relative;
  flex: 1;
  min-height: 0;
}

.player__shell:fullscreen .player__stage {
  display: flex;
  height: 100%;
}

.player__shell:fullscreen .player__video {
  height: 100%;
  max-height: none;
}

.player__shell:fullscreen .player__bar {
  position: absolute;
  inset: auto 0 0 0;
  z-index: 1;
  border-top: none;
  background: rgb(0 0 0 / 72%);
  transition:
    opacity 200ms ease,
    transform 200ms ease;
}

.player__shell--idle:fullscreen .player__bar {
  opacity: 0;
  /* Out of the way of clicks so a tap still toggles playback. */
  pointer-events: none;
  transform: translateY(100%);
}

.player__shell--idle:fullscreen {
  cursor: none;
}

.player__status {
  padding: 24px;
  color: var(--color-text-muted);
}

.player__status--error {
  color: #f5a623;
}

.player__bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
}

.player__controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.player__title {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  font-size: 14px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  min-width: 88px;
  color: var(--color-text-muted);
  font-variant-numeric: tabular-nums;
  font-size: 14px;
}

.player__seek {
  width: 100%;
  margin: 0;
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
  padding: 8px 12px;
  color: #f5a623;
  font-size: 14px;
}
</style>
