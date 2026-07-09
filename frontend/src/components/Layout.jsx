import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import SkyBackground from './SkyBackground'
import ChatBot from './ChatBot'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',       icon: '▦' },
  { to: '/recommended', label: 'Recommended',      icon: '★' },
  { to: '/history',     label: 'Practice History', icon: '◷' },
  { to: '/mastery',     label: 'Topic Mastery',    icon: '◈' },
  { to: '/analytics',   label: 'Analytics',        icon: '◉' },
  { to: '/profile',     label: 'Profile',          icon: '◯' },
]

export default function Layout() {
  const location   = useLocation()
  const { logout } = useAuth()
  const { dark }   = useTheme()

  return (
    <div className="flex h-screen overflow-hidden">
      <SkyBackground />

      {/* Sidebar — glass panel over the sky */}
      <aside
        className="relative z-10 w-60 flex flex-col shrink-0 border-r border-white/10"
        style={{
          background:     dark ? 'rgba(4,6,12,0.72)' : 'rgba(5,70,130,0.78)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-lg font-bold text-indigo-300 tracking-wide">Code Compass</span>
          <p className="text-xs text-white/30 mt-0.5">Learn Coding Smarter</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white/90'
                    : 'text-white/40 hover:bg-white/6 hover:text-white/75'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-400 rounded-r-full shadow-[0_0_8px_2px_rgba(99,102,241,0.6)]" />
                  )}
                  <span className={isActive ? 'text-indigo-400' : ''}>{icon}</span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/35 hover:bg-red-900/20 hover:text-red-400 w-full transition-all duration-150"
          >
            <span>↩</span> Sign Out
          </button>
        </div>
      </aside>

      <ChatBot />

      {/* Main content — transparent, sky shows through */}
      <div className="flex-1 relative z-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="h-full overflow-y-auto"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
