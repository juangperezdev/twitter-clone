'use client'

import { useState, useEffect, useTransition } from 'react'
import { searchUsers } from '@/actions/social'
import Link from 'next/link'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const timer = setTimeout(() => {
      startTransition(async () => {
        const users = await searchUsers(query)
        setResults(users)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const getAvatar = (avatarUrl: string | null, seed: string) => {
    return avatarUrl?.includes('cloudflare') || !avatarUrl
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
      : avatarUrl
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      {/* Sidebar */}
      <nav className="w-1/4 max-w-[275px] pt-4 px-4 h-screen sticky top-0 hidden sm:flex flex-col border-r border-zinc-800">
        <Link href="/" className="mb-6 w-14 h-14 flex items-center justify-center rounded-full hover:bg-zinc-900 transition">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">F</span>
          </div>
        </Link>
        <Link href="/" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-1 text-[20px] flex items-center gap-4 transition text-zinc-200">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Inicio
        </Link>
        <Link href="/notifications" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-1 text-[20px] flex items-center gap-4 transition text-zinc-200">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          Notificaciones
        </Link>
        <Link href="/search" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-1 text-[20px] font-bold flex items-center gap-4 transition">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Explorar
        </Link>
      </nav>

      <main className="flex-1 max-w-[600px] border-r border-zinc-800 min-h-screen">
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-zinc-800 p-4">
          <div className="bg-zinc-900/70 rounded-full flex items-center px-4 py-3 group border border-transparent focus-within:border-sky-500 focus-within:bg-black transition-colors">
            <svg className="w-5 h-5 text-zinc-500 group-focus-within:text-sky-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar usuarios..."
              autoFocus
              className="bg-transparent border-none outline-none ml-3 w-full placeholder-zinc-500 text-white text-[15px]"
            />
            {isPending && <span className="text-xs text-zinc-500 shrink-0 animate-pulse">Buscando...</span>}
          </div>
        </header>

        {/* Resultados */}
        <div>
          {results.length > 0 && results.map(user => (
            <Link
              key={user.id}
              href={`/${user.username}`}
              className="p-4 hover:bg-zinc-950/40 transition flex items-start gap-3 border-b border-zinc-800 cursor-pointer"
            >
              <div className="w-10 h-10 bg-zinc-800 rounded-full shrink-0 overflow-hidden">
                <img src={getAvatar(user.avatar, user.username)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[15px] truncate">{user.name}</p>
                <p className="text-zinc-500 text-sm truncate">@{user.username}</p>
                {user.bio && <p className="text-sm mt-1 text-zinc-400 line-clamp-1">{user.bio}</p>}
                <p className="text-zinc-600 text-xs mt-1">
                  {user._count.followers} seguidores · {user._count.tweets} posts
                </p>
              </div>
            </Link>
          ))}

          {query.length >= 2 && results.length === 0 && !isPending && (
            <div className="text-zinc-500 text-center py-16">
              <p className="text-lg font-bold text-white mb-1">Sin resultados</p>
              <p className="text-sm">No se encontraron usuarios para &quot;{query}&quot;</p>
            </div>
          )}

          {query.length < 2 && (
            <div className="text-zinc-500 text-center py-16">
              <p className="text-sm">Escribí al menos 2 caracteres para buscar usuarios por nombre o username.</p>
            </div>
          )}
        </div>
      </main>
      <aside className="w-1/3 max-w-[350px] p-4 hidden lg:block" />
    </div>
  )
}
