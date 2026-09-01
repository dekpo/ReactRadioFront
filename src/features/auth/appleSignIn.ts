// Apple JS SDK (loaded from Apple's CDN in index.html).
// Docs: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js

export interface AppleSignInName {
  firstName?: string
  lastName?: string
}

export interface AppleSignInUser {
  email?: string
  name?: AppleSignInName
}

export interface AppleSignInAuthorization {
  code: string
  id_token: string
  state?: string
}

export interface AppleSignInResponse {
  authorization: AppleSignInAuthorization
  user?: AppleSignInUser
}

interface AppleIDAuth {
  init: (config: {
    clientId: string
    scope: string
    redirectURI: string
    usePopup: boolean
  }) => void
  signIn: () => Promise<AppleSignInResponse>
}

declare global {
  interface Window {
    AppleID?: { auth: AppleIDAuth }
  }
}

let initPromise: Promise<void> | null = null

function loadAppleSdk(): Promise<void> {
  if (window.AppleID?.auth) return Promise.resolve()
  if (initPromise) return initPromise

  initPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-apple-signin-sdk]',
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () =>
        reject(new Error('Failed to load Apple Sign In SDK')),
      )
      return
    }

    const script = document.createElement('script')
    script.src =
      'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
    script.async = true
    script.dataset.appleSigninSdk = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Apple Sign In SDK'))
    document.head.appendChild(script)
  })

  return initPromise
}

export async function signInWithApple(): Promise<{
  idToken: string
  displayName: string | null
}> {
  const clientId = import.meta.env.VITE_APPLE_CLIENT_ID as string | undefined
  const redirectURI = import.meta.env.VITE_APPLE_REDIRECT_URI as string | undefined
  if (!clientId || !redirectURI) {
    throw new Error('Missing VITE_APPLE_CLIENT_ID or VITE_APPLE_REDIRECT_URI')
  }

  await loadAppleSdk()
  if (!window.AppleID?.auth) {
    throw new Error('Apple Sign In SDK unavailable')
  }

  window.AppleID.auth.init({
    clientId,
    scope: 'name email',
    redirectURI,
    usePopup: true,
  })

  const response = await window.AppleID.auth.signIn()
  const idToken = response.authorization.id_token
  if (!idToken) {
    throw new Error('Apple did not return an ID token')
  }

  const first = response.user?.name?.firstName?.trim() ?? ''
  const last = response.user?.name?.lastName?.trim() ?? ''
  const displayName = [first, last].filter(Boolean).join(' ') || null

  return { idToken, displayName }
}
