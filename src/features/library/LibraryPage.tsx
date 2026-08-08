import { useEffect, useState } from 'react'
import { Heart, Library } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useAuthStore } from '../auth/authStore'
import { useLikesStore } from '../likes/likesStore'

export function LibraryPage() {
  const { user, isBootstrapping, openConsentModal, logout, deleteAccount } =
    useAuthStore()
  const { likes, isLoading, hasLoaded, fetchLikes } = useLikesStore()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (user && !hasLoaded) fetchLikes()
  }, [user, hasLoaded, fetchLikes])

  if (isBootstrapping) {
    return null
  }

  if (user) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-8 py-10">
        <div className="flex flex-col items-center gap-4 text-center">
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
              onClick={() => setIsDeleteDialogOpen(true)}
              className="rounded-full px-5 py-2 text-sm font-medium text-red-400 transition hover:text-red-300"
            >
              Supprimer mon compte
            </button>
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-400">
            Morceaux likés
          </h2>
          {isLoading && likes.length === 0 && (
            <p className="text-sm text-neutral-500">Chargement…</p>
          )}
          {!isLoading && likes.length === 0 && (
            <p className="text-sm text-neutral-500">
              Aucun morceau liké pour l'instant. Like un morceau depuis le
              lecteur pour le retrouver ici.
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {likes.map((like) => (
              <li
                key={like.file_id}
                className="flex items-center gap-3 rounded-lg bg-neutral-800/50 p-3"
              >
                {like.artwork_url ? (
                  <img
                    src={like.artwork_url}
                    alt=""
                    className="h-12 w-12 flex-shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 flex-shrink-0 rounded bg-neutral-700" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {like.track_title ?? 'Titre inconnu'}
                  </p>
                  <p className="truncate text-xs text-neutral-400">
                    {like.artist_name ?? 'Artiste inconnu'}
                  </p>
                </div>
                <Heart size={18} fill="currentColor" className="text-red-500" />
              </li>
            ))}
          </ul>
        </div>

        <ConfirmDialog
          open={isDeleteDialogOpen}
          title="Supprimer ton compte ?"
          description="Cette action est définitive : ton compte et tous tes morceaux likés seront supprimés immédiatement."
          confirmLabel="Supprimer définitivement"
          destructive
          onConfirm={() => {
            setIsDeleteDialogOpen(false)
            deleteAccount()
          }}
          onCancel={() => setIsDeleteDialogOpen(false)}
        />
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
        onClick={() => openConsentModal()}
        className="flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black transition hover:bg-neutral-200"
      >
        <FcGoogle size={18} />
        Se connecter avec Google
      </button>
    </div>
  )
}
