import { NavLink } from 'react-router-dom'
import { Home, Calendar, Library } from 'lucide-react'

const links = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/planning', label: 'Planning du jour', icon: Calendar },
  { to: '/bibliotheque', label: 'Bibliothèque', icon: Library },
]

export function Sidebar() {
  return (
    <nav className="hidden w-60 flex-col gap-2 bg-black p-4 md:flex">
      <div className="mb-4 px-2 text-lg font-bold">Radio Yologaza</div>
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
            }`
          }
        >
          <Icon size={20} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
