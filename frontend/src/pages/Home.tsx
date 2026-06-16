import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPosts, type Post } from '../api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA')
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPosts()
      .then((r) => setPosts(r.data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-zinc-500 text-sm">loading...</p>

  if (posts.length === 0) {
    return (
      <div className="text-zinc-500 text-sm">
        <span className="text-zinc-600">$</span> ls posts/<br />
        <span className="mt-2 block">no posts yet.</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-zinc-600 text-xs mb-8">
        <span className="text-zinc-500">$</span> ls -lt posts/
      </p>
      {posts.map((post) => (
        <article key={post.id} className="group">
          <div className="flex items-baseline gap-4">
            <span className="text-zinc-600 text-xs tabular-nums w-24 shrink-0">
              {formatDate(post.created_at)}
            </span>
            <Link
              to={`/post/${post.id}`}
              className="text-zinc-100 hover:text-white font-medium leading-snug group-hover:underline underline-offset-4 decoration-zinc-600"
            >
              {post.title}
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
