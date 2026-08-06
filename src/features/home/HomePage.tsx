import {
  SiApplemusic,
  SiInstagram,
  SiShazam,
  SiSpotify,
  SiYoutube,
} from 'react-icons/si'
import { ImageCarousel } from './ImageCarousel'

const LINKS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/yologaza_akayolo/',
    Icon: SiInstagram,
  },
  {
    label: 'YouTube',
    href: 'https://www.youtube.com/@YOLOGAZAOfficiel',
    Icon: SiYoutube,
  },
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/intl-fr/artist/4tDRUg2AUL25TKOy9NphEe',
    Icon: SiSpotify,
  },
  {
    label: 'Apple Music',
    href: 'https://music.apple.com/fr/artist/yologaza/1494924462',
    Icon: SiApplemusic,
  },
  {
    label: 'Shazam',
    href: 'https://www.shazam.com/artist/yologaza/1494924462',
    Icon: SiShazam,
  },
]

const CAROUSEL_IMAGES = [1, 2, 3, 4].map((n) => ({
  src: `/carousel/yologaza-${n}.jpeg`,
  alt: `YOLOGAZA — photo ${n}`,
}))

export function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 text-white">
      <section className="rounded-xl bg-gradient-to-b from-red-900/40 to-transparent p-6">
        <h1 className="text-2xl font-bold">Radio Yologaza !</h1>
        <p className="mt-1 text-sm text-neutral-400">Propulsé par La Familia</p>
      </section>

      <section className="flex flex-wrap gap-3">
        {LINKS.map(({ label, href, Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-neutral-800 text-xl transition hover:bg-neutral-700"
          >
            <Icon />
          </a>
        ))}
      </section>

      <ImageCarousel images={CAROUSEL_IMAGES} />

      <section className="space-y-4 rounded-xl bg-neutral-800/50 p-6">
        <h2 className="text-xl font-semibold">Biographie</h2>
        <div className="space-y-3 text-sm leading-relaxed text-neutral-300">
          <p>
            YOLOGAZA est un rappeur/chanteur, auteur et compositeur.
          </p>
          <p>
            Influencé par son père, ancien membre d'un collectif de rap dans
            les années 90, c'est à partir de ses 13 ans qu'il se passionne
            pour le rap et l'écriture.
          </p>
          <p>
            Dans ses morceaux, l'artiste aborde divers sujets et nous fait
            part de ses doutes, ses peurs, ses échecs mais aussi de sa
            détermination, sa foi et ses victoires.
          </p>
          <p>
            Avec des titres créatifs et plus différents les uns des autres,
            YOLOGAZA nous propose toute une palette d'émotion transmise au
            travers d'instrumentales osées venant donner de la couleur et
            surtout de l'innovation dans le monde du Hip Hop.
          </p>
        </div>
      </section>

      <section className="space-y-3 rounded-xl bg-neutral-800/50 p-6">
        <h2 className="text-xl font-semibold">À propos de la radio</h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-relaxed text-neutral-300">
          <span>
            Vous voulez des infos sur cette radio et/ou être diffusé…
            contactez l'artiste YOLOGAZA sur
          </span>
          <a
            href="https://www.instagram.com/yologaza_akayolo/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition hover:bg-neutral-200"
          >
            <SiInstagram /> Instagram
          </a>
          <span>!</span>
        </p>
      </section>
    </div>
  )
}
