import { create } from 'zustand'

interface PlayerState {
  isPlaying: boolean
  // True from the moment the user asks to play until the browser confirms
  // audio is actually flowing (native `playing` event) — covers the
  // connection/buffering delay on a live stream.
  isBuffering: boolean
  volume: number
  isExpanded: boolean
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setBuffering: (buffering: boolean) => void
  setVolume: (volume: number) => void
  expand: () => void
  collapse: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  isBuffering: false,
  volume: 0.8,
  isExpanded: false,
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setBuffering: (buffering) => set({ isBuffering: buffering }),
  setVolume: (volume) => set({ volume }),
  expand: () => set({ isExpanded: true }),
  collapse: () => set({ isExpanded: false }),
}))
