import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Loader2,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from 'lucide-react'
import { ConnectionBanner } from './ConnectionBanner'
import { LikeButton } from '../likes/LikeButton'
import { useLiveInfo } from './useLiveInfo'
import { usePlayerStore } from './playerStore'

export function NowPlayingOverlay() {
  const { isExpanded, isPlaying, isBuffering, togglePlay, collapse } =
    usePlayerStore()
  const { data } = useLiveInfo()

  const track = data?.current
  const title = track?.metadata?.track_title ?? track?.name ?? 'Radio Yologaza'
  const artist = track?.metadata?.artist_name ?? 'Live'
  const artwork = track?.metadata?.artwork_url

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-neutral-950 text-white"
        >
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
            style={artwork ? { backgroundImage: `url(${artwork})` } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

          <div className="relative flex items-center px-4 pt-6">
            <button
              type="button"
              onClick={collapse}
              aria-label="Minimize player"
              className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronDown size={28} />
            </button>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto px-8 py-4">
            <div className="flex h-64 w-64 items-center justify-center overflow-hidden rounded-2xl bg-neutral-800 shadow-2xl sm:h-80 sm:w-80">
              {artwork ? (
                <img src={artwork} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gradient-to-br from-red-900/60 to-neutral-800" />
              )}
            </div>

            <div className="flex w-full max-w-sm items-center justify-center gap-3">
              <div className="min-w-0 flex-1 text-center">
                <p className="truncate text-2xl font-bold">{title}</p>
                <p className="mt-1 truncate text-neutral-300">{artist}</p>
              </div>
              <LikeButton track={track} size={24} className="flex-shrink-0" />
            </div>

            <div className="flex items-center gap-8">
              <button
                type="button"
                disabled
                aria-label="Previous (unavailable on a live stream)"
                className="cursor-not-allowed text-neutral-500"
              >
                <SkipBack size={28} />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                disabled={isBuffering}
                aria-label={isBuffering ? 'Loading' : isPlaying ? 'Pause' : 'Play'}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:cursor-wait"
              >
                {isBuffering ? (
                  <Loader2 size={28} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={28} />
                ) : (
                  <Play size={28} />
                )}
              </button>
              <button
                type="button"
                disabled
                aria-label="Next (unavailable on a live stream)"
                className="cursor-not-allowed text-neutral-500"
              >
                <SkipForward size={28} />
              </button>
            </div>

            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
              <span className="h-2 w-2 rounded-full bg-red-500" /> LIVE
            </span>
          </div>

          {/* Anchored to the bottom of the screen (outside the centered
              content above) so it's never clipped when the centered stack
              is taller than the viewport — see the mobile "Pas de connexion"
              truncation bug reported by the user. */}
          <div className="relative w-full shrink-0 px-4 pb-6">
            <div className="mx-auto w-full max-w-sm overflow-hidden rounded-lg">
              <ConnectionBanner />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
