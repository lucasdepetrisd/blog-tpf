import { useEffect, useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import {
  getPosts, createPost, updatePost, deletePost,
  getProfile, updateProfile, uploadPhoto, deletePhoto,
  getChangelog, createChangelogEntry, deleteChangelogEntry,
  type Post, type Profile, type ChangelogEntry,
} from '../api'
import CropModal from '../components/CropModal'

type Tab = 'posts' | 'profile' | 'changelog'

const inputClass =
  'w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600'
const btnPrimary =
  'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 text-xs px-3 py-1.5 rounded transition-colors'
const btnDanger =
  'bg-transparent hover:bg-red-950 border border-zinc-800 hover:border-red-900 text-zinc-500 hover:text-red-400 text-xs px-3 py-1.5 rounded transition-colors'

function PostForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Post
  onSave: (title: string, content: string, tags: string) => Promise<void>
  onCancel: () => void
}) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [tags, setTags] = useState<string[]>(
    initial?.tags ? initial.tags.split(',').map((t) => t.trim()).filter(Boolean) : []
  )
  const [tagInput, setTagInput] = useState('')
  const [saving, setSaving] = useState(false)

  const addTag = (val: string) => {
    const t = val.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagInput('')
  }

  const handleTagKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
    if (e.key === 'Backspace' && !tagInput && tags.length) setTags(tags.slice(0, -1))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(title, content, tags.join(','))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="title"
        className={inputClass}
        required
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="content..."
        rows={10}
        className={inputClass + ' resize-y'}
        required
      />
      <div className={`${inputClass} flex flex-wrap gap-1.5 min-h-[38px] cursor-text`}
        onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}>
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 bg-zinc-800 text-zinc-300 text-xs px-2 py-0.5 rounded">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))}
              className="text-zinc-500 hover:text-zinc-200">×</button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagKey}
          onBlur={() => tagInput && addTag(tagInput)}
          placeholder={tags.length === 0 ? 'tags (Enter o coma para agregar)' : ''}
          className="bg-transparent outline-none text-sm text-zinc-100 placeholder-zinc-600 flex-1 min-w-[120px]"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'saving...' : initial ? 'update' : 'publish'}
        </button>
        <button type="button" onClick={onCancel} className={btnDanger}>
          cancel
        </button>
      </div>
    </form>
  )
}

