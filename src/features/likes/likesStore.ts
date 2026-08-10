import { create } from 'zustand'
import { backendApi, type Like } from '../../lib/backendApi'
import { type OndemandTrack, usePlayerStore } from '../player/playerStore'

export interface LikeTrackInfo {
  file_id: number
  track_title?: string
  artist_name?: string
  artwork_url?: string
}

function toOndemandTrack(like: Like): OndemandTrack {
  return {
    fileId: like.file_id,
    title: like.track_title ?? 'Titre inconnu',
    artist: like.artist_name ?? 'Artiste inconnu',
    artworkUrl: like.artwork_url,
  }
}

function syncPlayerQueue(likes: Like[]) {
  usePlayerStore.getState().syncOndemandQueue(likes.map(toOndemandTrack))
}

interface LikesState {
  likes: Like[]
  isLoading: boolean
  hasLoaded: boolean
  fetchLikes: () => Promise<void>
  isLiked: (fileId: number) => boolean
  toggleLike: (track: LikeTrackInfo) => Promise<void>
  reorderLikes: (orderedFileIds: number[]) => Promise<void>
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
      const likes = get().likes.filter((like) => like.file_id !== track.file_id)
      set({ likes })
      syncPlayerQueue(likes)
    } else {
      const like = await backendApi.likeTrack(track)
      const likes = [like, ...get().likes.filter((l) => l.file_id !== like.file_id)]
      set({ likes })
      syncPlayerQueue(likes)
    }
  },
  reorderLikes: async (orderedFileIds) => {
    const previous = get().likes
    const byId = new Map(previous.map((like) => [like.file_id, like]))
    const optimistic = orderedFileIds
      .map((fileId, position) => {
        const like = byId.get(fileId)
        return like ? { ...like, position } : null
      })
      .filter((like): like is Like => like !== null)

    // Optimistic UI: reorder immediately, persist in the background.
    set({ likes: optimistic })
    syncPlayerQueue(optimistic)

    try {
      const likes = await backendApi.reorderLikes(orderedFileIds)
      set({ likes })
      syncPlayerQueue(likes)
    } catch (error) {
      set({ likes: previous })
      syncPlayerQueue(previous)
      throw error
    }
  },
  reset: () => set({ likes: [], hasLoaded: false }),
}))

export { toOndemandTrack }
