import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/navigation/Sidebar'
import { BottomNav } from '../components/navigation/BottomNav'
import { BottomPlayer } from '../features/player/BottomPlayer'

export function AppLayout() {
  return (
    <div className="flex h-screen flex-col bg-black text-white">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-neutral-900 p-4 pb-40 md:m-2 md:rounded-lg md:pb-24">
          <Outlet />
        </main>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomPlayer />
        <BottomNav />
      </div>
    </div>
  )
}
