import { useState } from 'react'
import { Heart } from 'lucide-react'
import { LIKEABLE_TRACK_TYPE_IDS, type LiveTrack } from '../../lib/api'
import { useAuthStore } from '../auth/authStore'
import { useLikesStore } from './likesStore'

interface LikeButtonProps {
  track: LiveTrack | null | undefined
  size?: number
  className?: string
}

// Shown next to the currently playing track (bottom player + fullscreen
// overlay). Hidden entirely for jingles/interludes (not likeable) and for
// signed-out users — opens the Google consent modal on click instead of
// silently doing nothing, so the feature is discoverable.
export function LikeButton({ track, size = 20, className = '' }: LikeButtonProps) {
  const user = useAuthStore((state) => state.user)
  const openConsentModal = useAuthStore((state) => state.openConsentModal)
  const { isLiked, toggleLike } = useLikesStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileId = track?.metadata?.id
  const trackTypeId = track?.metadata?.track_type_id
  const isLikeable =
    fileId != null && trackTypeId != null && LIKEABLE_TRACK_TYPE_IDS.includes(trackTypeId)

  if (!isLikeable) return null

  if (!user) {
    return (
      <button
        type="button"
        onClick={() =>
          openConsentModal({
            file_id: fileId,
            track_title: track?.metadata?.track_title,
            artist_name: track?.metadata?.artist_name,
            artwork_url: track?.metadata?.artwork_url,
          })
        }
        aria-label="Se connecter pour liker ce morceau"
        className={`text-neutral-500 transition hover:text-white ${className}`}
      >
        <Heart size={size} />
      </button>
    )
  }

  const liked = isLiked(fileId)

  const handleClick = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await toggleLike({
        file_id: fileId,
        track_title: track?.metadata?.track_title,
        artist_name: track?.metadata?.artist_name,
        artwork_url: track?.metadata?.artwork_url,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSubmitting}
      aria-label={liked ? 'Retirer le like' : 'Liker ce morceau'}
      className={`transition disabled:opacity-50 ${
        liked ? 'text-red-500' : 'text-neutral-500 hover:text-white'
      } ${className}`}
    >
      <Heart size={size} fill={liked ? 'currentColor' : 'none'} />
    </button>
  )
}
