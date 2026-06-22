import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { getProfile, getSystemInfo, BASE, type Profile, type SystemInfo } from '../api'
import InfraGraph from '../components/InfraGraph'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

type Tab = 'about' | 'infra' | 'system' | 'docs'

const TABS: { id: Tab; label: string; cmd: string }[] = [
  { id: 'about',  label: 'about',  cmd: 'cat about.md'              },
  { id: 'infra',  label: 'infra',  cmd: 'pvesh get /nodes/pve/lxc'  },
  { id: 'system', label: 'system', cmd: 'neofetch'                   },
  { id: 'docs',   label: 'docs',   cmd: 'ls docs/'                   },
]

function Bar({ percent }: { percent: number }) {
  return (
    <div className="w-16 h-1 bg-zinc-800 rounded overflow-hidden inline-block align-middle ml-1">
      <div className="h-full bg-zinc-500 rounded" style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function About() {
  const [tab, setTab] = useState<Tab>('about')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sysinfo, setSysinfo] = useState<SystemInfo | null>(null)
  const [pdfExists, setPdfExists] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getProfile(), getSystemInfo()])
      .then(([p, s]) => { setProfile(p.data); setSysinfo(s.data) })
      .finally(() => setLoading(false))

    fetch(`${BASE}/api/system/pdf-status`)
      .then(r => r.json())
      .then(d => setPdfExists(d.exists))

    const es = new EventSource(`${BASE}/api/system/stream`)
    es.onmessage = (e) => setSysinfo(JSON.parse(e.data))
    return () => es.close()
  }, [])

  if (loading) return <p className="text-zinc-500 text-sm">loading...</p>

  const active = TABS.find(t => t.id === tab)!

  return (
    <div className="space-y-6">

      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-0">
        {TABS.filter(t => t.id !== 'docs' || pdfExists).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'text-zinc-100 border-zinc-400'
                : 'text-zinc-600 border-transparent hover:text-zinc-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Prompt */}
      <p className="text-zinc-600 text-xs">
        <span className="text-zinc-500">$</span> {active.cmd}
        {tab === 'system' && <span className="text-zinc-700 ml-2 animate-pulse">●</span>}
      </p>

      {/* Tab: about */}
      {tab === 'about' && (
        <div className="space-y-6">

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

          <div className="border border-zinc-800 rounded p-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-zinc-100">Blog Personal · TPF Virtualización</h2>
              <span className="text-xs text-zinc-600">UTN FRT</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Trabajo Práctico Final de la materia <span className="text-zinc-300">Virtualización</span> de la
              carrera Ingeniería en Sistemas de Información, UTN Facultad Regional Tucumán.
            </p>
            <div className="flex items-center justify-between pt-1">
              <div className="flex gap-6 text-xs">
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
              {pdfExists ? (
                <a
                  href="/static/informe.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 border border-zinc-800 rounded px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-colors shrink-0"
                >
                  <span className="text-zinc-600">↓</span> informe-tpf.pdf
                </a>
              ) : (
                <span className="text-xs text-zinc-700 shrink-0">informe no disponible</span>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Tab: infra */}
      {tab === 'infra' && (
        <div className="space-y-8">

          <InfraGraph />

          <div>
            <p className="text-zinc-600 text-xs mb-4">
              <span className="text-zinc-500">$</span> pct config 43362480A
            </p>
            <div>
              <div className="flex gap-2 pb-2 text-xs text-zinc-600 border-b border-zinc-800">
                <span className="w-20 shrink-0">servicio</span>
                <span className="flex-1">tecnología</span>
                <span>host</span>
              </div>
              {[
                { label: 'frontend', value: 'React 19 + TypeScript + Vite',  host: 'CT 43362480A · 172.16.90.206' },
                { label: 'backend',  value: 'FastAPI + SQLAlchemy + Uvicorn', host: 'CT 43362480A · 172.16.90.206' },
                { label: 'database', value: 'PostgreSQL 16',                  host: 'CT 43362480DB · 172.16.90.207' },
                { label: 'proxy',    value: 'nginx (reverse proxy)',          host: 'CT 43362480A · 172.16.90.206' },
                { label: 'infra',    value: 'Proxmox VE · LXC containers',   host: 'UTN FRT' },
              ].map(({ label, value, host }) => (
                <div key={label} className="flex gap-2 py-2 border-b border-zinc-900 text-xs">
                  <span className="text-zinc-600 w-20 shrink-0">{label}</span>
                  <span className="text-zinc-300 flex-1">{value}</span>
                  <span className="text-zinc-600 tabular-nums">{host}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab: system */}
      {tab === 'system' && (
        <div className="space-y-8">

          {sysinfo ? (
            <div className="border border-zinc-800 rounded p-4 space-y-2 text-xs">
              {[
                ['hostname', sysinfo.hostname],
                ['os',       sysinfo.os],
                ['arch',     sysinfo.arch],
                ['ip',       sysinfo.ip],
                ['uptime',   sysinfo.uptime],
                ['cpu',      `${sysinfo.cpu_count} cores · ${sysinfo.cpu_percent}%`],
                ['memory',   `${sysinfo.mem_used_mb} / ${sysinfo.mem_total_mb} MB`],
                ['disk',     `${sysinfo.disk_used_gb} / ${sysinfo.disk_total_gb} GB`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span className="text-zinc-600 w-20 shrink-0">{k}</span>
                  <span className="text-zinc-300">{v}</span>
                  {k === 'memory' && <Bar percent={sysinfo.mem_percent} />}
                  {k === 'disk'   && <Bar percent={sysinfo.disk_percent} />}
                  {k === 'cpu'    && <Bar percent={sysinfo.cpu_percent} />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-zinc-600 text-xs">unavailable</p>
          )}


</div>
      )}

      {/* Tab: docs */}
      {tab === 'docs' && (
        <PdfViewer url="/static/informe.pdf" />
      )}

    </div>
  )
}

function PdfViewer({ url }: { url: string }) {
  const [pages, setPages] = useState<number>(0)
  const [page, setPage] = useState(1)
  const [width, setWidth] = useState(680)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="border border-zinc-800 rounded px-3 py-1.5 hover:border-zinc-600 hover:text-zinc-300 transition-colors"
        >
          ↓ descargar PDF
        </a>
        {pages > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 border border-zinc-800 rounded hover:border-zinc-600 disabled:opacity-30 transition-colors"
            >
              ←
            </button>
            <span className="tabular-nums">{page} / {pages}</span>
            <button
              onClick={() => setPage(p => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="px-2 py-1 border border-zinc-800 rounded hover:border-zinc-600 disabled:opacity-30 transition-colors"
            >
              →
            </button>
          </div>
        )}
      </div>

      <div ref={containerRef} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
        <Document
          file={url}
          onLoadSuccess={({ numPages }) => setPages(numPages)}
          onItemClick={({ pageNumber }) => setPage(pageNumber)}
          loading={<p className="text-zinc-600 text-xs p-8">cargando PDF...</p>}
          error={<p className="text-zinc-600 text-xs p-8">no se pudo cargar el PDF.</p>}
        >
          <Page
            pageNumber={page}
            width={width}
            renderTextLayer
            renderAnnotationLayer
          />
        </Document>
      </div>
    </div>
  )
}
