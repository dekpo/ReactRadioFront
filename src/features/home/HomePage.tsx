const LINKS = [
  { label: 'Instagram', href: 'https://www.instagram.com/yologaza_akayolo/' },
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/intl-fr/artist/4tDRUg2AUL25TKOy9NphEe',
  },
  {
    label: 'Apple Music',
    href: 'https://music.apple.com/fr/artist/yologaza/1494924462',
  },
  {
    label: 'Shazam',
    href: 'https://www.shazam.com/artist/yologaza/1494924462',
  },
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
        <h2 className="text-xl font-semibold">Biography</h2>
        <div className="space-y-3 text-sm leading-relaxed text-neutral-300">
          <p>
            YOLOGAZA is a rapper/singer, songwriter and composer from Annecy,
            in the Auvergne-Rhône-Alpes region of France.
          </p>
          <p>
            Influenced by his father, a former member of a rap collective in
            the 90s, he became passionate about rap and songwriting from the
            age of 13.
          </p>
          <p>
            In his tracks, the Annecy-based artist tackles various subjects,
            sharing his doubts, fears, failures, but also his determination,
            faith and victories.
          </p>
          <p>
            With creative and highly distinct tracks, YOLOGAZA offers a full
            palette of emotions conveyed through bold instrumentals that bring
            color and, above all, innovation to the world of Hip Hop.
          </p>
        </div>
      </section>
    </div>
  )
}
