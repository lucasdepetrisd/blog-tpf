import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="space-y-3 text-sm">
      <p className="text-zinc-500 text-xs">
        <span className="text-zinc-600">bash:</span> {window.location.pathname}: No such file or directory
      </p>
      <p className="text-zinc-700 text-xs">exit code 404</p>
      <Link to="/" className="text-zinc-400 hover:text-zinc-100 transition-colors text-xs block mt-4">
        ← cd ~/
      </Link>
    </div>
  )
}
