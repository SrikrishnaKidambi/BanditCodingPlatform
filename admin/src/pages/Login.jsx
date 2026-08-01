import { useState } from 'react'
import { adminAuthAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function CompassIcon({ className = 'w-8 h-8' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  )
}

export default function Login() {
  const { login } = useAuth()
  const [mode, setMode]       = useState('login')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const fn  = mode === 'login' ? adminAuthAPI.login : adminAuthAPI.register
      const res = await fn(email, password)
      login(res.data.token, res.data.admin)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3 text-white">
          <CompassIcon className="w-9 h-9 text-indigo-400" />
          <div>
            <div className="text-lg font-bold leading-tight">Code Compass</div>
            <div className="text-xs text-slate-400 leading-tight">Admin Portal</div>
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-white leading-snug mb-4">
            Manage your<br />question bank
          </h1>
          <p className="text-slate-400 text-sm mb-10">
            Add, organise, and import DSA questions that power the adaptive learning engine.
          </p>
          <ul className="space-y-4">
            {[
              { icon: '◈', title: 'Question Management', desc: 'Add, search, and delete questions' },
              { icon: '⬆', title: 'Excel Bulk Import',   desc: 'Upload hundreds of questions at once' },
              { icon: '⬡', title: 'Topic Management',    desc: 'Grow the curriculum over time' },
            ].map(f => (
              <li key={f.title} className="flex items-start gap-3">
                <span className="text-indigo-400 text-lg mt-0.5">{f.icon}</span>
                <div>
                  <div className="text-sm font-medium text-white">{f.title}</div>
                  <div className="text-xs text-slate-500">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-slate-600">
          Code Compass Admin · Restricted access
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <CompassIcon className="w-7 h-7 text-indigo-600" />
            <span className="font-bold text-slate-800">Code Compass Admin</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            {mode === 'login' ? 'Welcome back' : 'Create admin account'}
          </h2>
          <p className="text-sm text-slate-500 mb-7">
            {mode === 'login'
              ? 'Sign in to access the admin portal.'
              : 'Set up a new admin account.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPass(e.target.value)}
                placeholder={mode === 'login' ? '••••••••' : 'Min 8 characters'}
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60 transition-colors mt-1"
            >
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign in →' : 'Create account →')}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? (
              <>Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setError('') }} className="text-indigo-600 hover:underline font-medium">
                  Register
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => { setMode('login'); setError('') }} className="text-indigo-600 hover:underline font-medium">
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
