'use server'

import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'

const TWEETS_PER_PAGE = 10

export async function loadTweets(page: number, mode: 'forYou' | 'following') {
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get('session')?.value
  if (!sessionValue) return { tweets: [], hasMore: false }

  const session = await decrypt(sessionValue)
  if (!session?.userId) return { tweets: [], hasMore: false }
  const userId = String(session.userId)

  const baseWhere = mode === 'following' 
    ? {
        OR: [
          { authorId: userId },
          { author: { followers: { some: { followerId: userId } } } }
        ]
      }
    : {}

  // Solo mostrar tweets principales en el feed (no respuestas)
  const whereClause = { ...baseWhere, parentId: null }

  const tweets = await prisma.tweet.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    skip: page * TWEETS_PER_PAGE,
    take: TWEETS_PER_PAGE + 1, // Tomamos 1 extra para saber si hay más
    include: {
      author: true,
      _count: { select: { likes: true, replies: true } },
      likes: { select: { userId: true } }
    }
  })

  const hasMore = tweets.length > TWEETS_PER_PAGE
  const trimmed = hasMore ? tweets.slice(0, TWEETS_PER_PAGE) : tweets

  return {
    tweets: trimmed.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      author: {
        ...t.author,
        createdAt: t.author.createdAt.toISOString(),
        updatedAt: t.author.updatedAt.toISOString(),
        resetTokenExpiry: t.author.resetTokenExpiry?.toISOString() || null,
      }
    })),
    hasMore
  }
}
