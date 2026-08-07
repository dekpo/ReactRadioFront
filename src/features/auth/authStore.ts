import { create } from 'zustand'
import { backendApi, type BackendUser } from '../../lib/backendApi'
import { useLikesStore } from '../likes/likesStore'

interface AuthState {
  user: BackendUser | null
  // True while checking for an existing session on app load.
  isBootstrapping: boolean
  // Controls the consent modal shown before starting the Google sign-in
  // flow (GDPR: explicit, tracked consent to data processing — see
  // AI-Context/handoff-phase2-accounts-likes for the rationale).
  isConsentModalOpen: boolean
  openConsentModal: () => void
  closeConsentModal: () => void
  bootstrap: () => Promise<void>
  loginWithGoogleIdToken: (idToken: string) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isBootstrapping: true,
  isConsentModalOpen: false,
  openConsentModal: () => set({ isConsentModalOpen: true }),
  closeConsentModal: () => set({ isConsentModalOpen: false }),
  bootstrap: async () => {
    try {
      const user = await backendApi.me()
      set({ user })
    } catch {
      set({ user: null })
    } finally {
      set({ isBootstrapping: false })
    }
  },
  loginWithGoogleIdToken: async (idToken) => {
    const user = await backendApi.googleLogin(idToken)
    set({ user })
  },
  logout: async () => {
    await backendApi.logout()
    set({ user: null })
    useLikesStore.getState().reset()
  },
  deleteAccount: async () => {
    await backendApi.deleteAccount()
    set({ user: null })
    useLikesStore.getState().reset()
  },
}))
