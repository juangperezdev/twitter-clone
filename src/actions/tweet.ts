'use server'

import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import fs from 'fs'
import path from 'path'

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
  
  if (!content || content.length > 280) return

  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0 && imageFile.name !== 'undefined') {
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

  await prisma.tweet.create({
    data: {
      content,
      imageUrl,
      authorId: userId
    }
  })

  revalidatePath('/')
  redirect('/')
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
  }

  revalidatePath('/')
}

export async function deleteTweet(tweetId: string) {
  const userId = await getUserId()
  if (!userId) throw new Error('Unauthenticated')

  const tweet = await prisma.tweet.findUnique({ where: { id: tweetId } })
  if (tweet?.authorId !== userId) throw new Error('No tienes permisos de borrado')

  await prisma.tweet.delete({ where: { id: tweetId } })

  revalidatePath('/')
}
