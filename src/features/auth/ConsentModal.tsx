import { AnimatePresence, motion } from 'framer-motion'
import { useGoogleLogin } from '@react-oauth/google'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'
import { useAuthStore } from './authStore'
import { usePlayerStore } from '../player/playerStore'

export function ConsentModal() {
  const { isConsentModalOpen, closeConsentModal, loginWithGoogleCode } =
    useAuthStore()
  const collapsePlayer = usePlayerStore((state) => state.collapse)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Custom-styled button + popup auth-code flow, instead of Google's own
  // <GoogleLogin> widget: that widget always renders a "Continuer en tant
  // que <nom>" personalized card (with avatar) on a light background for
  // returning users — a Google branding rule that can't be overridden via
  // `theme`, and looked out of place in this dark modal. This flow only
  // ever shows Google's native popup window, never an embedded widget, so
  // our own button fully controls the look. The resulting `code` is
  // exchanged for an ID token server-side (see backend/app/auth.py).
  const login = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async (codeResponse) => {
      setIsSubmitting(true)
      try {
        await loginWithGoogleCode(codeResponse.code)
        handleCloseAndLeave()
      } catch {
        setError('Impossible de te connecter, réessaie plus tard.')
      } finally {
        setIsSubmitting(false)
      }
    },
    onError: () => setError('Connexion Google annulée ou invalide.'),
  })

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
              <br /><Link
                to="/confidentialite"
                onClick={handleCloseAndLeave}
                className="underline hover:text-white"
              >
                Voir la politique de confidentialité
              </Link>
              .
            </p>

            <div className="mt-6 flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => login()}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-neutral-200 disabled:opacity-50"
              >
                <FcGoogle size={18} />
                {isSubmitting ? 'Connexion…' : 'Continuer avec Google'}
              </button>
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
