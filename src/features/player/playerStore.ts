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

function identityOrder(length: number): number[] {
  return Array.from({ length }, (_, i) => i)
}

/** Fisher–Yates shuffle; does not mutate the input. */
function shuffledCopy(indices: number[]): number[] {
  const result = [...indices]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = result[i]!
    result[i] = result[j]!
    result[j] = tmp
  }
  return result
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
  // `queue` is the natural order (library order at launch / last sync).
  // `queueIndex` is the position in the *effective* play order: when
  // shuffle is off that is an index into `queue`; when shuffle is on it
  // indexes into `playOrder`, and the natural track index is
  // `playOrder[queueIndex]`.
  queue: OndemandTrack[]
  queueIndex: number
  currentOndemandTrack: OndemandTrack | null
  // True while playing the short jingle used as a transition back to live
  // after the last track of the queue finishes — see PROMPT.md.
  isPlayingTransitionJingle: boolean
  repeatMode: RepeatMode
  // Independent of `repeatMode` (Spotify-style). When true, `playOrder` is
  // a permutation of queue indices; toggled via `toggleShuffle`.
  isShuffled: boolean
  playOrder: number[]

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
  toggleShuffle: () => void
  // Keep the current track playing while replacing `queue` with a new
  // library order (after drag-and-drop or a new like at the top). When
  // shuffled, rebuilds `playOrder` from the new order without changing
  // the track currently playing.
  syncOndemandQueue: (tracks: OndemandTrack[]) => void

  setPlaybackProgress: (currentTime: number, duration: number) => void
  requestSeek: (time: number) => void
  clearSeekRequest: () => void
}

function effectiveOrder(queueLength: number, isShuffled: boolean, playOrder: number[]): number[] {
  if (isShuffled && playOrder.length === queueLength) return playOrder
  return identityOrder(queueLength)
}

function naturalIndexAt(
  queueIndex: number,
  queueLength: number,
  isShuffled: boolean,
  playOrder: number[],
): number {
  const order = effectiveOrder(queueLength, isShuffled, playOrder)
  return order[queueIndex] ?? queueIndex
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
  isShuffled: false,
  playOrder: [],
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
      isShuffled: false,
      playOrder: [],
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
    const { queue, queueIndex, repeatMode, isShuffled, playOrder } = get()
    const order = effectiveOrder(queue.length, isShuffled, playOrder)
    const nextIndex = queueIndex + 1
    if (nextIndex < order.length) {
      const natural = order[nextIndex]!
      set({
        queueIndex: nextIndex,
        currentOndemandTrack: queue[natural]!,
        isPlayingTransitionJingle: false,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      })
    } else if (repeatMode === 'queue') {
      // Explicit, intentional loop: go straight back to the first track,
      // no transition jingle (that's reserved for the natural end of a
      // one-off listening session, not a deliberate repeat).
      const natural = order[0]!
      set({
        queueIndex: 0,
        currentOndemandTrack: queue[natural]!,
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
    const { queue, queueIndex, isPlayingTransitionJingle, isShuffled, playOrder } = get()
    if (queue.length === 0) return
    const order = effectiveOrder(queue.length, isShuffled, playOrder)
    // Stepping back out of the transition jingle re-plays the last track
    // instead of doing nothing.
    const previousIndex = isPlayingTransitionJingle
      ? order.length - 1
      : Math.max(queueIndex - 1, 0)
    const natural = order[previousIndex]!
    set({
      queueIndex: previousIndex,
      currentOndemandTrack: queue[natural]!,
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
      isShuffled: false,
      playOrder: [],
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

  // Spotify-style: independent of repeat. Each activation re-shuffles the
  // full queue; the currently playing track stays put (its position in the
  // new permutation becomes the new queueIndex). Deactivating restores
  // natural order without changing the current track.
  toggleShuffle: () => {
    const { queue, queueIndex, isShuffled, playOrder, mode } = get()
    if (mode !== 'ondemand' || queue.length === 0) return

    const currentNatural = naturalIndexAt(queueIndex, queue.length, isShuffled, playOrder)

    if (!isShuffled) {
      const newOrder = shuffledCopy(identityOrder(queue.length))
      const newPos = newOrder.indexOf(currentNatural)
      set({
        isShuffled: true,
        playOrder: newOrder,
        queueIndex: newPos === -1 ? 0 : newPos,
      })
      return
    }

    set({
      isShuffled: false,
      playOrder: [],
      queueIndex: currentNatural,
    })
  },

  syncOndemandQueue: (tracks) => {
    const {
      mode,
      currentOndemandTrack,
      isShuffled,
      isPlayingTransitionJingle,
    } = get()
    if (mode !== 'ondemand' || isPlayingTransitionJingle) return

    if (!currentOndemandTrack) {
      set({ queue: tracks, queueIndex: tracks.length ? 0 : -1, playOrder: [], isShuffled: false })
      return
    }

    const newNaturalIndex = tracks.findIndex(
      (track) => track.fileId === currentOndemandTrack.fileId,
    )

    // Current track left the library (unliked): keep playing it, but the
    // upcoming queue becomes the remaining likes; next skip starts at 0.
    if (newNaturalIndex === -1) {
      set({
        queue: tracks,
        queueIndex: -1,
        playOrder: [],
        isShuffled: false,
      })
      return
    }

    if (isShuffled && tracks.length > 0) {
      const newOrder = shuffledCopy(identityOrder(tracks.length))
      const newPos = newOrder.indexOf(newNaturalIndex)
      set({
        queue: tracks,
        playOrder: newOrder,
        queueIndex: newPos === -1 ? 0 : newPos,
      })
      return
    }

    set({
      queue: tracks,
      queueIndex: newNaturalIndex,
      playOrder: [],
    })
  },

  setPlaybackProgress: (currentTime, duration) => set({ currentTime, duration }),
  requestSeek: (time) => set({ seekTo: time }),
  clearSeekRequest: () => set({ seekTo: null }),
}))
