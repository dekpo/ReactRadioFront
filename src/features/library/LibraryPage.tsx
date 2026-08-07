import { Library } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { useAuthStore } from '../auth/authStore'

export function LibraryPage() {
  const { user, isBootstrapping, openConsentModal, logout, deleteAccount } =
    useAuthStore()

  if (isBootstrapping) {
    return null
  }

  if (user) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-16 text-center">
        {user.avatar_url && (
          <img
            src={user.avatar_url}
            alt=""
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full"
          />
        )}
        <h1 className="text-xl font-semibold">
          {user.display_name ?? user.email}
        </h1>
        <p className="max-w-sm text-sm text-neutral-400">
          Tes morceaux likés arrivent bientôt ici.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-full bg-neutral-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
          >
            Se déconnecter
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Supprimer définitivement ton compte et tes morceaux likés ?')) {
                deleteAccount()
              }
            }}
            className="rounded-full px-5 py-2 text-sm font-medium text-red-400 transition hover:text-red-300"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    )
  }

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
