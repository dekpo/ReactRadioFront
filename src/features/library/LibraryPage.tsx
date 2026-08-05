import { Library } from 'lucide-react'

export function LibraryPage() {
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
        disabled
        className="cursor-not-allowed rounded-full bg-neutral-800 px-5 py-2 text-sm font-medium text-neutral-500"
      >
        Se connecter
      </button>
    </div>
  )
}
