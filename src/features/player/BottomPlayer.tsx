import { useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { fetchLiveInfo, STREAM_URL } from '../../lib/api'
import { usePlayerStore } from './playerStore'

export function BottomPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { isPlaying, volume, togglePlay, setVolume } = usePlayerStore()

  const { data } = useQuery({
    queryKey: ['live-info'],
    queryFn: fetchLiveInfo,
    refetchInterval: 4000,
  })

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
  const artist = track?.metadata?.artist_name ?? 'En direct'
  const artwork = track?.metadata?.artwork_url

  return (
    <div className="flex items-center justify-between gap-4 border-t border-neutral-800 bg-neutral-950 px-4 py-3">
      <audio ref={audioRef} src={STREAM_URL} preload="none" />

      <div className="flex min-w-0 items-center gap-3">
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
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled
          className="cursor-not-allowed text-neutral-600"
          aria-label="Précédent (indisponible en direct)"
        >
          <SkipBack size={18} />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed text-neutral-600"
          aria-label="Suivant (indisponible en direct)"
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
