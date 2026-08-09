// Client for our own FastAPI backend (Phase 2: accounts, likes), separate
// from lib/api.ts (LibreTime's read-only legacy API). Same-origin in both
// dev (Vite proxy, see vite.config.ts) and production (nginx /app-api
// prefix), so no CORS handling needed here.
const BASE_URL = '/app-api'

class BackendApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(
    (init.method ?? 'GET').toUpperCase(),
  )

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // Lightweight CSRF defense expected by the backend on mutating
      // requests — see backend/app/main.py.
      ...(isMutating ? { 'X-Requested-With': 'yologaza-frontend' } : {}),
      ...init.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new BackendApiError(res.status, body?.detail ?? res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export interface BackendUser {
  id: number
  email: string
  display_name: string | null
  avatar_url: string | null
}

export interface Like {
  file_id: number
  track_title: string | null
  artist_name: string | null
  artwork_url: string | null
  liked_at: string
}

export const backendApi = {
  googleLogin: (code: string) =>
    request<BackendUser>('/auth/google/callback', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
  me: () => request<BackendUser>('/me'),
  deleteAccount: () => request<{ ok: true }>('/me', { method: 'DELETE' }),
  listLikes: () => request<Like[]>('/likes'),
  likeTrack: (payload: {
    file_id: number
    track_title?: string
    artist_name?: string
    artwork_url?: string
  }) =>
    request<Like>('/likes', { method: 'POST', body: JSON.stringify(payload) }),
  unlikeTrack: (fileId: number) =>
    request<void>(`/likes/${fileId}`, { method: 'DELETE' }),
}

// Used directly as an <audio src>, not fetched via `request` — the browser
// handles the Range requests / cookie auth itself.
export const likeAudioUrl = (fileId: number) => `${BASE_URL}/likes/${fileId}/audio`
export const randomJingleAudioUrl = () => `${BASE_URL}/jingles/random/audio`

export { BackendApiError }
