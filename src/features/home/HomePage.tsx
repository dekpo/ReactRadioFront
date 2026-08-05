const LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/yologaza' },
  { label: 'Spotify', href: 'https://open.spotify.com/artist/' },
  { label: 'Apple Music', href: 'https://music.apple.com/' },
  { label: 'Shazam', href: 'https://www.shazam.com/' },
]

export function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 text-white">
      <section className="rounded-xl bg-gradient-to-b from-red-900/40 to-transparent p-8">
        <h1 className="text-4xl font-bold">Radio Yologaza !</h1>
        <p className="mt-2 text-neutral-300">Propulsé par La Familia ;)</p>
      </section>

      <section className="flex flex-wrap gap-3">
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-full bg-neutral-800 px-4 py-2 text-sm font-medium transition hover:bg-neutral-700"
          >
            {link.label}
          </a>
        ))}
      </section>

      <section className="space-y-4 rounded-xl bg-neutral-800/50 p-6">
        <h2 className="text-xl font-semibold">Biographie</h2>
        <p className="text-sm leading-relaxed text-neutral-300">
          {/* TODO : reprendre la biographie complète de YOLOGAZA, voir
          AI-Context/journal/2026-08-04.md */}
          Contenu à reprendre depuis l'ancienne page d'accueil.
        </p>
      </section>
    </div>
  )
}
