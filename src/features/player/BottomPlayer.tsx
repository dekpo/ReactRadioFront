import { useEffect, useRef } from 'react'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { STREAM_URL } from '../../lib/api'
import { usePlayerStore } from './playerStore'
import { useLiveInfo } from './useLiveInfo'

// Generic fallback shown on OS lock screens when the current track has no
// artwork (rare, but LibreTime sometimes lacks it for some files).
const FALLBACK_ARTWORK = '/carousel/yologaza-1.jpeg'

export function BottomPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isPlaying, volume, togglePlay, setVolume, expand } = usePlayerStore()

  const { data } = useLiveInfo()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      // A plain `audio.play()` here would resume from whatever was already
      // buffered while paused, not from the actual live position (the
      // underlying connection/buffer isn't closed by `pause()` alone). We
      // force a brand new connection to the live edge of the stream by
      // reassigning `src` with a cache-busting query param before playing.
      audio.src = `${STREAM_URL}?_=${Date.now()}`
      audio.load()
      audio.play().catch(() => usePlayerStore.getState().setPlaying(false))
    } else {
      audio.pause()
      // Drop the buffered/connected stream entirely so a later play() can't
      // resume from stale audio.
      audio.removeAttribute('src')
      audio.load()
    }
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const track = data?.current
  const title = track?.metadata?.track_title ?? track?.name ?? 'Radio Yologaza'
  const artist = track?.metadata?.artist_name ?? 'Live'
  const artwork = track?.metadata?.artwork_url

  // Lock screen / OS media controls (Android/iOS/desktop): without this, the
  // browser falls back to the page favicon, which is tiny and pixelated once
  // upscaled on a lock screen. We push the current track's real artwork
  // instead, refreshed every time it changes.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title,
      artist,
      album: 'Radio Yologaza',
      artwork: [
        {
          src: artwork ?? FALLBACK_ARTWORK,
          sizes: '512x512',
          type: 'image/jpeg',
        },
      ],
    })
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

  return (
    <div className="flex items-center justify-between gap-4 border-t border-neutral-800 bg-neutral-950 px-4 py-3">
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

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled
          className="hidden cursor-not-allowed text-neutral-600 sm:block"
          aria-label="Previous (unavailable on a live stream)"
        >
          <SkipBack size={18} />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          type="button"
          disabled
          className="hidden cursor-not-allowed text-neutral-600 sm:block"
          aria-label="Next (unavailable on a live stream)"
        >
          <SkipForward size={18} />
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
    </div>
  )
}
