import { AlertTriangle, WifiOff } from 'lucide-react'
import { usePlayerStore } from './playerStore'

export function ConnectionBanner() {
  const { isOffline, streamError, setStreamError, setPlaying } =
    usePlayerStore()

  if (isOffline) {
    return (
      <div className="flex items-center justify-center gap-2 bg-neutral-800 px-4 py-2 text-center text-xs text-neutral-300">
        <WifiOff size={14} className="flex-shrink-0" />
        Pas de connexion internet — reprise automatique dès que le réseau
        revient.
      </div>
    )
  }

  if (streamError) {
    return (
      <div className="flex items-center justify-center gap-3 bg-red-900/80 px-4 py-2 text-center text-xs text-white">
        <AlertTriangle size={14} className="flex-shrink-0" />
        Impossible de se connecter au flux.
        <button
          type="button"
          onClick={() => {
            setStreamError(false)
            setPlaying(true)
          }}
          className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black transition hover:bg-neutral-200"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return null
}
