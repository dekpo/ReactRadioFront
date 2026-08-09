import { useEffect, useState } from 'react'
import { Library, Pause, Play } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useAuthStore } from '../auth/authStore'
import { useLikesStore } from '../likes/likesStore'
import { type OndemandTrack, usePlayerStore } from '../player/playerStore'
import type { Like } from '../../lib/backendApi'

function toOndemandTrack(like: Like): OndemandTrack {
  return {
    fileId: like.file_id,
    title: like.track_title ?? 'Titre inconnu',
    artist: like.artist_name ?? 'Artiste inconnu',
    artworkUrl: like.artwork_url,
  }
}

export function LibraryPage() {
  const { user, isBootstrapping, openConsentModal, logout, deleteAccount } =
    useAuthStore()
  const { likes, isLoading, hasLoaded, fetchLikes } = useLikesStore()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const { mode, currentOndemandTrack, isPlaying, playOndemand, togglePlay } =
    usePlayerStore()

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
            Morceaux likés — écoute-les à la demande, en dehors du direct.
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
            {likes.map((like, index) => {
              const isCurrent =
                mode === 'ondemand' && currentOndemandTrack?.fileId === like.file_id
              return (
                <li
                  key={like.file_id}
                  className={`flex items-center gap-3 rounded-lg p-3 transition ${
                    isCurrent ? 'bg-red-500/10' : 'bg-neutral-800/50'
                  }`}
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
                    <p
                      className={`truncate text-sm font-medium ${isCurrent ? 'text-red-400' : ''}`}
                    >
                      {like.track_title ?? 'Titre inconnu'}
                    </p>
                    <p className="truncate text-xs text-neutral-400">
                      {like.artist_name ?? 'Artiste inconnu'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      isCurrent
                        ? togglePlay()
                        : playOndemand(likes.map(toOndemandTrack), index)
                    }
                    aria-label={isCurrent && isPlaying ? 'Pause' : 'Lire'}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
                  >
                    {isCurrent && isPlaying ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>
                </li>
              )
            })}
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
        Connecte-toi pour retrouver tes morceaux likés. <br />Cette fonctionnalité
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
