import { useEffect, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Heart, Library, Pause, Play } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useAuthStore } from '../auth/authStore'
import { toOndemandTrack, useLikesStore } from '../likes/likesStore'
import { usePlayerStore } from '../player/playerStore'
import type { Like } from '../../lib/backendApi'

interface SortableLikeRowProps {
  like: Like
  index: number
  isCurrent: boolean
  isPlaying: boolean
  onUnlike: (like: Like) => void
  onPlayToggle: (like: Like, index: number, isCurrent: boolean) => void
}

function SortableLikeRow({
  like,
  index,
  isCurrent,
  isPlaying,
  onUnlike,
  onPlayToggle,
}: SortableLikeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: like.file_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg p-3 transition ${
        isCurrent ? 'bg-red-500/10' : 'bg-neutral-800/50'
      } ${isDragging ? 'relative z-10 opacity-90 shadow-lg ring-1 ring-white/10' : ''}`}
    >
      <button
        type="button"
        aria-label="Réorganiser"
        className="flex-shrink-0 cursor-grab touch-none text-neutral-500 transition hover:text-neutral-300 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical size={18} />
      </button>
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
        onClick={() => onUnlike(like)}
        aria-label="Retirer des favoris"
        className="flex-shrink-0 text-red-500 transition hover:text-red-400"
      >
        <Heart size={18} fill="currentColor" />
      </button>
      <button
        type="button"
        onClick={() => onPlayToggle(like, index, isCurrent)}
        aria-label={isCurrent && isPlaying ? 'Pause' : 'Lire'}
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
      >
        {isCurrent && isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
    </li>
  )
}

export function LibraryPage() {
  const { user, isBootstrapping, openConsentModal, logout, deleteAccount } =
    useAuthStore()
  const { likes, isLoading, hasLoaded, fetchLikes, toggleLike, reorderLikes } =
    useLikesStore()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  // Track pending unlike, to confirm before removing a track from the
  // library — liked tracks are only ever (re)discoverable by listening to
  // the live stream again, so an accidental unlike would be costly.
  const [unlikeTarget, setUnlikeTarget] = useState<Like | null>(null)
  const { mode, currentOndemandTrack, isPlaying, playOndemand, togglePlay } =
    usePlayerStore()

  // Require a small pointer movement before drag starts so taps on the
  // grip (and nearby controls) still count as clicks.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  useEffect(() => {
    if (user && !hasLoaded) fetchLikes()
  }, [user, hasLoaded, fetchLikes])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = likes.findIndex((like) => like.file_id === active.id)
    const newIndex = likes.findIndex((like) => like.file_id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const reordered = arrayMove(likes, oldIndex, newIndex)
    void reorderLikes(reordered.map((like) => like.file_id))
  }

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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={likes.map((like) => like.file_id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-2">
                {likes.map((like, index) => {
                  const isCurrent =
                    mode === 'ondemand' &&
                    currentOndemandTrack?.fileId === like.file_id
                  return (
                    <SortableLikeRow
                      key={like.file_id}
                      like={like}
                      index={index}
                      isCurrent={isCurrent}
                      isPlaying={isPlaying}
                      onUnlike={setUnlikeTarget}
                      onPlayToggle={(_like, rowIndex, rowIsCurrent) =>
                        rowIsCurrent
                          ? togglePlay()
                          : playOndemand(likes.map(toOndemandTrack), rowIndex)
                      }
                    />
                  )
                })}
              </ul>
            </SortableContext>
          </DndContext>
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

        <ConfirmDialog
          open={unlikeTarget !== null}
          title="Retirer ce morceau de tes favoris ?"
          description={`« ${unlikeTarget?.track_title ?? 'Ce morceau'} » sera retiré de ta bibliothèque. Tu ne pourras le retrouver qu'en le likant à nouveau depuis le direct.`}
          confirmLabel="Retirer"
          destructive
          onConfirm={() => {
            if (unlikeTarget) toggleLike({ file_id: unlikeTarget.file_id })
            setUnlikeTarget(null)
          }}
          onCancel={() => setUnlikeTarget(null)}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 py-16 text-center">
      <Library size={48} className="text-neutral-500" />
      <h1 className="text-xl font-semibold">Ta bibliothèque</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        Connecte-toi pour retrouver tes morceaux likés et les écouter à la
        demande, en dehors du direct.
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
