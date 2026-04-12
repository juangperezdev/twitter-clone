'use server'

import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { put } from '@vercel/blob'

async function getUserId() {
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get('session')?.value
  if (!sessionValue) return null
  const session = await decrypt(sessionValue)
  return session?.userId ? String(session.userId) : null
}

export async function createTweet(formData: FormData) {
  const userId = await getUserId()
  if (!userId) redirect('/login')

  const content = formData.get('content') as string
  const imageFile = formData.get('image') as File | null
  const parentId = formData.get('parentId') as string | null
  
  if (!content || content.length > 280) return

  let imageUrl: string | null = null

  if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
    // Si tenemos BLOB_READ_WRITE_TOKEN (Vercel), usar Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const blob = await put(`tweets/${Date.now()}-${imageFile.name}`, imageFile, {
        access: 'public',
      })
      imageUrl = blob.url
    } else {
      // Desarrollo local: guardar en filesystem
      const fs = await import('fs')
      const path = await import('path')
      const bytes = await imageFile.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const filename = Date.now() + '-' + imageFile.name.replace(/\s/g, '-')
      const uploadDir = path.join(process.cwd(), 'public', 'uploads')
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true })
      }
      
      const filepath = path.join(uploadDir, filename)
      fs.writeFileSync(filepath, buffer)
      imageUrl = `/uploads/${filename}`
    }
  }

  const tweet = await prisma.tweet.create({
    data: {
      content,
      imageUrl,
      authorId: userId,
      parentId: parentId || null
    },
    include: {
      author: true,
      _count: { select: { likes: true } },
      likes: { select: { userId: true } }
    }
  })

  // Emitir evento real-time via SSE
  try {
    const { tweetBus } = await import('@/lib/events')
    tweetBus.emit({
      type: 'new_tweet',
      tweet: {
        ...tweet,
        createdAt: tweet.createdAt.toISOString(),
        author: {
          ...tweet.author,
          createdAt: tweet.author.createdAt.toISOString(),
          updatedAt: tweet.author.updatedAt.toISOString(),
          resetTokenExpiry: tweet.author.resetTokenExpiry?.toISOString() || null,
        }
      }
    })
  } catch {
    // SSE is best-effort, don't block tweet creation
  }

  // Notificación de respuesta
  if (parentId) {
    try {
      const parentTweet = await prisma.tweet.findUnique({ where: { id: parentId } })
      if (parentTweet && parentTweet.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: 'REPLY',
            recipientId: parentTweet.authorId,
            actorId: userId,
            tweetId: tweet.id
          }
        })
      }
    } catch (e) {
      console.error('Error creating reply notification:', e)
    }
  }

  revalidatePath('/')
  if (parentId) {
    revalidatePath(`/status/${parentId}`)
  } else {
    redirect('/')
  }
}

export async function toggleLike(tweetId: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthenticated')

  const existingLike = await prisma.like.findUnique({
    where: {
      userId_tweetId: { userId, tweetId }
    }
  })

  if (existingLike) {
    await prisma.like.delete({ where: { id: existingLike.id } })
  } else {
    await prisma.like.create({ data: { userId, tweetId } })

    // Crear notificación de like
    try {
      const tweet = await prisma.tweet.findUnique({ where: { id: tweetId } })
      if (tweet && tweet.authorId !== userId) {
        await prisma.notification.create({
          data: {
            type: 'LIKE',
            recipientId: tweet.authorId,
            actorId: userId,
            tweetId: tweetId
          }
        })
      }
    } catch (e) {
      console.error('Error creating like notification:', e)
    }
  }

  revalidatePath('/')
  revalidatePath(`/status/${tweetId}`)
}

export async function deleteTweet(tweetId: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthenticated')

  const tweet = await prisma.tweet.findUnique({ where: { id: tweetId } })
  if (tweet?.authorId !== userId) throw new Error('No tienes permisos de borrado')

  const parentId = tweet?.parentId

  await prisma.tweet.delete({ where: { id: tweetId } })

  revalidatePath('/')
  if (parentId) {
    revalidatePath(`/status/${parentId}`)
    redirect(`/status/${parentId}`)
  } else {
    redirect('/')
  }
}
