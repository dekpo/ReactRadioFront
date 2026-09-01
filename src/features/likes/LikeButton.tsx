import { useState } from 'react'
import { Heart } from 'lucide-react'
import { LIKEABLE_TRACK_TYPE_IDS, type LiveTrack } from '../../lib/api'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useAuthStore } from '../auth/authStore'
import { useLikesStore, type LikeTrackInfo } from './likesStore'

interface LikeButtonProps {
  track?: LiveTrack | null
  libraryTrack?: LikeTrackInfo | null
  size?: number
  className?: string
}

function payloadFromLiveTrack(track: LiveTrack): LikeTrackInfo | null {
  const fileId = track.metadata?.id
  if (fileId == null) return null
  return {
    file_id: fileId,
    track_title: track.metadata.track_title,
    artist_name: track.metadata.artist_name,
    artwork_url: track.metadata.artwork_url,
  }
}

// Shown next to the currently playing track (bottom player + fullscreen
// overlay) and next to titles in the library list. Hidden entirely for
// jingles/interludes that aren't likeable on the live stream, and for
// signed-out users — opens the Google consent modal on click instead of
// silently doing nothing, so the feature is discoverable.
export function LikeButton({
  track,
  libraryTrack,
  size = 20,
  className = '',
}: LikeButtonProps) {
  const user = useAuthStore((state) => state.user)
  const openConsentModal = useAuthStore((state) => state.openConsentModal)
  const { isLiked, toggleLike } = useLikesStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const payload =
    libraryTrack?.file_id != null
      ? libraryTrack
      : track
        ? payloadFromLiveTrack(track)
        : null

  const fileId = payload?.file_id
  const trackTypeId = track?.metadata?.track_type_id
  // Library tracks are already in the user's likes, so they stay likeable
  // even without LibreTime track_type_id. Live tracks still go through the
  // type allow-list.
  const isLikeable =
    fileId != null &&
    (libraryTrack?.file_id != null ||
      (trackTypeId != null && LIKEABLE_TRACK_TYPE_IDS.includes(trackTypeId)))

  if (!isLikeable || payload == null || fileId == null) return null

  if (!user) {
    return (
      <button
        type="button"
        onClick={() =>
          openConsentModal({
            file_id: fileId,
            track_title: payload.track_title,
            artist_name: payload.artist_name,
            artwork_url: payload.artwork_url,
          })
        }
        aria-label="Se connecter pour liker ce morceau"
        className={`cursor-pointer text-neutral-500 transition hover:text-white ${className}`}
      >
        <Heart size={size} />
      </button>
    )
  }

  const liked = isLiked(fileId)

  const performToggle = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await toggleLike(payload)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation()
          if (liked) {
            setConfirmOpen(true)
            return
          }
          void performToggle()
        }}
        disabled={isSubmitting}
        aria-label={liked ? 'Retirer le like' : 'Liker ce morceau'}
        className={`cursor-pointer transition disabled:opacity-50 ${
          liked ? 'text-red-500' : 'text-neutral-500 hover:text-white'
        } ${className}`}
      >
        <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
      </button>
      <ConfirmDialog
        open={confirmOpen}
        title="Retirer ce morceau de tes favoris ?"
        description={`« ${payload.track_title ?? 'Ce morceau'} » sera retiré de ta bibliothèque. Tu ne pourras le retrouver qu'en le likant à nouveau depuis le direct.`}
        confirmLabel="Retirer"
        destructive
        onConfirm={() => {
          setConfirmOpen(false)
          void performToggle()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}
