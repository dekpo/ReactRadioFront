import { useQuery } from '@tanstack/react-query'
import { fetchLiveInfo } from '../../lib/api'

// Shared query key/config so BottomPlayer and NowPlayingOverlay reuse the
// same cached data instead of polling the API twice.
export function useLiveInfo() {
  return useQuery({
    queryKey: ['live-info'],
    queryFn: fetchLiveInfo,
    refetchInterval: 4000,
    // By default TanStack Query stops its interval polling entirely once the
    // tab/window loses focus (e.g. screen locked, app backgrounded) — but the
    // live audio stream keeps playing regardless (handled natively by the
    // browser, not by our JS). Without this, track metadata (and therefore
    // the OS lock screen info) simply freezes on whatever was current the
    // moment the screen locked. Keep polling in the background so the lock
    // screen can catch up on track changes.
    refetchIntervalInBackground: true,
  })
}
