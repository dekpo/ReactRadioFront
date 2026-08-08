import { useEffect, useRef } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { Loader2, Pause, Play, Volume2 } from 'lucide-react'
import { STREAM_URL } from '../../lib/api'
import { LikeButton } from '../likes/LikeButton'
import { usePlayerStore } from './playerStore'
import { useLiveInfo } from './useLiveInfo'

// Mirrors the thresholds used for swipe-to-dismiss on the fullscreen
// overlay (NowPlayingOverlay.tsx), just in the opposite (upward) direction.
const SWIPE_EXPAND_DISTANCE = 60
const SWIPE_EXPAND_VELOCITY = 400

// Generic fallback shown on OS lock screens when the current track has no
// artwork (rare, but LibreTime sometimes lacks it for some files).
const FALLBACK_ARTWORK = '/carousel/yologaza-1.jpeg'

// Auto-reconnect tuning for flaky mobile connections (roaming, tunnels...).
const MAX_RECONNECT_ATTEMPTS = 5
const BASE_RECONNECT_DELAY_MS = 2000
const MAX_RECONNECT_DELAY_MS = 16000
// How long we tolerate a stalled `waiting` state before treating it as a
// dead connection and forcing a reconnect, rather than buffering forever.
const STALLED_TIMEOUT_MS = 10000

