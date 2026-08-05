import { NavLink } from 'react-router-dom'
import { Home, Calendar, Library } from 'lucide-react'

const links = [
  { to: '/', label: 'Accueil', icon: Home },
  { to: '/planning', label: 'Planning', icon: Calendar },
  { to: '/bibliotheque', label: 'Bibliothèque', icon: Library },
]

export function BottomNav() {
  return (
    <nav className="flex justify-around border-t border-neutral-800 bg-black py-2 md:hidden">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-3 py-1 text-xs ${
              isActive ? 'text-white' : 'text-neutral-400'
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
