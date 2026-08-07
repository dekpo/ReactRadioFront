import { create } from 'zustand'

interface AuthUser {
  displayName: string
  email: string
  avatarUrl: string | null
}

interface AuthState {
  user: AuthUser | null
  // Controls the consent modal shown before starting the Google sign-in
  // flow (GDPR: explicit, tracked consent to data processing — see
  // AI-Context/handoff-phase2-accounts-likes for the rationale).
  isConsentModalOpen: boolean
  openConsentModal: () => void
  closeConsentModal: () => void
  setUser: (user: AuthUser | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isConsentModalOpen: false,
  openConsentModal: () => set({ isConsentModalOpen: true }),
  closeConsentModal: () => set({ isConsentModalOpen: false }),
  setUser: (user) => set({ user }),
}))
