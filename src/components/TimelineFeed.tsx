'use client'

import { useEffect, useRef, useState, useTransition, useCallback } from 'react'
import { loadTweets } from '@/actions/timeline'
import { TweetInteraction } from '@/components/TweetInteraction'
import Link from 'next/link'

interface Props {
  initialTweets: any[]
  loggedUserId: string
}

function getAvatar(avatarUrl: string | null, seed: string) {
  return avatarUrl?.includes('cloudflare') || !avatarUrl
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
    : avatarUrl
}

export function TimelineFeed({ initialTweets, loggedUserId }: Props) {
  const [mode, setMode] = useState<'forYou' | 'following'>('following')
  const [tweets, setTweets] = useState(initialTweets)
  const [page, setPage] = useState(1) // Page 0 ya cargada desde SSR
  const [hasMore, setHasMore] = useState(initialTweets.length >= 10)
  const [isPending, startTransition] = useTransition()
  const observerRef = useRef<HTMLDivElement>(null)
  const [newTweetsQueue, setNewTweetsQueue] = useState<any[]>([])

  // SSE: Real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/timeline/stream')

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_tweet') {
          // No mostrar nuestros propios tweets (ya los vemos al publicar)
          if (data.data.authorId !== loggedUserId) {
            setNewTweetsQueue(prev => [data.data, ...prev])
          }
        }
      } catch {
        // Ignorar mensajes mal formados
      }
    }

    eventSource.onerror = () => {
      // Reconexión automática del EventSource
    }

    return () => eventSource.close()
  }, [loggedUserId])

  // Función para incorporar tweets nuevos al timeline
  const showNewTweets = useCallback(() => {
    setTweets(prev => [...newTweetsQueue, ...prev])
    setNewTweetsQueue([])
  }, [newTweetsQueue])

  // Cambiar de tab
  const switchMode = useCallback((newMode: 'forYou' | 'following') => {
    setMode(newMode)
    setPage(0)
    setHasMore(true)
    setNewTweetsQueue([]) // Limpiar cola al cambiar de tab
    startTransition(async () => {
      const result = await loadTweets(0, newMode)
      setTweets(result.tweets)
      setHasMore(result.hasMore)
      setPage(1)
    })
  }, [])

  // Infinite scroll observer
  useEffect(() => {
    if (!observerRef.current || !hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isPending) {
          startTransition(async () => {
            const result = await loadTweets(page, mode)
            setTweets(prev => [...prev, ...result.tweets])
            setHasMore(result.hasMore)
            setPage(prev => prev + 1)
          })
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [page, hasMore, isPending, mode])

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => switchMode('forYou')}
          className="flex-1 hover:bg-zinc-900 transition flex justify-center pb-0 cursor-pointer"
        >
          <span className={`py-4 relative text-sm font-bold ${mode === 'forYou' ? 'text-white' : 'text-zinc-500'}`}>
            Para ti
            {mode === 'forYou' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-full" />}
          </span>
        </button>
        <button
          onClick={() => switchMode('following')}
          className="flex-1 hover:bg-zinc-900 transition flex justify-center py-4 cursor-pointer"
        >
          <span className={`relative text-sm font-medium ${mode === 'following' ? 'text-white font-bold' : 'text-zinc-500'}`}>
            Siguiendo
            {mode === 'following' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-full" />}
          </span>
        </button>
      </div>

      {/* Banner de nuevos tweets (real-time SSE) */}
      {newTweetsQueue.length > 0 && (
        <button
          onClick={showNewTweets}
          className="w-full py-3 text-sky-500 text-sm font-medium hover:bg-sky-500/5 transition border-b border-zinc-800 cursor-pointer"
        >
          Mostrar {newTweetsQueue.length} {newTweetsQueue.length === 1 ? 'nuevo post' : 'nuevos posts'}
        </button>
      )}

      {/* Tweet list */}
      <div>
        {tweets.map((tweet: any) => (
          <article key={tweet.id} className="p-4 border-b border-zinc-800 hover:bg-zinc-950/40 transition cursor-pointer flex gap-3 sm:gap-4 group">
            <Link href={`/${tweet.author.username}`} className="w-10 h-10 bg-zinc-800 rounded-full shrink-0 overflow-hidden block">
              <img src={getAvatar(tweet.author.avatar, tweet.author.username)} alt="Avatar" className="w-full h-full object-cover" />
            </Link>
            <div className="flex-1 w-full min-w-0">
              <div className="flex items-center gap-1.5 text-[15px] truncate max-w-full">
                <Link href={`/${tweet.author.username}`} className="font-bold hover:underline truncate text-white max-w-[50%]">{tweet.author.name}</Link>
                <span className="text-zinc-500 truncate hidden sm:inline">@{tweet.author.username}</span>
                <span className="text-zinc-500 shrink-0">·</span>
                <span className="text-zinc-500 shrink-0 hover:underline text-sm" suppressHydrationWarning>
                  {new Date(tweet.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <Link href={`/status/${tweet.id}`} className="block group/text">
                <p className="mt-0.5 mb-1.5 text-[15px] leading-snug break-words group-hover/text:text-zinc-100 transition-colors">{tweet.content}</p>
                {tweet.imageUrl && (
                  <div className="mt-2.5 mb-3 rounded-2xl overflow-hidden border border-zinc-800 flex bg-black group-hover/text:border-zinc-700 transition-colors">
                    <img src={tweet.imageUrl} alt="Media" className="w-full object-cover max-h-[450px]" loading="lazy" />
                  </div>
                )}
              </Link>
              <TweetInteraction tweet={tweet} loggedUserId={loggedUserId} />
            </div>
          </article>
        ))}

        {/* Loader sentinel for infinite scroll */}
        {hasMore && (
          <div ref={observerRef} className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && tweets.length > 0 && (
          <p className="text-zinc-600 text-center py-8 text-sm">Has llegado al final del timeline 🎉</p>
        )}

        {tweets.length === 0 && !isPending && (
          <div className="text-zinc-500 text-center py-16">
            <p className="text-lg font-bold text-white mb-1">
              {mode === 'following' ? 'Tu timeline está vacío' : 'No hay publicaciones'}
            </p>
            <p className="text-sm">
              {mode === 'following' ? 'Seguí a otros usuarios para ver sus tweets aquí.' : 'Todavía no hay actividad.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
