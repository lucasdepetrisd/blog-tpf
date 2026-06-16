import { useEffect, useState } from 'react'
import { getProfile, getChangelog, type Profile, type ChangelogEntry } from '../api'

const STACK = [
  { label: 'frontend',  value: 'React 19 + TypeScript + Vite',     host: 'CT 206 · 10.0.0.206' },
  { label: 'backend',   value: 'FastAPI + SQLAlchemy + Uvicorn',    host: 'CT 206 · 10.0.0.206' },
  { label: 'database',  value: 'PostgreSQL 16',                     host: 'CT 207 · 10.0.0.207' },
  { label: 'proxy',     value: 'nginx (reverse proxy)',             host: 'CT 206 · 10.0.0.206' },
  { label: 'infra',     value: 'Proxmox VE · LXC containers',      host: 'UTN FRT' },
]

function Row({ label, value, host }: { label: string; value: string; host: string }) {
  return (
    <div className="flex items-baseline gap-2 py-2 border-b border-zinc-900 text-xs">
      <span className="text-zinc-600 w-20 shrink-0">{label}</span>
      <span className="text-zinc-300 flex-1">{value}</span>
      <span className="text-zinc-600 tabular-nums">{host}</span>
    </div>
  )
}

export default function About() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProfile(), getChangelog()])
      .then(([p, c]) => { setProfile(p.data); setChangelog(c.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-zinc-500 text-sm">loading...</p>

  return (
    <div className="space-y-12">

      {/* Perfil */}
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
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">github ↗</a>
              <a href="https://www.linkedin.com/in/lucasdepetris/" target="_blank" rel="noreferrer"
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">linkedin ↗</a>
            </div>
          </div>
        </div>
      </div>

      {/* Info del proyecto */}
      <div>
        <p className="text-zinc-600 text-xs mb-6">
          <span className="text-zinc-500">$</span> cat proyecto.md
        </p>
        <div className="border border-zinc-800 rounded p-4 space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-zinc-100">Blog Personal · TPF Virtualización</h2>
            <span className="text-xs text-zinc-600">UTN FRT</span>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Trabajo Práctico Final de la materia <span className="text-zinc-300">Virtualización</span> de la
            carrera Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán.
          </p>
          <div className="flex gap-6 text-xs pt-1">
            <div>
              <span className="text-zinc-600">alumno</span>
              <p className="text-zinc-300 mt-0.5">Lucas Depetris</p>
            </div>
            <div>
              <span className="text-zinc-600">legajo</span>
              <p className="text-zinc-300 mt-0.5">52432</p>
            </div>
            <div>
              <span className="text-zinc-600">año</span>
              <p className="text-zinc-300 mt-0.5">2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stack e infra */}
      <div>
        <p className="text-zinc-600 text-xs mb-6">
          <span className="text-zinc-500">$</span> docker inspect blog
        </p>
        <div>
          <div className="flex items-baseline gap-2 pb-2 text-xs text-zinc-600 border-b border-zinc-800">
            <span className="w-20 shrink-0">servicio</span>
            <span className="flex-1">tecnología</span>
            <span>host</span>
          </div>
          {STACK.map((s) => <Row key={s.label} {...s} />)}
        </div>
      </div>

      {/* PDF */}
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

      {/* Changelog */}
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
