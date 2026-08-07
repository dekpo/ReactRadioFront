// Placeholder for the real Google Identity Services (GIS) integration.
// Wiring this up requires a Google OAuth Client ID (created by the site
// owner) and the FastAPI backend's /app-api/auth/google/callback endpoint —
// neither exists yet. See AI-Context/handoff-phase2-accounts-likes for the
// full plan. For now this just documents the intended call site so the
// consent modal has a single, obvious place to plug the real flow into.
export function startGoogleSignIn() {
  console.info(
    '[auth] Google sign-in requested — GIS integration not wired up yet.',
  )
}
