import { useEffect, useState } from 'react'
import {
  ReactFlow, Background, Handle, Position, useNodesState, useReactFlow, ReactFlowProvider,
  type NodeTypes, type Node, type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface Health { api: boolean; db: boolean }

interface SchemaColumn { name: string; type: string; pk: boolean; nullable: boolean }
interface SchemaTable  { name: string; columns: SchemaColumn[] }
interface SchemaFK     { table: string; column: string; ref_table: string; ref_column: string }
interface Schema       { tables: SchemaTable[]; foreign_keys: SchemaFK[] }

const TABLE_W = 260

function buildERDNodes(tables: SchemaTable[]): Node[] {
  // distribuir en grid: máx 3 por fila
  return tables.map((t, i) => ({
    id: t.name,
    type: 'erdTable',
    position: { x: (i % 3) * (TABLE_W + 40), y: Math.floor(i / 3) * 260 },
    data: t as unknown as Record<string, unknown>,
  }))
}

function buildERDEdges(fks: SchemaFK[]): Edge[] {
  return fks.map((fk, i) => ({
    id: `fk-${i}`,
    source: fk.table,
    sourceHandle: fk.column,
    target: fk.ref_table,
    targetHandle: fk.ref_column,
    type: 'smoothstep',
    style: { stroke: '#6366f1', strokeWidth: 1.5 },
    animated: true,
    markerEnd: { type: 'arrowclosed' as const, color: '#6366f1' },
  }))
}

function ERDTableNode({ data }: { data: SchemaTable }) {
  return (
    <div
      className="rounded-lg overflow-hidden bg-zinc-900 border border-zinc-700 text-xs font-mono shadow-lg"
      style={{ width: TABLE_W, minWidth: TABLE_W }}
    >
      {/* header */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-3 py-2">
        <span className="text-indigo-400 font-semibold tracking-wide">{data.name}</span>
      </div>

      {/* rows */}
      {data.columns.map((col) => (
        <div key={col.name} className="relative flex items-center border-b border-zinc-800 last:border-0" style={{ height: 30 }}>
          {/* target handle (left) — usa el nombre de columna como id */}
          <Handle
            id={col.name}
            type="target"
            position={Position.Left}
            style={{ background: '#6366f1', border: 'none', width: 7, height: 7, left: -4 }}
          />

          <div className="flex items-center gap-2 px-3 w-full overflow-hidden">
            {col.pk
              ? <span className="text-[9px] text-amber-400 font-bold shrink-0 w-4">PK</span>
              : <span className="text-zinc-700 shrink-0 w-4">{col.nullable ? '' : '·'}</span>
            }
            <span className="text-zinc-200 flex-1 truncate">{col.name}</span>
            <span className="text-zinc-600 text-[10px] shrink-0">{col.type}</span>
          </div>

          {/* source handle (right) — mismo id que target */}
          <Handle
            id={col.name}
            type="source"
            position={Position.Right}
            style={{ background: '#6366f1', border: 'none', width: 7, height: 7, right: -4 }}
          />
        </div>
      ))}
    </div>
  )
}

const erdNodeTypes: NodeTypes = { erdTable: ERDTableNode }

function ERDFlow({ schema }: { schema: Schema }) {
  const [nodes, , onNodesChange] = useNodesState(buildERDNodes(schema.tables))
  const edges = buildERDEdges(schema.foreign_keys)
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={erdNodeTypes}
      fitView
      fitViewOptions={{ padding: 0.05 }}
      zoomOnScroll
      proOptions={{ hideAttribution: true }}
      colorMode="dark"
    >
      <Background color="#18181b" gap={20} size={1} />
    </ReactFlow>
  )
}

function ERDModal({ onClose }: { onClose: () => void }) {
  const [schema, setSchema] = useState<Schema | null>(null)

  useEffect(() => {
    fetch('/api/system/schema')
      .then(r => r.json())
      .then(setSchema)
      .catch(() => setSchema({ tables: [], foreign_keys: [] }))
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 w-full max-w-4xl mx-4 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Entity Relationship Diagram</h2>
            <p className="text-[10px] text-zinc-600 mt-0.5">PostgreSQL · CT 43362480DB · 172.16.90.207</p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-600 hover:text-zinc-300 text-xs border border-zinc-800 hover:border-zinc-600 rounded px-2 py-1 transition-colors"
          >
            esc
          </button>
        </div>

        <div className="border border-zinc-800 rounded-lg overflow-hidden" style={{ height: 480 }}>
          {schema
            ? <ReactFlowProvider><ERDFlow schema={schema} /></ReactFlowProvider>
            : <div className="flex items-center justify-center h-full text-zinc-600 text-xs">cargando schema...</div>
          }
        </div>
      </div>
    </div>
  )
}

const ICONS: Record<string, string> = {
  nginx:      'N',
  fastapi:    'F',
  react:      'R',
  postgresql: 'P',
  internet:   '⌁',
}

function Badge({ icon, color }: { icon: string; color: string }) {
  return (
    <span className={`w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center shrink-0 ${color}`}>
      {icon}
    </span>
  )
}

function StatusDot({ ok }: { ok: boolean | null }) {
  const color = ok === null ? 'bg-zinc-700' : ok ? 'bg-green-500' : 'bg-red-500'
  return <span className={`w-1.5 h-1.5 rounded-full ${color} shrink-0`} />
}

const hStyle = { background: '#3f3f46', border: 'none', width: 5, height: 5 }

function InternetNode({ data }: { data: { label: string; sub?: string } }) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-xs text-zinc-300 space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-base">🌐</span>
        <span>{data.label}</span>
      </div>
      {data.sub && <p className="text-zinc-600 text-[10px] pl-6">{data.sub}</p>}
      <Handle id="right" type="source" position={Position.Right} style={hStyle} />
    </div>
  )
}

