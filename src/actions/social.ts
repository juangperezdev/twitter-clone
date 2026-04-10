'use server'

import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { revalidatePath } from 'next/cache'

async function getUserId() {
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get('session')?.value
  if (!sessionValue) return null
  const session = await decrypt(sessionValue)
  return session?.userId ? String(session.userId) : null
}

export async function toggleFollow(targetUserId: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthenticated')
  if (userId === targetUserId) throw new Error('Cannot follow yourself')

  const existingFollow = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: userId,
        followingId: targetUserId
      }
    }
  })

  if (existingFollow) {
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId
        }
      }
    })
  } else {
    await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: targetUserId
      }
    })
  }

  revalidatePath('/')
  revalidatePath(`/profile`)
}

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return []

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      username: true,
      name: true,
      avatar: true,
      bio: true,
      _count: { select: { followers: true, following: true, tweets: true } }
    },
    take: 20
  })

  return users
}
