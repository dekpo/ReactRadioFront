// Client pour l'API LibreTime "legacy" existante (publique, lecture seule,
// sans authentification). Voir AI-Context/handoff-frontend-redesign/technical-context.md
// pour le détail des endpoints et des formats de réponse.

export interface LiveTrack {
  starts: string
  ends: string
  type: string
  name: string
  metadata: {
    track_title: string
    artist_name: string
    artwork_url: string
  }
}

export interface LiveShow {
  name: string
  starts: string
  ends: string
}

export interface LiveInfo {
  schedulerTime: string
  current: LiveTrack | null
  next: LiveTrack | null
  currentShow: LiveShow[]
  nextShow: LiveShow[]
  timezone: string
}

export interface ScheduleItem {
  name: string
  start_timestamp: string
  end_timestamp: string
  starts: string
  ends: string
  id: number
  instance_id: number
  image_path: string
}

export type WeekInfo = Record<string, ScheduleItem[]>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`Requête ${path} échouée (${res.status})`)
  }
  return res.json() as Promise<T>
}

// LibreTime's legacy API returns HTML-escaped text in several string fields
// (track/show/artist names, artwork_url's "&amp;"...) — e.g. an apostrophe
// comes back as "&#039;" instead of "'". Since all user-facing content on
// this site is French (accents, cedillas, apostrophes are everywhere), any
// unescaped field would render garbled. `textarea.innerHTML` is a reliable
// browser-native way to decode *any* HTML entity (named or numeric) without
// pulling in a dependency; the element is never attached to the DOM.
function decodeHtmlEntities(text: string): string {
  if (typeof document === 'undefined') return text
  const el = document.createElement('textarea')
  el.innerHTML = text
  return el.value
}

function normalizeShow(show: LiveShow): LiveShow {
  return { ...show, name: decodeHtmlEntities(show.name) }
}

function normalizeTrack<T extends LiveTrack | undefined | null>(track: T): T {
  if (!track) return track
  return {
    ...track,
    name: decodeHtmlEntities(track.name),
    metadata: {
      ...track.metadata,
      track_title: decodeHtmlEntities(track.metadata.track_title),
      artist_name: decodeHtmlEntities(track.metadata.artist_name),
      artwork_url: track.metadata.artwork_url
        ? decodeHtmlEntities(track.metadata.artwork_url)
        : track.metadata.artwork_url,
    },
  }
}

export async function fetchLiveInfo() {
  const data = await getJson<LiveInfo>('/api/live-info')
  return {
    ...data,
    current: normalizeTrack(data.current),
    next: normalizeTrack(data.next),
    currentShow: (data.currentShow ?? []).map(normalizeShow),
    nextShow: (data.nextShow ?? []).map(normalizeShow),
  }
}

export async function fetchWeekInfo() {
  const data = await getJson<WeekInfo>('/api/week-info')
  const normalized: WeekInfo = {}
  for (const [day, items] of Object.entries(data)) {
    // The endpoint also returns a stray `AIRTIME_API_VERSION` string key
    // alongside the day arrays — skip anything that isn't actually a list.
    normalized[day] = Array.isArray(items)
      ? items.map((item) => ({ ...item, name: decodeHtmlEntities(item.name) }))
      : items
  }
  return normalized
}

export const STREAM_URL = '/stream.mp3'

/** Clés de jour (anglais, minuscules) attendues par /api/week-info. */
const DAY_KEYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const

/** Libellés français correspondants, pour l'affichage uniquement. */
const DAY_LABELS_FR: Record<string, string> = {
  sunday: 'dimanche',
  monday: 'lundi',
  tuesday: 'mardi',
  wednesday: 'mercredi',
  thursday: 'jeudi',
  friday: 'vendredi',
  saturday: 'samedi',
}

/** Retourne la clé du jour courant (fuseau Europe/Paris) pour filtrer /api/week-info. */
export function getTodayKey(): string {
  const parisNow = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }),
  )
  return DAY_KEYS[parisNow.getDay()]
}

/** Libellé français d'une clé de jour (ex. "monday" -> "lundi"). */
export function getDayLabelFr(dayKey: string): string {
  return DAY_LABELS_FR[dayKey] ?? dayKey
}
