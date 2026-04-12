import { prisma } from '@/lib/db'
import { decrypt } from '@/lib/session'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionValue = cookieStore.get('session')?.value
    if (!sessionValue) return new Response('Unauthorized', { status: 401 })

    const session = await decrypt(sessionValue)
    if (!session?.userId) return new Response('Unauthorized', { status: 401 })

    const count = await prisma.notification.count({
      where: {
        recipientId: String(session.userId),
        read: false
      }
    })

    return Response.json({ count })
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
}
