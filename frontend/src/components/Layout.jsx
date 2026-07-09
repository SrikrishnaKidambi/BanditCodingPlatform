import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',       icon: '▦' },
  { to: '/recommended', label: 'Recommended',      icon: '★' },
  { to: '/history',     label: 'Practice History', icon: '◷' },
  { to: '/mastery',     label: 'Topic Mastery',    icon: '◈' },
  { to: '/analytics',   label: 'Analytics',        icon: '◉' },
  { to: '/profile',     label: 'Profile',          icon: '◯' },
]

export default function Layout() {
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <aside className="w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col shrink-0">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-indigo-600">BanditLearn</span>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Adaptive Coding Practice</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-100 dark:border-gray-700 space-y-1">
          <button
            onClick={toggle}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 w-full transition-colors"
          >
            <span>{dark ? '☀' : '🌙'}</span>
            {dark ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100 w-full transition-colors"
          >
            <span>↩</span> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
