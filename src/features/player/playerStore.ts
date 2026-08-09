import { create } from 'zustand'

export type PlayerMode = 'live' | 'ondemand'

export interface OndemandTrack {
  fileId: number
  title: string
  artist: string
  artworkUrl: string | null
}

interface PlayerState {
  mode: PlayerMode
  isPlaying: boolean
  // True from the moment the user asks to play until the browser confirms
  // audio is actually flowing (native `playing` event) — covers the
  // connection/buffering delay on a live stream, and reconnect attempts.
  isBuffering: boolean
  // Mirrors navigator.onLine / window online/offline events.
  isOffline: boolean
  // True once auto-reconnect attempts have been exhausted after a stream
  // failure — surfaced as a "Retry" banner instead of an endless spinner.
  streamError: boolean
  volume: number
  isExpanded: boolean

  // On-demand playback of a user's liked tracks (mode === 'ondemand' only).
  // `queue`/`queueIndex` are a snapshot taken when playback starts, so
  // prev/next keep working even if the underlying likes list changes.
  queue: OndemandTrack[]
  queueIndex: number
  currentOndemandTrack: OndemandTrack | null
  // True while playing the short jingle used as a transition back to live
  // after the last track of the queue finishes — see PROMPT.md.
  isPlayingTransitionJingle: boolean

  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setBuffering: (buffering: boolean) => void
  setOffline: (offline: boolean) => void
  setStreamError: (error: boolean) => void
  setVolume: (volume: number) => void
  expand: () => void
  collapse: () => void

  playOndemand: (queue: OndemandTrack[], index: number) => void
  ondemandNext: () => void
  ondemandPrevious: () => void
  returnToLive: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  mode: 'live',
  isPlaying: false,
  isBuffering: false,
  isOffline: false,
  streamError: false,
  volume: 0.8,
  isExpanded: false,

  queue: [],
  queueIndex: -1,
  currentOndemandTrack: null,
  isPlayingTransitionJingle: false,

  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setBuffering: (buffering) => set({ isBuffering: buffering }),
  setOffline: (offline) => set({ isOffline: offline }),
  setStreamError: (error) => set({ streamError: error }),
  setVolume: (volume) => set({ volume }),
  expand: () => set({ isExpanded: true }),
  collapse: () => set({ isExpanded: false }),

  playOndemand: (queue, index) => {
    const track = queue[index]
    if (!track) return
    set({
      mode: 'ondemand',
      queue,
      queueIndex: index,
      currentOndemandTrack: track,
      isPlayingTransitionJingle: false,
      isPlaying: true,
      streamError: false,
    })
  },

  ondemandNext: () => {
    const { queue, queueIndex } = get()
    const nextIndex = queueIndex + 1
    if (nextIndex < queue.length) {
      set({
        queueIndex: nextIndex,
        currentOndemandTrack: queue[nextIndex],
        isPlayingTransitionJingle: false,
        isPlaying: true,
      })
    } else {
      // End of queue: play a transition jingle before falling back to live
      // (see BottomPlayer.tsx for the fallback-to-live-on-error handling).
      set({ isPlayingTransitionJingle: true, isPlaying: true })
    }
  },

  ondemandPrevious: () => {
    const { queue, queueIndex, isPlayingTransitionJingle } = get()
    if (queue.length === 0) return
    // Stepping back out of the transition jingle re-plays the last track
    // instead of doing nothing.
    const previousIndex = isPlayingTransitionJingle
      ? queue.length - 1
      : Math.max(queueIndex - 1, 0)
    set({
      queueIndex: previousIndex,
      currentOndemandTrack: queue[previousIndex],
      isPlayingTransitionJingle: false,
      isPlaying: true,
    })
  },

  returnToLive: () =>
    set({
      mode: 'live',
      queue: [],
      queueIndex: -1,
      currentOndemandTrack: null,
      isPlayingTransitionJingle: false,
      isPlaying: true,
      streamError: false,
    }),
}))
