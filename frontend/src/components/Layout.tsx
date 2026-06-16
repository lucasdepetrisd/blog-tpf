import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuth, doLogout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    doLogout()
    navigate('/')
  }

  return (
    <div className="min-h-screen text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4">
        <nav className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-zinc-100 font-semibold tracking-tight hover:text-white">
            ~/blog
          </Link>
          <div className="flex gap-6 text-sm text-zinc-400">
            <Link to="/" className="hover:text-zinc-100 transition-colors">posts</Link>
            <Link to="/about" className="hover:text-zinc-100 transition-colors">about</Link>
            {isAuth ? (
              <>
                <Link to="/admin" className="hover:text-zinc-100 transition-colors">admin</Link>
                <button onClick={handleLogout} className="hover:text-zinc-100 transition-colors cursor-pointer">
                  logout
                </button>
              </>
            ) : (
              <Link to="/login" className="hover:text-zinc-100 transition-colors">login</Link>
            )}
          </div>
        </nav>
      </header>
      <main className="max-w-2xl mx-auto px-6 py-10">
        {children}
      </main>
      <footer className="border-t border-zinc-800 px-6 py-4 mt-auto">
        <div className="max-w-2xl mx-auto flex items-center justify-between text-xs text-zinc-600">
          <span>lucas depetris · {new Date().getFullYear()}</span>
          <div className="flex gap-4">
            <a href="https://github.com/lucasdepetrisd" target="_blank" rel="noreferrer"
              className="hover:text-zinc-400 transition-colors">github</a>
            <a href="https://www.linkedin.com/in/lucasdepetris/" target="_blank" rel="noreferrer"
              className="hover:text-zinc-400 transition-colors">linkedin</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
