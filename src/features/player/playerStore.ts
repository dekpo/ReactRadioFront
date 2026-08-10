import { create } from 'zustand'

export type PlayerMode = 'live' | 'ondemand'
// Spotify-style 3-state cycle: off -> queue (loop the whole liked-tracks
// queue) -> track (loop the current track) -> off.
export type RepeatMode = 'off' | 'queue' | 'track'

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
  repeatMode: RepeatMode

  // Seek bar support, on-demand playback only (a live stream has no
  // meaningful duration/position). `currentTime`/`duration` are updated by
  // BottomPlayer (which owns the actual <audio> element) on every
  // `timeupdate`. `seekTo` is a one-shot request set by whichever UI has a
  // seek bar (overlay, or the desktop bottom player) — BottomPlayer applies
  // it to the audio element and clears it back to null.
  currentTime: number
  duration: number
  seekTo: number | null

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
  cycleRepeatMode: () => void

  setPlaybackProgress: (currentTime: number, duration: number) => void
  requestSeek: (time: number) => void
  clearSeekRequest: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  mode: 'live',
  isPlaying: false,
  isBuffering: false,
  isOffline: false,
  streamError: false,
  // Default to max: on mobile there's no in-app volume control (by design,
  // matching Spotify/other music apps — hardware buttons handle it), so
  // starting below 100% would make the stream quieter than a competing app
  // at the same hardware volume level for no good reason.
  volume: 1,
  isExpanded: false,

  queue: [],
  queueIndex: -1,
  currentOndemandTrack: null,
  isPlayingTransitionJingle: false,
  repeatMode: 'off',
  currentTime: 0,
  duration: 0,
  seekTo: null,

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
      currentTime: 0,
      duration: 0,
    })
  },

  // Note: repeating the *current* track (repeatMode === 'track') on natural
  // end-of-track is handled directly in BottomPlayer's `ended` listener
  // (just seeks back to 0 and replays, no queue/index change) — this
  // action is only reached for a manual "skip to next" in that case, which
  // should always move forward regardless of track-repeat being on
  // (matches Spotify: repeat-track only loops on natural end, not on skip).
  ondemandNext: () => {
    const { queue, queueIndex, repeatMode } = get()
    const nextIndex = queueIndex + 1
    if (nextIndex < queue.length) {
      set({
        queueIndex: nextIndex,
        currentOndemandTrack: queue[nextIndex],
        isPlayingTransitionJingle: false,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      })
    } else if (repeatMode === 'queue') {
      // Explicit, intentional loop: go straight back to the first track,
      // no transition jingle (that's reserved for the natural end of a
      // one-off listening session, not a deliberate repeat).
      set({
        queueIndex: 0,
        currentOndemandTrack: queue[0],
        isPlayingTransitionJingle: false,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      })
    } else {
      // End of queue: play a transition jingle before falling back to live
      // (see BottomPlayer.tsx for the fallback-to-live-on-error handling).
      set({ isPlayingTransitionJingle: true, isPlaying: true, currentTime: 0, duration: 0 })
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
      currentTime: 0,
      duration: 0,
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
      currentTime: 0,
      duration: 0,
    }),

  cycleRepeatMode: () =>
    set({
      repeatMode:
        get().repeatMode === 'off' ? 'queue' : get().repeatMode === 'queue' ? 'track' : 'off',
    }),

  setPlaybackProgress: (currentTime, duration) => set({ currentTime, duration }),
  requestSeek: (time) => set({ seekTo: time }),
  clearSeekRequest: () => set({ seekTo: null }),
}))
