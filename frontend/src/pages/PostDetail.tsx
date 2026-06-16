import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SyntaxHighlighter from 'react-syntax-highlighter'
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs'
import { getPost, type Post } from '../api'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200))
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className="absolute top-2 right-2 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 transition-colors">
      {copied ? 'copied!' : 'copy'}
    </button>
  )
}

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const articleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getPost(Number(id))
      .then((r) => setPost(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  if (loading) return <p className="text-zinc-500 text-sm">loading...</p>
  if (notFound) return (
    <div className="text-zinc-500 text-sm space-y-2">
      <p><span className="text-zinc-600">bash:</span> page not found: No such file or directory</p>
      <Link to="/" className="text-zinc-400 hover:text-zinc-100 block">← back</Link>
    </div>
  )

  const tags = post!.tags ? post!.tags.split(',').map((t) => t.trim()).filter(Boolean) : []

  return (
    <div ref={articleRef}>
      <article>
        <Link to="/" className="text-zinc-600 text-xs hover:text-zinc-400 transition-colors">
          ← posts/
        </Link>
        <h1 className="text-2xl font-semibold text-zinc-100 mt-4 mb-2 leading-tight">
          {post!.title}
        </h1>
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <p className="text-zinc-600 text-xs">{formatDate(post!.created_at)}</p>
          <span className="text-zinc-700 text-xs">{readingTime(post!.content)} min read</span>
          {tags.map((t) => (
            <span key={t} className="bg-zinc-900 border border-zinc-800 text-zinc-500 text-xs px-2 py-0.5 rounded">
              {t}
            </span>
          ))}
        </div>
        <hr className="border-zinc-800 mb-8" />
        <div>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p: ({ children }) => <p className="text-zinc-300 text-sm leading-relaxed mb-4">{children}</p>,
              h1: ({ children }) => <h1 className="text-xl font-semibold text-zinc-100 mt-8 mb-3">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold text-zinc-100 mt-6 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-zinc-200 mt-4 mb-2">{children}</h3>,
              code({ className, children }) {
                const lang = (className ?? '').replace('language-', '')
                const code = String(children).replace(/\n$/, '')
                if (lang) {
                  return (
                    <div className="relative mb-4">
                      <CopyButton code={code} />
                      {lang && <span className="absolute top-2 left-3 text-xs text-zinc-600">{lang}</span>}
                      <SyntaxHighlighter
                        language={lang}
                        style={atomOneDark}
                        customStyle={{ background: '#0a0a0a', border: '1px solid #27272a', borderRadius: '6px', fontSize: '0.75rem', padding: '2rem 1rem 1rem' }}
                      >
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  )
                }
                return <code className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-zinc-300">{children}</code>
              },
              pre: ({ children }) => <>{children}</>,
              ul: ({ children }) => <ul className="list-disc list-inside text-zinc-300 text-sm space-y-1 mb-4 pl-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside text-zinc-300 text-sm space-y-1 mb-4 pl-2">{children}</ol>,
              li: ({ children }) => <li className="text-zinc-300">{children}</li>,
              blockquote: ({ children }) => <blockquote className="border-l-2 border-zinc-700 pl-4 text-zinc-500 italic my-4">{children}</blockquote>,
              a: ({ href, children }) => <a href={href} className="text-zinc-400 underline underline-offset-2 hover:text-zinc-200" target="_blank" rel="noreferrer">{children}</a>,
              hr: () => <hr className="border-zinc-800 my-6" />,
              table: ({ children }) => <div className="overflow-x-auto mb-4"><table className="w-full text-sm text-zinc-300 border border-zinc-800 rounded">{children}</table></div>,
              th: ({ children }) => <th className="text-left px-3 py-2 text-xs text-zinc-400 border-b border-zinc-800 bg-zinc-900">{children}</th>,
              td: ({ children }) => <td className="px-3 py-2 text-xs border-b border-zinc-900">{children}</td>,
            }}
          >
            {post!.content}
          </ReactMarkdown>
        </div>
      </article>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-100 text-xs px-3 py-1.5 rounded transition-colors"
        >
          ↑ top
        </button>
      )}
    </div>
  )
}
