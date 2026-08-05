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

export function fetchLiveInfo() {
  return getJson<LiveInfo>('/api/live-info')
}

export function fetchWeekInfo() {
  return getJson<WeekInfo>('/api/week-info')
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

/** Retourne la clé du jour courant (fuseau Europe/Paris) pour filtrer /api/week-info. */
export function getTodayKey(): string {
  const parisNow = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Europe/Paris' }),
  )
  return DAY_KEYS[parisNow.getDay()]
}
