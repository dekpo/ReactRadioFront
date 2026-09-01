import { create } from 'zustand'
import { backendApi, type BackendUser } from '../../lib/backendApi'
import { useLikesStore, type LikeTrackInfo } from '../likes/likesStore'

interface AuthState {
  user: BackendUser | null
  // True while checking for an existing session on app load.
  isBootstrapping: boolean
  // Controls the consent modal shown before starting sign-in (GDPR:
  // explicit, tracked consent to data processing — see
  // AI-Context/handoff-phase2-accounts-likes for the rationale).
  isConsentModalOpen: boolean
  // Set when the consent modal was opened from the heart button on a track
  // (signed-out user) rather than a generic "sign in" entry point. On
  // successful login, this track gets liked automatically and the
  // fullscreen now-playing overlay (if it was open) stays open — that's
  // the action the user actually asked for by tapping the heart, so
  // requiring a second tap after connecting would be poor UX.
  pendingLikeIntent: LikeTrackInfo | null
  openConsentModal: (likeIntent?: LikeTrackInfo) => void
  closeConsentModal: () => void
  bootstrap: () => Promise<void>
  // `code`: OAuth 2.0 authorization code from the frontend's custom Google
  // button (auth-code popup flow) — exchanged for an ID token server-side.
  loginWithGoogleCode: (code: string) => Promise<void>
  // Apple ID token from Apple JS SDK popup; optional displayName only on
  // the user's first Apple authorization.
  loginWithApple: (idToken: string, displayName?: string | null) => Promise<void>
  logout: () => Promise<void>
  deleteAccount: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isBootstrapping: true,
  isConsentModalOpen: false,
  pendingLikeIntent: null,
  openConsentModal: (likeIntent) =>
    set({ isConsentModalOpen: true, pendingLikeIntent: likeIntent ?? null }),
  closeConsentModal: () => set({ isConsentModalOpen: false, pendingLikeIntent: null }),
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
  loginWithGoogleCode: async (code) => {
    const user = await backendApi.googleLogin(code)
    set({ user })
    await applyPendingLikeIntent(get)
  },
  loginWithApple: async (idToken, displayName) => {
    const user = await backendApi.appleLogin(idToken, displayName)
    set({ user })
    await applyPendingLikeIntent(get)
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

async function applyPendingLikeIntent(get: () => AuthState) {
  const intent = get().pendingLikeIntent
  if (!intent) return

  // A returning user might have already liked this track in a past
  // session (browser cleared cookies, session expired, ...) — fetch
  // their real likes first so we don't blindly re-POST a like that
  // already exists (the backend enforces a unique constraint on
  // user_id+file_id and would reject it).
  const likesStore = useLikesStore.getState()
  await likesStore.fetchLikes()
  if (!useLikesStore.getState().isLiked(intent.file_id)) {
    await useLikesStore.getState().toggleLike(intent)
  }
}
