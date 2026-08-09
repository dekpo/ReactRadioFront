import {
  AnimatePresence,
  motion,
  useDragControls,
  type PanInfo,
} from 'framer-motion'
import { ChevronDown, Loader2, Pause, Play, Radio, SkipBack, SkipForward } from 'lucide-react'
import { ConnectionBanner } from './ConnectionBanner'
import { LikeButton } from '../likes/LikeButton'
import { useLiveInfo } from './useLiveInfo'
import { usePlayerStore } from './playerStore'

// How far (px) or how fast (px/s) a downward drag needs to go before it
// counts as "swipe to dismiss" rather than a tap/scroll — mirrors the
// standard mobile bottom-sheet pattern (e.g. Spotify's now-playing screen).
const SWIPE_DISMISS_DISTANCE = 120
const SWIPE_DISMISS_VELOCITY = 500

export function NowPlayingOverlay() {
  const {
    mode,
    isExpanded,
    isPlaying,
    isBuffering,
    togglePlay,
    collapse,
    currentOndemandTrack,
    isPlayingTransitionJingle,
    ondemandNext,
    ondemandPrevious,
    returnToLive,
  } = usePlayerStore()
  const { data } = useLiveInfo()
  const isOndemand = mode === 'ondemand'

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

  // Swipe-down-to-dismiss (mobile). Drag is only initiated from the handle
  // area at the top (via dragControls + dragListener=false) rather than the
  // whole sheet, so it never fights with vertical scrolling of the content
  // below on short screens.
  const dragControls = useDragControls()
  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > SWIPE_DISMISS_DISTANCE || info.velocity.y > SWIPE_DISMISS_VELOCITY) {
      collapse()
    }
  }

  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 32 }}
          drag="y"
          dragListener={false}
          dragControls={dragControls}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.6 }}
          onDragEnd={handleDragEnd}
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-neutral-950 text-white"
        >
          <div
            className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
            style={artwork ? { backgroundImage: `url(${artwork})` } : undefined}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black" />

          <div
            className="relative flex flex-col items-center px-4 pt-3"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => dragControls.start(e)}
          >
            {/* Grab handle: visual affordance that this sheet can be swiped
                down, same convention as native mobile bottom sheets. */}
            <div className="h-1 w-10 rounded-full bg-white/25" />
            <div className="flex w-full items-center pt-3">
              <button
                type="button"
                onClick={collapse}
                aria-label="Minimize player"
                className="rounded-full p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <ChevronDown size={28} />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-4">
            <div className="w-full max-w-sm">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-neutral-800 shadow-2xl">
                {artwork ? (
                  <img src={artwork} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-red-900/60 to-neutral-800" />
                )}
              </div>

              {/* Spotify-style layout: title/artist left-aligned, heart
                  pinned to the right on the same row — rather than
                  everything centered, which reads as less polished and
                  leaves the like button oddly floating next to the text. */}
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-xl font-bold sm:text-2xl">{title}</p>
                  <p className="mt-1 truncate text-sm text-neutral-300">{artist}</p>
                </div>
                {/* No like button while playing on-demand: the track is
                    already necessarily in the user's library. */}
                {!isOndemand && (
                  <LikeButton track={liveTrack} size={24} className="flex-shrink-0" />
                )}
              </div>

              {/* Previous/next only make sense for an on-demand queue: on
                  the live stream there's nothing to navigate to. */}
              <div className="mt-8 flex items-center justify-center gap-8">
                {isOndemand && !isPlayingTransitionJingle && (
                  <button
                    type="button"
                    onClick={ondemandPrevious}
                    aria-label="Morceau précédent"
                    className="text-white/80 transition hover:text-white"
                  >
                    <SkipBack size={26} />
                  </button>
                )}

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

                {isOndemand && !isPlayingTransitionJingle && (
                  <button
                    type="button"
                    onClick={ondemandNext}
                    aria-label="Morceau suivant"
                    className="text-white/80 transition hover:text-white"
                  >
                    <SkipForward size={26} />
                  </button>
                )}
              </div>

              <div className="mt-6 flex justify-center">
                {isOndemand ? (
                  <button
                    type="button"
                    onClick={returnToLive}
                    className="flex items-center gap-1.5 rounded-full border border-red-500/50 px-4 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/10"
                  >
                    <Radio size={14} /> Revenir au direct
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
                    <span className="h-2 w-2 rounded-full bg-red-500" /> LIVE
                  </span>
                )}
              </div>
            </div>
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
