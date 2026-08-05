import { useQuery } from '@tanstack/react-query'
import { fetchWeekInfo, getTodayKey } from '../../lib/api'

export function SchedulePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['week-info'],
    queryFn: fetchWeekInfo,
  })

  const todayKey = getTodayKey()
  const shows = data?.[todayKey] ?? []

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold capitalize">
        Planning du jour ({todayKey})
      </h1>

      {isLoading && <p className="text-neutral-400">Chargement du planning…</p>}
      {isError && (
        <p className="text-red-400">Impossible de charger le planning.</p>
      )}
      {!isLoading && !isError && shows.length === 0 && (
        <p className="text-neutral-400">Aucune émission programmée aujourd'hui.</p>
      )}

      <ul className="space-y-2">
        {shows.map((show) => (
          <li
            key={show.instance_id}
            className="flex items-center justify-between rounded-lg bg-neutral-800/60 px-4 py-3"
          >
            <span className="font-medium">{show.name}</span>
            <span className="text-sm text-neutral-400">
              {formatTime(show.starts)} – {formatTime(show.ends)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function formatTime(timestamp: string) {
  const [, time] = timestamp.split(' ')
  return time?.slice(0, 5) ?? timestamp
}
