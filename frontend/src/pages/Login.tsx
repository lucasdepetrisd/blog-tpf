import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Login() {
  const { doLogin, isAuth } = useAuth()
  const navigate = useNavigate()
  const [user, setUser] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuth) {
    navigate('/admin')
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await doLogin(user, pass)
      navigate('/admin')
    } catch {
      setError('credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500'

  return (
    <div className="max-w-sm mx-auto pt-16">
      <p className="text-zinc-600 text-xs mb-6">
        <span className="text-zinc-500">$</span> sudo -i
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">username</label>
          <input
            type="text"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            placeholder="admin"
            className={inputClass}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">password</label>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
            required
          />
        </div>
        {error && <p className="text-red-500 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-sm py-2 rounded transition-colors disabled:opacity-50"
        >
          {loading ? 'authenticating...' : 'login'}
        </button>
      </form>
    </div>
  )
}
