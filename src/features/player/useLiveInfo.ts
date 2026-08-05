import { useQuery } from '@tanstack/react-query'
import { fetchLiveInfo } from '../../lib/api'

// Shared query key/config so BottomPlayer and NowPlayingOverlay reuse the
// same cached data instead of polling the API twice.
export function useLiveInfo() {
  return useQuery({
    queryKey: ['live-info'],
    queryFn: fetchLiveInfo,
    refetchInterval: 4000,
  })
}
