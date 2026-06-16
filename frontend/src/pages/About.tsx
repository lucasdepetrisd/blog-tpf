import { useEffect, useState } from 'react'
import { getProfile, getChangelog, getSystemInfo, type Profile, type ChangelogEntry, type SystemInfo } from '../api'

function Bar({ percent }: { percent: number }) {
  return (
    <div className="w-16 h-1 bg-zinc-800 rounded overflow-hidden inline-block align-middle ml-1">
      <div className="h-full bg-zinc-500 rounded" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function About() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([])
  const [sysinfo, setSysinfo] = useState<SystemInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProfile(), getChangelog(), getSystemInfo()])
      .then(([p, c, s]) => { setProfile(p.data); setChangelog(c.data); setSysinfo(s.data) })
      .finally(() => setLoading(false))

    const interval = setInterval(() => {
      getSystemInfo().then((s) => setSysinfo(s.data))
    }, 500)
    return () => clearInterval(interval)
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
          <span className="text-zinc-500">$</span> neofetch
        </p>
        {sysinfo ? (
          <div className="border border-zinc-800 rounded p-4 space-y-2 text-xs">
            {[
              ['hostname',  sysinfo.hostname],
              ['os',        sysinfo.os],
              ['arch',      sysinfo.arch],
              ['ip',        sysinfo.ip],
              ['uptime',    sysinfo.uptime],
              ['cpu',       `${sysinfo.cpu_count} cores · ${sysinfo.cpu_percent}%`],
              ['memory',    `${sysinfo.mem_used_mb} / ${sysinfo.mem_total_mb} MB`],
              ['disk',      `${sysinfo.disk_used_gb} / ${sysinfo.disk_total_gb} GB`],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-2">
                <span className="text-zinc-600 w-20 shrink-0">{k}</span>
                <span className="text-zinc-300">{v}</span>
                {k === 'memory' && <Bar percent={sysinfo.mem_percent} />}
                {k === 'disk' && <Bar percent={sysinfo.disk_percent} />}
                {k === 'cpu' && <Bar percent={sysinfo.cpu_percent} />}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 text-xs">unavailable</p>
        )}
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
