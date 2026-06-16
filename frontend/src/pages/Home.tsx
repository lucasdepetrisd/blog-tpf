import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, getProfile, type Post, type Profile } from '../api'

const PROMPT = '$ ls -lt posts/'

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function readingTime(content: string) {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.ceil(words / 200))
}

function firstLine(content: string) {
  const line = content.trim().split('\n')[0].replace(/^#+\s*/, '').trim()
  return line.length > 80 ? line.slice(0, 80) + '…' : line
}

function useTyping(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setDisplayed('')
    setDone(false)
    const tick = setInterval(() => {
      idx.current++
      setDisplayed(text.slice(0, idx.current))
      if (idx.current >= text.length) {
        clearInterval(tick)
        setDone(true)
      }
    }, speed)
    return () => clearInterval(tick)
  }, [text, speed])

  return { displayed, done }
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const { displayed, done } = useTyping(PROMPT)

  useEffect(() => {
    Promise.all([getPosts(), getProfile()])
      .then(([p, pr]) => { setPosts(p.data); setProfile(pr.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-zinc-500 text-sm">loading...</p>

  const filtered = posts
    .filter((p) => !search.trim() || p.title.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !activeTag || p.tags?.split(',').map((t) => t.trim()).includes(activeTag))

  const years = [...new Set(filtered.map((p) => new Date(p.created_at).getFullYear()))].sort((a, b) => b - a)

  return (
    <div className="space-y-10">
      <div className="pb-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <img
            src={profile?.has_photo ? '/api/profile/photo' : 'https://github.com/lucasdepetrisd.png?size=64'}
            alt={profile?.name ?? 'Lucas Depetris'}
            className="w-10 h-10 rounded-full object-cover border border-zinc-800"
          />
          <div>
            <h1 className="text-zinc-100 font-semibold">{profile?.name ?? 'Lucas Depetris'}</h1>
            {profile?.bio && (
              <p className="text-zinc-500 text-xs leading-relaxed line-clamp-1">{profile.bio}</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-zinc-600 text-xs">
            <span className="text-zinc-500">{displayed}</span>
            {!done && <span className="animate-pulse">▋</span>}
            {done && <span className="text-zinc-700"> ({posts.length})</span>}
          </p>
          {done && (
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="filter..."
              className="bg-transparent border-b border-zinc-800 focus:border-zinc-600 outline-none text-xs text-zinc-300 placeholder-zinc-700 pb-0.5 w-32 transition-colors"
            />
          )}
        </div>

        {activeTag && (
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{activeTag}</span>
            <button onClick={() => setActiveTag(null)} className="text-zinc-600 hover:text-zinc-400">× clear</button>
          </div>
        )}

        {filtered.length === 0 && (
          <p className="text-zinc-600 text-sm">no posts found.</p>
        )}

        {years.map((year) => (
          <div key={year}>
            <p className="text-zinc-700 text-xs mb-3">{year}</p>
            <div>
              {filtered
                .filter((p) => new Date(p.created_at).getFullYear() === year)
                .map((post) => (
                  <article key={post.id} className="group py-3 border-b border-zinc-900">
                    <div className="flex items-baseline justify-between gap-4">
                      <Link
                        to={`/post/${post.id}`}
                        className="text-zinc-200 hover:text-white font-medium leading-snug group-hover:underline underline-offset-4 decoration-zinc-700 truncate"
                      >
                        {post.title}
                      </Link>
                      <div className="flex items-baseline gap-3 shrink-0 text-xs text-zinc-600 tabular-nums">
                        <span>{readingTime(post.content)} min</span>
                        <span title={new Date(post.created_at).toLocaleDateString('en-CA')}>
                          {relativeDate(post.created_at)}
                        </span>
                      </div>
                    </div>
                    <p className="text-zinc-600 text-xs mt-1 truncate">{firstLine(post.content)}</p>
                    {post.tags && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {post.tags.split(',').map((t) => t.trim()).filter(Boolean).map((t) => (
                          <button
                            key={t}
                            onClick={() => setActiveTag(activeTag === t ? null : t)}
                            className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                              activeTag === t
                                ? 'bg-zinc-700 border-zinc-600 text-zinc-200'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
