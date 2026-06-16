import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { getPost, type Post } from '../api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    getPost(Number(id))
      .then((r) => setPost(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-zinc-500 text-sm">loading...</p>
  if (notFound) return (
    <div className="text-zinc-500 text-sm">
      <p>post not found.</p>
      <Link to="/" className="text-zinc-400 hover:text-zinc-100 mt-2 block">← back</Link>
    </div>
  )

  return (
    <article>
      <Link to="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
        ← posts/
      </Link>
      <h1 className="text-2xl font-semibold text-zinc-100 mt-4 mb-2 leading-tight">
        {post!.title}
      </h1>
      <p className="text-zinc-600 text-xs mb-8">{formatDate(post!.created_at)}</p>
      <div className="prose-md">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="text-zinc-300 text-sm leading-relaxed mb-4">{children}</p>,
            h1: ({ children }) => <h1 className="text-xl font-semibold text-zinc-100 mt-8 mb-3">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold text-zinc-100 mt-6 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold text-zinc-200 mt-4 mb-2">{children}</h3>,
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-')
              return isBlock
                ? <code className="block bg-zinc-900 border border-zinc-800 rounded p-4 text-xs text-zinc-300 overflow-x-auto mb-4 whitespace-pre">{children}</code>
                : <code className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-300">{children}</code>
            },
            pre: ({ children }) => <>{children}</>,
            ul: ({ children }) => <ul className="list-disc list-inside text-zinc-300 text-sm space-y-1 mb-4 pl-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside text-zinc-300 text-sm space-y-1 mb-4 pl-2">{children}</ol>,
            li: ({ children }) => <li className="text-zinc-300">{children}</li>,
            blockquote: ({ children }) => <blockquote className="border-l-2 border-zinc-700 pl-4 text-zinc-500 italic my-4">{children}</blockquote>,
            a: ({ href, children }) => <a href={href} className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200" target="_blank" rel="noreferrer">{children}</a>,
            hr: () => <hr className="border-zinc-800 my-6" />,
          }}
        >
          {post!.content}
        </ReactMarkdown>
      </div>
    </article>
  )
}
