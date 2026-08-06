import { AlertTriangle, WifiOff } from 'lucide-react'
import { usePlayerStore } from './playerStore'

export function ConnectionBanner() {
  const { isOffline, streamError, setStreamError, setPlaying } =
    usePlayerStore()

  if (isOffline) {
    return (
      <div className="flex flex-col items-center gap-2 bg-neutral-800 px-6 py-6 text-center">
        <WifiOff size={36} className="text-neutral-300" />
        <p className="text-lg font-semibold text-white">
          Pas de connexion internet
        </p>
        <p className="text-sm text-neutral-300">
          Reprise automatique dès que le réseau revient.
        </p>
      </div>
    )
  }

  if (streamError) {
    return (
      <div className="flex flex-col items-center gap-2 bg-red-900/90 px-6 py-6 text-center">
        <AlertTriangle size={36} className="text-white" />
        <p className="text-lg font-semibold text-white">
          Impossible de se connecter au flux
        </p>
        <button
          type="button"
          onClick={() => {
            setStreamError(false)
            setPlaying(true)
          }}
          className="mt-1 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
        >
          Réessayer
        </button>
      </div>
    )
  }

  return null
}
