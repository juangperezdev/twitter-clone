import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ComposeTweet } from '@/components/ComposeTweet'

export default async function ComposePage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  
  if (!sessionCookie) redirect('/login')

  const session = await decrypt(sessionCookie)
  if (!session?.userId) redirect('/login')

  const user = await prisma.user.findUnique({ 
    where: { id: String(session.userId) },
    select: { id: true, username: true, name: true, avatar: true }
  })
  
  if (!user) redirect('/login')

  const getAvatar = (avatarUrl: string | null, seed: string) => {
    return avatarUrl?.includes('cloudflare') || !avatarUrl 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` 
        : avatarUrl
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <main className="flex-1 w-full sm:w-[600px] sm:max-w-[600px] border-r border-zinc-800 min-h-screen relative">
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-zinc-800 flex items-center justify-between p-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:bg-zinc-900 rounded-full transition text-white">
              Cerrar
            </Link>
          </div>
          <div className="hidden sm:block">
            <Link href="/" className="bg-sky-500 text-white font-bold px-4 py-1.5 rounded-full hover:bg-sky-600 transition">
              Drafts
            </Link>
          </div>
        </header>

        <div className="pt-2">
          <ComposeTweet 
            userAvatar={getAvatar(user.avatar, user.username)} 
            userName={user.name || ''} 
            userUsername={user.username} 
          />
        </div>
      </main>
    </div>
  )
}
