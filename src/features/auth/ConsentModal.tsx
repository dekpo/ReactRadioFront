import { AnimatePresence, motion } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from './authStore'
import { usePlayerStore } from '../player/playerStore'

export function ConsentModal() {
  const { isConsentModalOpen, closeConsentModal, loginWithGoogleIdToken } =
    useAuthStore()
  const collapsePlayer = usePlayerStore((state) => state.collapse)
  const [error, setError] = useState<string | null>(null)

  // Plain cancel (backdrop click or "Annuler"): the user changed their mind
  // and isn't going anywhere, so leave the fullscreen now-playing overlay
  // (if open) exactly as it was.
  const handleCancel = () => {
    setError(null)
    closeConsentModal()
  }

  // Successful login, or following the privacy policy link: the user is
  // now looking at something else, so the overlay (if it was open behind
  // this modal) needs to close too or that "something else" stays hidden.
  const handleCloseAndLeave = () => {
    setError(null)
    closeConsentModal()
    collapsePlayer()
  }

  return (
    <AnimatePresence>
      {isConsentModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="w-full max-w-sm rounded-xl bg-neutral-900 p-6 text-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Avant de continuer</h2>
            <p className="mt-3 text-sm text-neutral-300">
              En te connectant avec Google, Radio Yologaza utilisera ton
              email et ton nom pour créer ton compte, et conservera les
              morceaux que tu likes pour te proposer ta playlist
              personnelle.
            </p>
            <p className="mt-3 text-sm text-neutral-400">
              Tu peux supprimer ton compte et tes données à tout moment
              depuis la Bibliothèque.{' '}
              <Link
                to="/confidentialite"
                onClick={handleCloseAndLeave}
                className="underline hover:text-white"
              >
                Voir la politique de confidentialité
              </Link>
              .
            </p>

            <div className="mt-6 flex flex-col items-center gap-2">
              {/* Google renders a "Continuer en tant que <nom>" personalized
                  card (with avatar) instead of the plain themed button when
                  the browser already has an active Google session — always
                  on a light background, a Google branding rule we can't
                  override via `theme`. Wrapping it in its own light card
                  makes that look deliberate instead of a stray white box
                  floating in the dark modal. */}
              <div className="rounded-2xl bg-white p-1 shadow-sm">
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    if (!credentialResponse.credential) {
                      setError('Connexion Google annulée ou invalide.')
                      return
                    }
                    try {
                      await loginWithGoogleIdToken(credentialResponse.credential)
                      handleCloseAndLeave()
                    } catch {
                      setError('Impossible de te connecter, réessaie plus tard.')
                    }
                  }}
                  onError={() => setError('Connexion Google annulée ou invalide.')}
                  theme="outline"
                  shape="pill"
                  text="continue_with"
                />
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="button"
                onClick={handleCancel}
                className="mt-2 rounded-full px-5 py-2.5 text-sm font-medium text-neutral-400 transition hover:text-white"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
