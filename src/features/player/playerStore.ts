import { create } from 'zustand'

interface PlayerState {
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
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setBuffering: (buffering: boolean) => void
  setOffline: (offline: boolean) => void
  setStreamError: (error: boolean) => void
  setVolume: (volume: number) => void
  expand: () => void
  collapse: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  isBuffering: false,
  isOffline: false,
  streamError: false,
  volume: 0.8,
  isExpanded: false,
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setBuffering: (buffering) => set({ isBuffering: buffering }),
  setOffline: (offline) => set({ isOffline: offline }),
  setStreamError: (error) => set({ streamError: error }),
  setVolume: (volume) => set({ volume }),
  expand: () => set({ isExpanded: true }),
  collapse: () => set({ isExpanded: false }),
}))
