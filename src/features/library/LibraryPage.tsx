import { Library } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { useAuthStore } from '../auth/authStore'

export function LibraryPage() {
  const openConsentModal = useAuthStore((state) => state.openConsentModal)

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-16 text-center">
      <Library size={48} className="text-neutral-500" />
      <h1 className="text-xl font-semibold">Bientôt disponible</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        Connecte-toi pour retrouver tes morceaux likés. Cette fonctionnalité
        arrive dans une prochaine mise à jour.
      </p>
      <button
        type="button"
        onClick={openConsentModal}
        className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
      >
        <FcGoogle size={18} />
        Se connecter avec Google
      </button>
    </div>
  )
}
