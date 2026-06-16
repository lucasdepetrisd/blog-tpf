import { useEffect, useState } from 'react'
import {
  ReactFlow, Background, Handle, Position,
  type NodeTypes, type Node, type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

interface Health { api: boolean; db: boolean }

function Dot({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 inline-block" />
  return <span className={`w-1.5 h-1.5 rounded-full inline-block ${ok ? 'bg-green-500' : 'bg-red-500'}`} />
}

function GroupNode({ data }: { data: { label: string; ip: string } }) {
  return (
    <div className="w-full h-full rounded border border-dashed border-zinc-700 relative">
      <div className="absolute -top-4 left-2 bg-zinc-950 px-1.5 text-xs text-zinc-500">
        {data.label}
        <span className="text-zinc-700 ml-2">{data.ip}</span>
      </div>
    </div>
  )
}

function ProxmoxNode({ data }: { data: { label: string } }) {
  return (
    <div className="w-full h-full rounded border border-dashed border-zinc-600 relative">
      <div className="absolute -top-4 left-2 bg-zinc-950 px-1.5 text-xs text-zinc-400 font-medium">
        {data.label}
      </div>
    </div>
  )
}

const hStyle = { background: '#52525b', border: 'none', width: 6, height: 6 }

function InternetNode({ data }: { data: { label: string } }) {
  return (
    <div className="bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-400 text-center">
      {data.label}
      <Handle id="right" type="source" position={Position.Right} style={hStyle} />
    </div>
  )
}

function ServiceNode({ data }: { data: { label: string; sub: string; status: boolean | null } }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs space-y-0.5 min-w-[130px]">
      <Handle id="left"   type="target" position={Position.Left}   style={hStyle} />
      <Handle id="top"    type="target" position={Position.Top}    style={hStyle} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={hStyle} />
      <Handle id="right"  type="source" position={Position.Right}  style={hStyle} />
      <div className="flex items-center gap-1.5">
        <Dot ok={data.status} />
        <span className="text-zinc-100 font-medium">{data.label}</span>
      </div>
      <p className="text-zinc-600 pl-3">{data.sub}</p>
    </div>
  )
}

function DbNode({ data }: { data: { label: string; sub: string; status: boolean | null } }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs space-y-0.5 min-w-[130px]">
      <Handle id="left" type="target" position={Position.Left}  style={hStyle} />
      <Handle id="top"  type="target" position={Position.Top}   style={hStyle} />
      <div className="flex items-center gap-1.5">
        <Dot ok={data.status} />
        <span className="text-zinc-100 font-medium">{data.label}</span>
      </div>
      <p className="text-zinc-600 pl-3">{data.sub}</p>
    </div>
  )
}

const nodeTypes: NodeTypes = {
  proxmox: ProxmoxNode,
  group: GroupNode,
  internet: InternetNode,
  service: ServiceNode,
  db: DbNode,
}

const edgeStyle = { stroke: '#3f3f46', strokeWidth: 1.5 }
const animatedEdge = { stroke: '#52525b', strokeWidth: 1.5 }

export default function InfraGraph() {
  const [health, setHealth] = useState<Health | null>(null)

  useEffect(() => {
    fetch('/api/system/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ api: false, db: false }))
  }, [])

  const api = health?.api ?? null
  const db = health?.db ?? null

  const nodes: Node[] = [
    // Internet (externo)
    {
      id: 'internet',
      type: 'internet',
      position: { x: 20, y: 160 },
      data: { label: '🌐 Internet' },
    },

    // Proxmox wrapper
    {
      id: 'proxmox',
      type: 'proxmox',
      position: { x: 140, y: 40 },
      style: { width: 560, height: 340, background: 'transparent', border: 'none', padding: 0 },
      data: { label: 'Proxmox VE · UTN FRT' },
    },

    // CT 206
    {
      id: 'ct206',
      type: 'group',
      parentId: 'proxmox',
      extent: 'parent',
      position: { x: 20, y: 40 },
      style: { width: 260, height: 270, background: 'transparent', border: 'none', padding: 0 },
      data: { label: 'CT 43362480A', ip: '172.16.90.206' },
    },
    {
      id: 'nginx',
      type: 'service',
      parentId: 'ct206',
      extent: 'parent',
      position: { x: 20, y: 30 },
      data: { label: 'nginx', sub: 'reverse proxy · :80/:443', status: api },
    },
    {
      id: 'api',
      type: 'service',
      parentId: 'ct206',
      extent: 'parent',
      position: { x: 20, y: 110 },
      data: { label: 'FastAPI', sub: 'backend · :8000', status: api },
    },
    {
      id: 'frontend',
      type: 'service',
      parentId: 'ct206',
      extent: 'parent',
      position: { x: 20, y: 190 },
      data: { label: 'React', sub: 'static files', status: api },
    },

    // CT 207
    {
      id: 'ct207',
      type: 'group',
      parentId: 'proxmox',
      extent: 'parent',
      position: { x: 310, y: 40 },
      style: { width: 220, height: 120, background: 'transparent', border: 'none', padding: 0 },
      data: { label: 'CT 43362480DB', ip: '172.16.90.207' },
    },
    {
      id: 'db',
      type: 'db',
      parentId: 'ct207',
      extent: 'parent',
      position: { x: 20, y: 30 },
      data: { label: 'PostgreSQL 16', sub: 'database · :5432', status: db },
    },
  ]

  const edges: Edge[] = [
    // Internet → nginx: horizontal (right→left)
    { id: 'e1', source: 'internet', sourceHandle: 'right',  target: 'nginx',    targetHandle: 'left',   animated: true,  style: animatedEdge },
    // nginx → FastAPI: vertical dentro de CT 206 (bottom→top)
    { id: 'e2', source: 'nginx',    sourceHandle: 'bottom', target: 'api',      targetHandle: 'top',    animated: true,  style: animatedEdge },
    // nginx → React: vertical dentro de CT 206 (bottom→top, skip FastAPI)
    { id: 'e3', source: 'api',      sourceHandle: 'bottom', target: 'frontend', targetHandle: 'top',    animated: false, style: edgeStyle },
    // FastAPI → PostgreSQL: cross-CT horizontal (right→left)
    { id: 'e4', source: 'api',      sourceHandle: 'right',  target: 'db',       targetHandle: 'left',   animated: true,  style: animatedEdge },
    // React → FastAPI: bidireccional, usamos right→bottom para no solapar e2
    { id: 'e5', source: 'frontend', sourceHandle: 'right',  target: 'api',      targetHandle: 'bottom', animated: true,  style: animatedEdge },
  ]

  return (
    <div style={{ height: 380 }} className="border border-zinc-800 rounded overflow-hidden bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        panOnDrag={false}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background color="#27272a" gap={20} size={1} />
      </ReactFlow>
    </div>
  )
}
