import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/navigation/Sidebar'
import { BottomNav } from '../components/navigation/BottomNav'
import { BottomPlayer } from '../features/player/BottomPlayer'
import { ConnectionBanner } from '../features/player/ConnectionBanner'
import { NowPlayingOverlay } from '../features/player/NowPlayingOverlay'
import { usePlayerStore } from '../features/player/playerStore'
import { ConsentModal } from '../features/auth/ConsentModal'
import { useAuthStore } from '../features/auth/authStore'

export function AppLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const location = useLocation()
  const collapsePlayer = usePlayerStore((state) => state.collapse)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  // Whenever a main navigation page is opened (sidebar/bottom nav links, or
  // the privacy policy link from inside the consent modal), close the
  // fullscreen now-playing overlay so the newly loaded page is actually
  // visible instead of being hidden behind it.
  useEffect(() => {
    collapsePlayer()
  }, [location.pathname, collapsePlayer])

  return (
    <div className="flex h-dvh flex-col bg-black text-white">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 pb-40 md:m-2 md:rounded-lg md:pb-24">
          <Outlet />
        </main>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <ConnectionBanner />
        <BottomPlayer />
        <BottomNav />
      </div>
      <NowPlayingOverlay />
      <ConsentModal />
    </div>
  )
}
