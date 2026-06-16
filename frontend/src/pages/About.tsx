import { useEffect, useState } from 'react'
import { getProfile, getChangelog, type Profile, type ChangelogEntry } from '../api'

export default function About() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProfile(), getChangelog()])
      .then(([p, c]) => {
        setProfile(p.data)
        setChangelog(c.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-zinc-500 text-sm">loading...</p>

  return (
    <div className="space-y-12">
      <div>
        <p className="text-zinc-600 text-xs mb-6">
          <span className="text-zinc-500">$</span> cat about.md
        </p>
        <div className="flex items-start gap-6">
          <img
            src={profile?.has_photo ? '/api/profile/photo' : 'https://github.com/lucasdepetrisd.png?size=160'}
            alt={profile?.name ?? 'Lucas Depetris'}
            className="w-20 h-20 rounded-full object-cover border border-zinc-800 shrink-0"
          />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-zinc-100">{profile?.name}</h1>
            {profile?.bio ? (
              <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-zinc-600 text-sm italic">no bio yet.</p>
            )}
            <div className="flex gap-4 pt-1">
              <a href="https://github.com/lucasdepetrisd" target="_blank" rel="noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                github ↗
              </a>
              <a href="https://www.linkedin.com/in/lucasdepetris/" target="_blank" rel="noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                linkedin ↗
              </a>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="text-zinc-600 text-xs mb-6">
          <span className="text-zinc-500">$</span> ls docs/
        </p>
        <a
          href="/static/informe.pdf"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 border border-zinc-800 rounded px-4 py-2.5 text-sm text-zinc-300 hover:border-zinc-600 hover:text-zinc-100 transition-colors"
        >
          <span className="text-zinc-600">↓</span> informe-tpf.pdf
        </a>
      </div>

      {changelog.length > 0 && (
        <div>
          <p className="text-zinc-600 text-xs mb-6">
            <span className="text-zinc-500">$</span> cat CHANGELOG.md
          </p>
          <div className="space-y-4">
            {changelog.map((entry) => (
              <div key={entry.id} className="border-l-2 border-zinc-800 pl-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-zinc-100 text-sm font-medium">{entry.version}</span>
                  <span className="text-zinc-600 text-xs tabular-nums">{entry.date}</span>
                </div>
                <p className="text-zinc-400 text-sm mt-1 leading-relaxed">{entry.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