export function BottomPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stalledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { isPlaying, isBuffering, volume, togglePlay, setVolume, expand } =
    usePlayerStore()

  const { data } = useLiveInfo()

  function clearReconnectTimers() {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    if (stalledTimeoutRef.current) clearTimeout(stalledTimeoutRef.current)
    retryTimeoutRef.current = null
    stalledTimeoutRef.current = null
  }

  // Connects (or reconnects) to the live edge of the stream. A plain
  // `audio.play()` after a pause would resume from whatever was already
  // buffered, not the actual live position — the underlying connection/
  // buffer isn't closed by `pause()` alone. Reassigning `src` with a
  // cache-busting query param forces a brand new connection.
  function connectAndPlay() {
    const audio = audioRef.current
    if (!audio) return
    usePlayerStore.getState().setBuffering(true)
    audio.src = `${STREAM_URL}?_=${Date.now()}`
    audio.load()
    audio.play().catch(scheduleReconnect)
  }

  // Called on stream `error`, on a stalled `waiting` that lasted too long,
  // or on a failed `play()` — decides whether to retry, wait for the network
  // to come back, or give up and let the user retry manually.
  function scheduleReconnect() {
    const store = usePlayerStore.getState()
    if (!store.isPlaying) return // user intentionally stopped, ignore
    clearReconnectTimers()

    if (store.isOffline) {
      // No point burning retries while genuinely offline; the `online`
      // listener below reconnects immediately once the network is back.
      store.setBuffering(false)
      return
    }

    if (retryCountRef.current >= MAX_RECONNECT_ATTEMPTS) {
      retryCountRef.current = 0
      store.setBuffering(false)
      store.setStreamError(true)
      store.setPlaying(false)
      return
    }

    const delay = Math.min(
      BASE_RECONNECT_DELAY_MS * 2 ** retryCountRef.current,
      MAX_RECONNECT_DELAY_MS,
    )
    retryCountRef.current += 1
    store.setBuffering(true)
    retryTimeoutRef.current = setTimeout(connectAndPlay, delay)
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      retryCountRef.current = 0
      usePlayerStore.getState().setStreamError(false)
      connectAndPlay()
    } else {
      clearReconnectTimers()
      audio.pause()
      usePlayerStore.getState().setBuffering(false)
      // Drop the buffered/connected stream entirely so a later play() can't
      // resume from stale audio.
      audio.removeAttribute('src')
      audio.load()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    // `playing` fires once audio is actually audible again after a delay/
    // buffering — the reliable signal that a (re)connection succeeded.
    const handlePlaying = () => {
      retryCountRef.current = 0
      clearReconnectTimers()
      usePlayerStore.getState().setBuffering(false)
      // iOS/WebKit resets its internal media session state whenever the
      // underlying `<audio>` reloads (every reconnect uses a fresh
      // cache-busted `src` + `load()`), wiping our previously-set metadata.
      // Re-applying it right when playback actually resumes is what keeps
      // the lock screen title/artist/artwork in sync on iOS.
      applyMediaSessionMetadata()
    }
    // `waiting` fires if playback stalls (network hiccup). Give it
    // STALLED_TIMEOUT_MS to resolve on its own before forcing a reconnect.
    const handleWaiting = () => {
      usePlayerStore.getState().setBuffering(true)
      if (stalledTimeoutRef.current) clearTimeout(stalledTimeoutRef.current)
      stalledTimeoutRef.current = setTimeout(scheduleReconnect, STALLED_TIMEOUT_MS)
    }
    const handleError = () => scheduleReconnect()
    // Only clear the buffering flag here for an *intentional* stop — the
    // reconnect logic above never calls audio.pause() directly.
    const handlePause = () => {
      if (!usePlayerStore.getState().isPlaying) {
        usePlayerStore.getState().setBuffering(false)
      }
    }

    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('error', handleError)
    audio.addEventListener('pause', handlePause)
    return () => {
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('pause', handlePause)
      clearReconnectTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const store = usePlayerStore.getState()
    store.setOffline(!navigator.onLine)

    function handleOnline() {
      usePlayerStore.getState().setOffline(false)
      // Jump straight back to a fresh connection attempt instead of waiting
      // for a stale retry timer — the whole point of roaming resilience.
      if (usePlayerStore.getState().isPlaying) {
        retryCountRef.current = 0
        connectAndPlay()
      }
    }
    function handleOffline() {
      usePlayerStore.getState().setOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const track = data?.current
  const title = track?.metadata?.track_title ?? track?.name ?? 'Radio Yologaza'
  const artist = track?.metadata?.artist_name ?? 'Live'
  const artwork = track?.metadata?.artwork_url

  // Kept in a ref so `applyMediaSessionMetadata` (called from the audio event
  // handlers below, outside React's render cycle) always reads the latest
  // track info without needing to be redeclared on every change.
  const mediaInfoRef = useRef({ title, artist, artwork })
  useEffect(() => {
    mediaInfoRef.current = { title, artist, artwork }
  }, [title, artist, artwork])

  // Lock screen / OS media controls (Android/iOS/desktop): without this, the
  // browser falls back to the page favicon, which is tiny and pixelated once
  // upscaled on a lock screen. We push the current track's real artwork
  // instead. Several artwork sizes are provided since some UAs (notably iOS
  // WebKit) pick the closest declared size rather than scaling a single one.
  function applyMediaSessionMetadata() {
    if (!('mediaSession' in navigator)) return
    const { title, artist, artwork } = mediaInfoRef.current
    const artworkSrc = artwork ?? FALLBACK_ARTWORK
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: 'Radio Yologaza',
      artwork: [96, 128, 192, 256, 384, 512].map((size) => ({
        src: artworkSrc,
        sizes: `${size}x${size}`,
        type: 'image/jpeg',
      })),
    })

    // On a *live* stream there's never a natural "track changed" signal for
    // the OS to react to (same continuous connection, only the API metadata
    // changes) — iOS/WebKit is known to silently ignore mid-playback
    // metadata updates in that case (see e.g. icecast-metadata-js#193).
    // Briefly nudging playbackState forces it to re-read the now-playing
    // info instead of leaving the lock screen stuck on the previous track.
    if (usePlayerStore.getState().isPlaying) {
      navigator.mediaSession.playbackState = 'none'
      // Split across two ticks: setting both states synchronously in the
      // same task is sometimes coalesced by the OS into a no-op.
      setTimeout(() => {
        navigator.mediaSession.playbackState = 'playing'
      }, 0)
    }
  }

  useEffect(() => {
    applyMediaSessionMetadata()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, artist, artwork])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
    navigator.mediaSession.setActionHandler('play', () =>
      usePlayerStore.getState().setPlaying(true),
    )
    navigator.mediaSession.setActionHandler('pause', () =>
      usePlayerStore.getState().setPlaying(false),
    )
    // No previous/next track on a live stream.
    navigator.mediaSession.setActionHandler('previoustrack', null)
    navigator.mediaSession.setActionHandler('nexttrack', null)
  }, [isPlaying])

  // Swipe up (mobile) to open the fullscreen now-playing overlay, in
  // addition to the existing tap target on the track info. Framer Motion
  // tells drag and tap gestures apart by movement distance, so this
  // doesn't interfere with tapping the play/like buttons below.
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y < -SWIPE_EXPAND_DISTANCE || info.velocity.y < -SWIPE_EXPAND_VELOCITY) {
      expand()
    }
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.5, bottom: 0 }}
      onDragEnd={handleDragEnd}
      className="relative flex items-center justify-between gap-4 border-t border-red-900/40 bg-gradient-to-r from-red-950 via-neutral-950 to-neutral-950 px-4 py-3"
    >
      {/* Thin accent line: the main visual cue (per design decision) that
          this bar isn't just a static footer — it echoes the red gradient
          used elsewhere (home hero, overlay artwork placeholder). */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-red-500/60 via-red-500/20 to-transparent" />

      <audio ref={audioRef} preload="none" />

      <button
        type="button"
        onClick={expand}
        aria-label="Open now playing"
        className="flex min-w-0 flex-1 items-center gap-3 text-left sm:flex-none"
      >
        {artwork ? (
          <img
            src={artwork}
            alt=""
            className="h-12 w-12 flex-shrink-0 rounded object-cover"
          />
        ) : (
          <div className="h-12 w-12 flex-shrink-0 rounded bg-neutral-800" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="truncate text-xs text-neutral-400">{artist}</p>
        </div>
      </button>

      <LikeButton track={track} size={18} className="flex-shrink-0" />

      {/* No previous/next controls here either — see NowPlayingOverlay.tsx
          for why: this is a live stream, there's no queue to navigate. */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={togglePlay}
          disabled={isBuffering}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:cursor-wait"
          aria-label={isBuffering ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
        >
          {isBuffering ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isPlaying ? (
            <Pause size={18} />
          ) : (
            <Play size={18} />
          )}
        </button>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <span className="flex items-center gap-1 text-xs font-semibold text-red-500">
          <span className="h-2 w-2 rounded-full bg-red-500" /> LIVE
        </span>
        <Volume2 size={18} className="ml-4 text-neutral-400" />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-24 accent-white"
        />
      </div>
    </motion.div>
  )
}
