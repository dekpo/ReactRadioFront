import { create } from 'zustand'
import { backendApi, type Like } from '../../lib/backendApi'

interface LikeTrackInfo {
  file_id: number
  track_title?: string
  artist_name?: string
  artwork_url?: string
}

interface LikesState {
  likes: Like[]
  isLoading: boolean
  hasLoaded: boolean
  fetchLikes: () => Promise<void>
  isLiked: (fileId: number) => boolean
  toggleLike: (track: LikeTrackInfo) => Promise<void>
  reset: () => void
}

export const useLikesStore = create<LikesState>((set, get) => ({
  likes: [],
  isLoading: false,
  hasLoaded: false,
  fetchLikes: async () => {
    set({ isLoading: true })
    try {
      const likes = await backendApi.listLikes()
      set({ likes, hasLoaded: true })
    } finally {
      set({ isLoading: false })
    }
  },
  isLiked: (fileId) => get().likes.some((like) => like.file_id === fileId),
  toggleLike: async (track) => {
    const alreadyLiked = get().isLiked(track.file_id)
    if (alreadyLiked) {
      await backendApi.unlikeTrack(track.file_id)
      set({ likes: get().likes.filter((like) => like.file_id !== track.file_id) })
    } else {
      const like = await backendApi.likeTrack(track)
      set({ likes: [like, ...get().likes] })
    }
  },
  reset: () => set({ likes: [], hasLoaded: false }),
}))
