'use client'

import { useTransition } from 'react'
import { toggleFollow } from '@/actions/social'

export function FollowButton({ targetUserId, isFollowing }: { targetUserId: string, isFollowing: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await toggleFollow(targetUserId)
        })
      }}
      className={`px-5 py-2 rounded-full font-bold text-sm transition-all active:scale-95 ${
        isFollowing
          ? 'bg-transparent border border-zinc-600 text-white hover:border-red-500/60 hover:text-red-500 hover:bg-red-500/10 group'
          : 'bg-white text-black hover:bg-zinc-200'
      } disabled:opacity-50`}
    >
      {isFollowing ? (
        <>
          <span className="group-hover:hidden">Siguiendo</span>
          <span className="hidden group-hover:inline">Dejar</span>
        </>
      ) : (
        'Seguir'
      )}
    </button>
  )
}
