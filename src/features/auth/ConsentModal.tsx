import { AnimatePresence, motion } from 'framer-motion'
import { GoogleLogin } from '@react-oauth/google'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from './authStore'

export function ConsentModal() {
  const { isConsentModalOpen, closeConsentModal, loginWithGoogleIdToken } =
    useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    setError(null)
    closeConsentModal()
  }

  return (
    <AnimatePresence>
      {isConsentModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={handleClose}
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
                onClick={handleClose}
                className="underline hover:text-white"
              >
                Voir la politique de confidentialité
              </Link>
              .
            </p>

            <div className="mt-6 flex flex-col items-center gap-2">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse.credential) {
                    setError('Connexion Google annulée ou invalide.')
                    return
                  }
                  try {
                    await loginWithGoogleIdToken(credentialResponse.credential)
                    handleClose()
                  } catch {
                    setError('Impossible de te connecter, réessaie plus tard.')
                  }
                }}
                onError={() => setError('Connexion Google annulée ou invalide.')}
                theme="filled_black"
                shape="pill"
                text="continue_with"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="button"
                onClick={handleClose}
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
