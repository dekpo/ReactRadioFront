import { useEffect, useRef } from 'react'
import { motion, type PanInfo } from 'framer-motion'
import { Loader2, Pause, Play, SkipBack, SkipForward, Volume2, Radio } from 'lucide-react'
import { STREAM_URL } from '../../lib/api'
import { likeAudioUrl, randomJingleAudioUrl } from '../../lib/backendApi'
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
// Shared by live and on-demand: same stall timeout, backoff, offline
// banner, and red "Retry" banner. Live reconnects with a cache-busted
// Icecast URL; on-demand reloads the same file URL and resumes position.
// The end-of-queue transition jingle still fails safe to live (it's a
// bridge back to the stream, not a library track).
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
  // Last known on-demand position, snapshotted from `timeupdate` so a
  // reconnect can resume instead of restarting the track at 0.
  const ondemandResumeAtRef = useRef(0)

  const {
    mode,
    isPlaying,
    isBuffering,
    volume,
    togglePlay,
    setVolume,
    expand,
    currentOndemandTrack,
    isPlayingTransitionJingle,
    ondemandNext,
    ondemandPrevious,
    returnToLive,
    currentTime,
    duration,
    seekTo,
    requestSeek,
  } = usePlayerStore()

  const { data } = useLiveInfo()
  const isOndemand = mode === 'ondemand'

  function clearReconnectTimers() {
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current)
    if (stalledTimeoutRef.current) clearTimeout(stalledTimeoutRef.current)
    retryTimeoutRef.current = null
    stalledTimeoutRef.current = null
  }

  function getOndemandSrc(): string | null {
    const store = usePlayerStore.getState()
    if (store.isPlayingTransitionJingle) return randomJingleAudioUrl()
    if (store.currentOndemandTrack) return likeAudioUrl(store.currentOndemandTrack.fileId)
    return null
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

  // Reloads the current liked track (or transition jingle) without
  // cache-busting, then seeks back to where playback stalled.
  function reconnectOndemand() {
    const audio = audioRef.current
    if (!audio) return
    const src = getOndemandSrc()
    if (!src) return
    const resumeAt = ondemandResumeAtRef.current
    usePlayerStore.getState().setBuffering(true)
    audio.src = src
    audio.load()
    const onMeta = () => {
      if (resumeAt > 0.5 && Number.isFinite(audio.duration) && resumeAt < audio.duration) {
        audio.currentTime = resumeAt
      }
    }
    audio.addEventListener('loadedmetadata', onMeta, { once: true })
    audio.play().catch(scheduleReconnect)
  }

  function reconnectCurrent() {
    if (usePlayerStore.getState().mode === 'live') connectAndPlay()
    else reconnectOndemand()
  }

  // Called on `error`, on a stalled `waiting` that lasted too long, or on
  // a failed `play()` — decides whether to retry, wait for the network to
  // come back, or give up and let the user retry manually. Same policy for
  // live and on-demand, except the end-of-queue jingle still falls back to
  // live (it's a transition, not a library track).
  function scheduleReconnect() {
    const store = usePlayerStore.getState()
    if (!store.isPlaying) return
    if (store.mode === 'ondemand' && store.isPlayingTransitionJingle) {
      clearReconnectTimers()
      store.setBuffering(false)
      store.returnToLive()
      return
    }
    // A stall timeout and a native `error` often fire together; don't
    // stack retry attempts if one is already scheduled.
    if (retryTimeoutRef.current) return

    if (stalledTimeoutRef.current) {
      clearTimeout(stalledTimeoutRef.current)
      stalledTimeoutRef.current = null
    }

    if (store.isOffline) {
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
    retryTimeoutRef.current = setTimeout(reconnectCurrent, delay)
  }

  // Live playback: connect/reconnect/disconnect. No-op while in on-demand
  // mode (the effects below own the <audio> element in that case).
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || mode !== 'live') return
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
  }, [isPlaying, mode])

  // Leaving live mode: drop any live reconnect timer so it can't fire
  // against an on-demand src. On-demand reconnects are scheduled after
  // this, from the track-load effect / error handlers.
  useEffect(() => {
    if (mode !== 'live') clearReconnectTimers()
  }, [mode])

  // On-demand playback: load the current track (or transition jingle) into
  // the same <audio> element whenever it changes.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || mode !== 'ondemand') return
    const src = getOndemandSrc()
    if (!src) return

    retryCountRef.current = 0
    ondemandResumeAtRef.current = 0
    usePlayerStore.getState().setStreamError(false)
    usePlayerStore.getState().setBuffering(true)
    audio.src = src
    audio.load()
    audio.play().catch(() => {
      if (usePlayerStore.getState().isPlayingTransitionJingle) {
        usePlayerStore.getState().setBuffering(false)
        usePlayerStore.getState().returnToLive()
        return
      }
      scheduleReconnect()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, currentOndemandTrack?.fileId, isPlayingTransitionJingle])

  // On-demand playback: pause/resume without reloading the current track.
  // After a hard media error, `play()` on the dead element isn't enough —
  // reload the file (same path as auto-reconnect / the live Retry button).
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || mode !== 'ondemand') return
    if (isPlaying) {
      retryCountRef.current = 0
      usePlayerStore.getState().setStreamError(false)
      if (audio.error) {
        reconnectOndemand()
      } else {
        audio.play().catch(scheduleReconnect)
      }
    } else {
      clearReconnectTimers()
      audio.pause()
      usePlayerStore.getState().setBuffering(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, mode])

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
    // STALLED_TIMEOUT_MS to resolve on its own before forcing a reconnect —
    // same policy for live and on-demand (except the transition jingle,
    // which scheduleReconnect already fails safe to live).
    const handleWaiting = () => {
      usePlayerStore.getState().setBuffering(true)
      if (stalledTimeoutRef.current) clearTimeout(stalledTimeoutRef.current)
      stalledTimeoutRef.current = setTimeout(scheduleReconnect, STALLED_TIMEOUT_MS)
    }
    const handleError = () => {
      // Live and on-demand share scheduleReconnect (retry / offline wait /
      // red banner). Jingle → live is handled inside scheduleReconnect.
      scheduleReconnect()
    }
    // Only clear the buffering flag here for an *intentional* stop — the
    // reconnect logic above never calls audio.pause() directly.
    const handlePause = () => {
      if (!usePlayerStore.getState().isPlaying) {
        usePlayerStore.getState().setBuffering(false)
      }
    }
    // On-demand only: a track (or the transition jingle) reached its end.
    const handleEnded = () => {
      const store = usePlayerStore.getState()
      if (store.mode !== 'ondemand') return
      if (store.isPlayingTransitionJingle) {
        store.returnToLive()
        return
      }
      if (store.repeatMode === 'track') {
        // Replay the same track directly (not via ondemandNext, which is
        // also used for manual "skip" and should always move forward).
        audio.currentTime = 0
        ondemandResumeAtRef.current = 0
        audio.play().catch(scheduleReconnect)
        return
      }
      store.ondemandNext()
    }
    // Seek bar support (on-demand only — a live stream's position/duration
    // aren't meaningful). `duration` can briefly be `Infinity`/`NaN` right
    // after `src` changes, before metadata has loaded. Also snapshot
    // position for reconnect-resume.
    const handleTimeUpdate = () => {
      const store = usePlayerStore.getState()
      if (store.mode !== 'ondemand') return
      if (Number.isFinite(audio.currentTime) && audio.currentTime > 0) {
        ondemandResumeAtRef.current = audio.currentTime
      }
      store.setPlaybackProgress(
        audio.currentTime,
        Number.isFinite(audio.duration) ? audio.duration : 0,
      )
    }

    audio.addEventListener('playing', handlePlaying)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('error', handleError)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleTimeUpdate)
    return () => {
      audio.removeEventListener('playing', handlePlaying)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleTimeUpdate)
      clearReconnectTimers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Applies a pending seek request (from this bar's own progress input, or
  // from NowPlayingOverlay's) to the actual <audio> element, then clears it.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || seekTo === null) return
    audio.currentTime = seekTo
    ondemandResumeAtRef.current = seekTo
    usePlayerStore.getState().clearSeekRequest()
  }, [seekTo])

  useEffect(() => {
    const store = usePlayerStore.getState()
    store.setOffline(!navigator.onLine)

    function handleOnline() {
      usePlayerStore.getState().setOffline(false)
      // Jump straight back to a fresh connection attempt instead of waiting
      // for a stale retry timer — same for live and on-demand.
      const store = usePlayerStore.getState()
      if (!store.isPlaying) return
      if (store.mode === 'ondemand' && store.isPlayingTransitionJingle) {
        // Don't fight the jingle fail-safe; let ended/error send us to live.
        return
      }
      retryCountRef.current = 0
      reconnectCurrent()
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

  const liveTrack = data?.current
  const title = isPlayingTransitionJingle
    ? 'Retour au direct…'
    : isOndemand && currentOndemandTrack
      ? currentOndemandTrack.title
      : (liveTrack?.metadata?.track_title ?? liveTrack?.name ?? 'Radio Yologaza')
  const artist = isPlayingTransitionJingle
    ? ''
    : isOndemand && currentOndemandTrack
      ? currentOndemandTrack.artist
      : (liveTrack?.metadata?.artist_name ?? 'Live')
  const artwork = isOndemand
    ? (currentOndemandTrack?.artworkUrl ?? undefined)
    : liveTrack?.metadata?.artwork_url

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
    // Track navigation only makes sense for an on-demand queue.
    if (isOndemand && !isPlayingTransitionJingle) {
      navigator.mediaSession.setActionHandler('previoustrack', () =>
        usePlayerStore.getState().ondemandPrevious(),
      )
      navigator.mediaSession.setActionHandler('nexttrack', () =>
        usePlayerStore.getState().ondemandNext(),
      )
    } else {
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
    }
  }, [isPlaying, isOndemand, isPlayingTransitionJingle])

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

      {/* On-demand progress bar: always visible as a thin indicator, but
          only draggable to seek on desktop (sm+) — on mobile the collapsed
          bar isn't meant to carry that interaction, see the fullscreen
          overlay for seeking on small screens. */}
      {isOndemand && !isPlayingTransitionJingle && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
          <div
            className="pointer-events-none h-full bg-red-500"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={(e) => requestSeek(Number(e.target.value))}
            aria-label="Progression du morceau"
            className="absolute inset-0 hidden w-full cursor-pointer opacity-0 sm:block"
          />
        </div>
      )}

      <audio ref={audioRef} preload="none" />

      {/* Track info: left-aligned, on its own (the heart now lives next to
          the play button on the right — see below). */}
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

      <div className="flex items-center gap-2 sm:gap-4">
        {isOndemand && !isPlayingTransitionJingle && (
          <button
            type="button"
            onClick={ondemandPrevious}
            aria-label="Morceau précédent"
            className="hidden text-neutral-300 transition hover:text-white sm:block"
          >
            <SkipBack size={18} />
          </button>
        )}

        {/* Heart sits immediately to the left of play/pause, on the right
            side of the bar — not next to the track title. */}
        {!isOndemand && <LikeButton track={liveTrack} size={18} className="flex-shrink-0" />}

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

        {isOndemand && !isPlayingTransitionJingle && (
          <button
            type="button"
            onClick={ondemandNext}
            aria-label="Morceau suivant"
            className="hidden text-neutral-300 transition hover:text-white sm:block"
          >
            <SkipForward size={18} />
          </button>
        )}
      </div>

      {isOndemand ? (
        <button
          type="button"
          onClick={returnToLive}
          className="hidden flex-shrink-0 items-center gap-1.5 rounded-full border border-red-500/50 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 md:flex"
        >
          <Radio size={14} /> Revenir au direct
        </button>
      ) : (
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
      )}
    </motion.div>
  )
}
