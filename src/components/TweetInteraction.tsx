'use client'

import { useState, useTransition } from 'react'
import { toggleLike, deleteTweet } from '@/actions/tweet'

export function TweetInteraction({ tweet, loggedUserId }: { tweet: any, loggedUserId: string }) {
  const [isPending, startTransition] = useTransition()
  
  // Variables Interactivas "Optimistas"
  const hasLikedInitial = tweet.likes?.some((l: any) => l.userId === loggedUserId)
  const [hasLiked, setHasLiked] = useState(hasLikedInitial)
  const [likeCount, setLikeCount] = useState(tweet._count.likes)
  
  const isMine = tweet.authorId === loggedUserId

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault() // Evita saltos de navegación si se envuelve en un Link
    e.stopPropagation()
    
    // UI instantánea: Inmediatamente altera el contador antes que el Server
    setHasLiked(!hasLiked)
    setLikeCount(hasLiked ? likeCount - 1 : likeCount + 1)
    
    // Promesa Server-Side oculta
    startTransition(async () => {
      await toggleLike(tweet.id)
    })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Control Anti-Click Errado
    if (confirm("¿Estás 100% seguro de que deseas eliminar este Flock? Esta acción no se puede deshacer.")) {
      startTransition(async () => {
        await deleteTweet(tweet.id)
      })
    }
  }

  return (
    <div className="flex justify-between w-full max-w-md text-zinc-500 text-sm mt-1" onClick={e => e.preventDefault()}>
      
      {/* Fake Reply Button para diseño premium */}
      <button className="flex items-center gap-1.5 hover:text-sky-500 transition group/btn outline-none">
        <div className="p-2 rounded-full group-hover/btn:bg-sky-500/10 transition-colors">
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </div>
        <span className="font-medium text-xs">{tweet.id.charCodeAt(0) % 15 || 1}</span>
      </button>

      {/* Fake Retweet */}
      <button className="flex items-center gap-1.5 hover:text-green-500 transition group/btn outline-none">
        <div className="p-2 rounded-full group-hover/btn:bg-green-500/10 transition-colors">
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </div>
      </button>

      {/* REAL LIKE BUTTON */}
      <button 
        onClick={handleLike} 
        disabled={isPending}
        className={`flex items-center gap-1.5 transition group/btn outline-none ${hasLiked ? 'text-pink-600' : 'hover:text-pink-600'}`}
      >
        <div className={`p-2 rounded-full transition-colors ${hasLiked ? 'bg-pink-600/10' : 'group-hover/btn:bg-pink-600/10'}`}>
          <svg className={`w-[18px] h-[18px] transition ${hasLiked ? 'fill-current scale-110' : 'scale-100 group-hover/btn:scale-110'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={hasLiked ? 0 : 2} d={hasLiked ? "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" : "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"} />
          </svg>
        </div>
        <span className="font-medium text-xs tabular-nums">{likeCount > 0 ? likeCount : ''}</span>
      </button>

      {/* REAL DELETE BUTTON (Condicionado a ser Autor) */}
      {isMine ? (
        <button onClick={handleDelete} className="flex items-center gap-1.5 hover:text-red-500 transition group/btn outline-none">
          <div className="p-2 rounded-full group-hover/btn:bg-red-500/10 transition-colors">
             <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
        </button>
      ) : (
        <button className="flex items-center gap-1.5 hover:text-sky-500 transition group/btn outline-none invisible">
          <div className="p-2 rounded-full group-hover/btn:bg-sky-500/10 transition-colors">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </div>
        </button>
      )}
    </div>
  )
}
