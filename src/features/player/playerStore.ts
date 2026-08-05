import { create } from 'zustand'

interface PlayerState {
  isPlaying: boolean
  volume: number
  togglePlay: () => void
  setPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  isPlaying: false,
  volume: 0.8,
  togglePlay: () => set({ isPlaying: !get().isPlaying }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setVolume: (volume) => set({ volume }),
}))