function ServiceNode({ data }: { data: { label: string; sub: string; icon: string; iconColor: string; status: boolean | null; handles?: string[] } }) {
  const show = data.handles ?? ['left', 'top', 'bottom', 'right']
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs min-w-[140px] space-y-1.5">
      {show.includes('left')   && <Handle id="left"   type="target" position={Position.Left}   style={hStyle} />}
      {show.includes('top')    && <Handle id="top"    type="target" position={Position.Top}    style={hStyle} />}
      {show.includes('bottom') && <Handle id="bottom" type="source" position={Position.Bottom} style={hStyle} />}
      {show.includes('right')  && <Handle id="right"  type="source" position={Position.Right}  style={hStyle} />}
      <div className="flex items-center gap-2">
        <Badge icon={data.icon} color={data.iconColor} />
        <span className="text-zinc-100 font-medium">{data.label}</span>
        <StatusDot ok={data.status} />
      </div>
      <p className="text-zinc-600 text-[10px] pl-7">{data.sub}</p>
    </div>
  )
}

function DbNode({ data }: { data: { label: string; sub: string; icon: string; iconColor: string; status: boolean | null; handles?: string[]; onOpen?: () => void } }) {
  const show = data.handles ?? ['left', 'top']
  return (
    <div
      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs min-w-[140px] space-y-1.5 cursor-pointer hover:border-zinc-600 transition-colors"
      onClick={data.onOpen}
      title="Ver ERD"
    >
      {show.includes('left') && <Handle id="left" type="target" position={Position.Left} style={hStyle} />}
      {show.includes('top')  && <Handle id="top"  type="target" position={Position.Top}  style={hStyle} />}
      <div className="flex items-center gap-2">
        <Badge icon={data.icon} color={data.iconColor} />
        <span className="text-zinc-100 font-medium">{data.label}</span>
        <StatusDot ok={data.status} />
        <span className="text-zinc-700 text-[9px] ml-auto">ERD ↗</span>
      </div>
      <p className="text-zinc-600 text-[10px] pl-7">{data.sub}</p>
    </div>
  )
}

function GroupNode({ data }: { data: { label: string; ip: string; borderColor: string; labelColor: string; href?: string } }) {
  const inner = (
    <div className={`w-full h-full rounded-lg border border-dashed ${data.borderColor} relative group`}>
      <div className={`absolute -top-4 left-3 bg-zinc-950 px-1.5 text-[10px] font-medium ${data.labelColor} flex items-center gap-1.5`}>
        {data.href && <span className="opacity-60 group-hover:opacity-100 transition-opacity">↗</span>}
        {data.label}
        <span className="text-zinc-700 ml-1 font-normal">{data.ip}</span>
      </div>
      {data.href && (
        <div className="absolute -top-9 left-3 bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-[9px] text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          Abrir en Proxmox VE ↗
        </div>
      )}
    </div>
  )

  if (data.href) {
    return (
      <a href={data.href} target="_blank" rel="noreferrer" className="block w-full h-full cursor-pointer nodrag nopan">
        {inner}
      </a>
    )
  }
  return inner
}

