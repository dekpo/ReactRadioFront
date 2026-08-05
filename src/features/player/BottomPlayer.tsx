import { useEffect, useRef } from 'react'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { STREAM_URL } from '../../lib/api'
import { usePlayerStore } from './playerStore'
import { useLiveInfo } from './useLiveInfo'

export function BottomPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isPlaying, volume, togglePlay, setVolume, expand } = usePlayerStore()

  const { data } = useLiveInfo()

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.play().catch(() => usePlayerStore.getState().setPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const track = data?.current
  const title = track?.metadata?.track_title ?? track?.name ?? 'Radio Yologaza'
  const artist = track?.metadata?.artist_name ?? 'Live'
  const artwork = track?.metadata?.artwork_url

  return (
    <div className="flex items-center justify-between gap-4 border-t border-neutral-800 bg-neutral-950 px-4 py-3">
      <audio ref={audioRef} src={STREAM_URL} preload="none" />

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