function PostsTab() {
  const [posts, setPosts] = useState<Post[]>([])
  const [editing, setEditing] = useState<Post | null>(null)
  const [creating, setCreating] = useState(false)

  const load = () => getPosts().then((r) => setPosts(r.data))
  useEffect(() => { load() }, [])

  const handleCreate = async (title: string, content: string, tags: string) => {
    await createPost({ title, content, tags })
    setCreating(false)
    load()
  }

  const handleUpdate = async (title: string, content: string, tags: string) => {
    if (!editing) return
    await updatePost(editing.id, { title, content, tags })
    setEditing(null)
    load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('delete this post?')) return
    await deletePost(id)
    load()
  }

  if (creating) return <PostForm onSave={handleCreate} onCancel={() => setCreating(false)} />
  if (editing) return <PostForm initial={editing} onSave={handleUpdate} onCancel={() => setEditing(null)} />

  return (
    <div className="space-y-4">
      <button onClick={() => setCreating(true)} className={btnPrimary}>
        + new post
      </button>
      {posts.length === 0 && <p className="text-zinc-600 text-sm">no posts yet.</p>}
      {posts.map((post) => (
        <div key={post.id} className="border border-zinc-800 rounded p-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-100">{post.title}</p>
            <p className="text-xs text-zinc-600 mt-0.5">
              {new Date(post.created_at).toLocaleDateString('en-CA')}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={() => setEditing(post)} className={btnPrimary}>edit</button>
            <button onClick={() => handleDelete(post.id)} className={btnDanger}>delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function ProfileTab() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then((r) => {
      setProfile(r.data)
      setName(r.data.name)
      setBio(r.data.bio)
    })
  }, [])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await updateProfile({ name, bio })
      setProfile(res.data)
    } finally {
      setSaving(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setCropSrc(url)
    e.target.value = ''
  }

  const handleCropConfirm = async (blob: Blob) => {
    setCropSrc(null)
    setUploading(true)
    try {
      const file = new File([blob], 'foto.jpg', { type: 'image/jpeg' })
      const res = await uploadPhoto(file)
      setProfile(res.data)
    } finally {
      setUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (!confirm('¿Usar foto de GitHub en su lugar?')) return
    const res = await deletePhoto()
    setProfile(res.data)
  }

  if (!profile) return <p className="text-zinc-500 text-sm">loading...</p>

  return (
    <div className="space-y-6">
      {cropSrc && (
        <CropModal
          src={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { URL.revokeObjectURL(cropSrc); setCropSrc(null) }}
        />
      )}
      <div className="flex items-center gap-4">
        <img
          src={profile.has_photo ? `/api/profile/photo?v=${Date.now()}` : 'https://github.com/lucasdepetrisd.png?size=128'}
          alt={profile.name}
          className="w-16 h-16 rounded-full object-cover border border-zinc-800"
        />
        <div className="flex gap-2">
          <label className={btnPrimary + ' cursor-pointer'}>
            {uploading ? 'subiendo...' : 'cambiar foto'}
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </label>
          {profile.has_photo && (
            <button type="button" onClick={handleDeletePhoto} className={btnDanger}>
              usar github
            </button>
          )}
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="block text-xs text-zinc-500 mb-1">bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)}
            rows={4} className={inputClass + ' resize-y'} />
        </div>
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'saving...' : 'save'}
        </button>
      </form>
    </div>
  )
}

function ChangelogTab() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([])
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)

  const load = () => getChangelog().then((r) => setEntries(r.data))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await createChangelogEntry({ version, description, date })
      setVersion('')
      setDescription('')
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('delete this entry?')) return
    await deleteChangelogEntry(id)
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="v1.0.0"
            className={inputClass + ' w-32'}
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass + ' flex-1'}
            required
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="qué cambió en esta versión..."
          rows={3}
          className={inputClass + ' resize-y'}
          required
        />
        <button type="submit" disabled={saving} className={btnPrimary}>
          {saving ? 'saving...' : '+ add entry'}
        </button>
      </form>
      <div className="space-y-3">
        {entries.length === 0 && <p className="text-zinc-600 text-sm">no entries yet.</p>}
        {entries.map((entry) => (
          <div key={entry.id} className="border border-zinc-800 rounded p-3 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-sm text-zinc-100">{entry.version}</span>
                <span className="text-xs text-zinc-600">{entry.date}</span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{entry.description}</p>
            </div>
            <button onClick={() => handleDelete(entry.id)} className={btnDanger + ' shrink-0'}>delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Admin() {
  const { isAuth } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('posts')

  useEffect(() => {
    if (!isAuth) navigate('/login')
  }, [isAuth, navigate])

  if (!isAuth) return null

  const tabBtn = (t: Tab) =>
    `text-xs px-3 py-1.5 rounded transition-colors ${
      tab === t
        ? 'bg-zinc-800 text-zinc-100'
        : 'text-zinc-500 hover:text-zinc-300'
    }`

  return (
    <div className="space-y-6">
      <div>
        <p className="text-zinc-600 text-xs mb-4">
          <span className="text-zinc-500">$</span> sudo vim blog/
        </p>
        <div className="flex gap-2">
          <button className={tabBtn('posts')} onClick={() => setTab('posts')}>posts</button>
          <button className={tabBtn('profile')} onClick={() => setTab('profile')}>profile</button>
          <button className={tabBtn('changelog')} onClick={() => setTab('changelog')}>changelog</button>
        </div>
      </div>
      <div>
        {tab === 'posts' && <PostsTab />}
        {tab === 'profile' && <ProfileTab />}
        {tab === 'changelog' && <ChangelogTab />}
      </div>
    </div>
  )
}