function ProxmoxNode({ data }: { data: { label: string } }) {
  return (
    <div className="w-full h-full rounded-xl border border-dashed border-zinc-600 relative">
      <div className="absolute -top-4 left-3 bg-zinc-950 px-1.5 text-[10px] font-semibold text-zinc-400 tracking-wide uppercase">
        {data.label}
      </div>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  proxmox:  ProxmoxNode,
  group:    GroupNode,
  internet: InternetNode,
  service:  ServiceNode,
  db:       DbNode,
}

const edgeBase = { strokeWidth: 1.5 }
const mkEdge = (animated: boolean, label?: string): Partial<Edge> => ({
  animated,
  style: { ...edgeBase, stroke: animated ? '#52525b' : '#3f3f46' },
  label,
  labelStyle: { fill: '#71717a', fontSize: 9, fontFamily: 'ui-monospace,monospace' },
  labelBgStyle: { fill: '#09090b', fillOpacity: 0.85 },
  labelBgPadding: [3, 2] as [number, number],
})

function buildNodes(api: boolean | null, db: boolean | null, onOpenErd?: () => void): Node[] {
  // Layout:
  //   internet  →  [CT206: nginx | front ]
  //                          ↓      api  ]
  //               [CT207: postgres        ]
  return [
    { id: 'internet', type: 'internet',
      position: { x: 20, y: 100 },
      data: { label: 'Internet' } },

    { id: 'proxmox', type: 'proxmox',
      position: { x: 190, y: 20 },
      style: { width: 460, height: 400, background: 'transparent', border: 'none', padding: 0 },
      data: { label: 'Proxmox VE · nap.frt.utn.edu.ar · 45.6.5.34' } },

    // CT206: nginx a la izquierda, front + api a la derecha (columna)
    { id: 'ct206', type: 'group', parentId: 'proxmox', extent: 'parent',
      position: { x: 20, y: 30 },
      style: { width: 420, height: 200, background: 'transparent', border: 'none', padding: 0 },
      data: { label: 'CT 43362480A', ip: '172.16.90.206', borderColor: 'border-blue-900', labelColor: 'text-blue-500',
              href: 'https://nap.frt.utn.edu.ar/#v1:0:=lxc%2F206:4:::::::' } },

    { id: 'nginx', type: 'service', parentId: 'ct206', extent: 'parent',
      position: { x: 20, y: 70 },
      data: { label: 'nginx', sub: ':80 / :443', icon: ICONS.nginx, iconColor: 'bg-green-900 text-green-400', status: api, handles: ['left', 'right'] } },

    { id: 'frontend', type: 'service', parentId: 'ct206', extent: 'parent',
      position: { x: 240, y: 30 },
      data: { label: 'React', sub: 'dist/', icon: ICONS.react, iconColor: 'bg-sky-900 text-sky-400', status: api, handles: ['left'] } },

    { id: 'api', type: 'service', parentId: 'ct206', extent: 'parent',
      position: { x: 240, y: 120 },
      data: { label: 'FastAPI', sub: ':8000', icon: ICONS.fastapi, iconColor: 'bg-teal-900 text-teal-400', status: api, handles: ['left', 'bottom'] } },

    // CT207: postgres debajo de CT206
    { id: 'ct207', type: 'group', parentId: 'proxmox', extent: 'parent',
      position: { x: 20, y: 260 },
      style: { width: 420, height: 110, background: 'transparent', border: 'none', padding: 0 },
      data: { label: 'CT 43362480DB', ip: '172.16.90.207', borderColor: 'border-purple-900', labelColor: 'text-purple-400',
              href: 'https://nap.frt.utn.edu.ar/#v1:0:=lxc%2F207:4:::::::' } },

    { id: 'db', type: 'db', parentId: 'ct207', extent: 'parent',
      position: { x: 140, y: 30 },
      data: { label: 'PostgreSQL', sub: ':5432', icon: ICONS.postgresql, iconColor: 'bg-indigo-900 text-indigo-400', status: db, handles: ['top'], onOpen: onOpenErd } },
  ]
}

const EDGES: Edge[] = [
  { id: 'e1', source: 'internet', sourceHandle: 'right',  target: 'nginx',    targetHandle: 'left',  ...mkEdge(true,  'HTTP') },
  { id: 'e2', source: 'nginx',    sourceHandle: 'right',  target: 'api',      targetHandle: 'left',  ...mkEdge(true,  'proxy /api') },
  { id: 'e3', source: 'nginx',    sourceHandle: 'right',  target: 'frontend', targetHandle: 'left',  ...mkEdge(false, 'static') },
  { id: 'e4', source: 'api',      sourceHandle: 'bottom', target: 'db',       targetHandle: 'top',   ...mkEdge(true,  'SQL') },
]

function FlowContent({ api, db }: { api: boolean | null; db: boolean | null }) {
  const [erdOpen, setErdOpen] = useState(false)
  const [nodes, setNodes, onNodesChange] = useNodesState(
    buildNodes(api, db, () => setErdOpen(true))
  )
  const { fitView } = useReactFlow()

  useEffect(() => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === 'db') return { ...n, data: { ...n.data, status: db } }
        if (['nginx', 'api', 'frontend'].includes(n.id)) return { ...n, data: { ...n.data, status: api } }
        return n
      })
    )
  }, [api, db, setNodes])

  return (
    <>
      <ReactFlow
        nodes={nodes}
        edges={EDGES}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        zoomOnScroll={false}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background color="#18181b" gap={24} size={1} />
      </ReactFlow>
      <button
        onClick={() => { setNodes(buildNodes(api, db, () => setErdOpen(true))); setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50) }}
        className="absolute bottom-3 right-3 text-[10px] text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded px-2 py-1 bg-zinc-950 transition-colors"
      >
        reset view
      </button>
      {erdOpen && <ERDModal onClose={() => setErdOpen(false)} />}
    </>
  )
}

export default function InfraGraph() {
  const [health, setHealth] = useState<Health | null>(null)

  useEffect(() => {
    fetch('/api/system/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ api: false, db: false }))
  }, [])

  return (
    <div style={{ height: 500 }} className="relative border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
      <ReactFlowProvider>
        <FlowContent api={health?.api ?? null} db={health?.db ?? null} />
      </ReactFlowProvider>
    </div>
  )
}
