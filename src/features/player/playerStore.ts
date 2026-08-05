import { create } from 'zustand'

interface PlayerState {
  isPlaying: boolean
  volume: number
  isExpanded: boolean
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  expand: () => void
  collapse: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  volume: 0.8,
  isExpanded: false,
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
  expand: () => set({ isExpanded: true }),
  collapse: () => set({ isExpanded: false }),
}))
