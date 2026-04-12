import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ComposeTweet } from '@/components/ComposeTweet'
import { TimelineFeed } from '@/components/TimelineFeed'
import { MobileNav } from '@/components/MobileNav'
import { Sidebar } from '@/components/Sidebar'

export default async function HomePage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  
  if (!sessionCookie) redirect('/login')

  const session = await decrypt(sessionCookie)
  if (!session?.userId) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: String(session.userId) } })
  if (!user) {
    redirect('/login')
  }

  // Count unread notifications
  const unreadCount = await prisma.notification.count({
    where: { recipientId: user.id, read: false }
  })

  // Fetch inicial (primera página, "Para ti")
  const initialTweets = await prisma.tweet.findMany({
    where: { parentId: null },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      author: true,
      _count: { select: { likes: true, replies: true } },
      likes: { select: { userId: true } }
    }
  })

  // Serializar fechas para pasar a componentes de cliente
  const serializedTweets = initialTweets.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    author: {
      ...t.author,
      createdAt: t.author.createdAt.toISOString(),
      updatedAt: t.author.updatedAt.toISOString(),
      resetTokenExpiry: t.author.resetTokenExpiry?.toISOString() || null,
    }
  }))

  const getAvatar = (avatarUrl: string | null, seed: string) => {
    return avatarUrl?.includes('cloudflare') || !avatarUrl 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` 
        : avatarUrl
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center selection:bg-sky-500/30">
      <Sidebar />

      {/* Main Feed Container */}
      <main className="flex-1 w-full sm:w-[600px] sm:max-w-[600px] border-r border-zinc-800 min-h-screen pb-16 sm:pb-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-zinc-800">
          <div className="flex items-center justify-between p-4 sm:hidden">
            <Link href={`/${user.username}`} className="w-8 h-8 bg-zinc-800 rounded-full overflow-hidden">
              <img src={getAvatar(user.avatar, user.username)} alt="" className="w-full h-full object-cover" />
            </Link>
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-black font-bold text-sm">F</span>
            </div>
            <div className="w-8" />
          </div>
          <h1 className="text-xl font-bold p-4 pt-0 sm:pt-4 hidden sm:block">Inicio</h1>
        </header>

        {/* Compose */}
        <div className="hidden sm:block">
          <ComposeTweet 
            userAvatar={getAvatar(user.avatar, user.username)} 
            userName={user.name || ''} 
            userUsername={user.username} 
          />
        </div>

        {/* Timeline con tabs e infinite scroll */}
        <TimelineFeed 
          initialTweets={serializedTweets} 
          loggedUserId={user.id}
        />
      </main>

      {/* Right Sidebar — oculto en mobile y tablet */}
      <aside className="w-1/3 max-w-[350px] p-4 hidden lg:block">
         <div className="sticky top-4 space-y-4">
            <div className="bg-zinc-900/50 rounded-full flex items-center px-4 py-3 group border border-transparent focus-within:border-sky-500 focus-within:bg-black transition-colors">
               <svg className="w-5 h-5 text-zinc-500 group-focus-within:text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <Link href="/search" className="bg-transparent border-none outline-none ml-3 w-full placeholder-zinc-500 text-zinc-500 text-sm">
                 Buscar en Flock
               </Link>
            </div>

            <div className="bg-zinc-900 rounded-2xl pt-4 pb-2 border border-zinc-800">
               <h2 className="font-bold text-xl px-4 mb-3">Qué está pasando</h2>
               <div className="hover:bg-zinc-800/50 cursor-pointer px-4 py-2.5 transition">
                  <p className="text-[13px] text-zinc-500 flex justify-between">Tendencia Tecnológica <span className="text-xl">...</span></p>
                  <p className="font-bold text-[15px] mt-0.5">Google Antigravity</p>
                  <p className="text-[13px] text-zinc-500 mt-0.5">14.5K posts</p>
               </div>
               <div className="hover:bg-zinc-800/50 cursor-pointer px-4 py-2.5 transition">
                  <p className="text-[13px] text-zinc-500 flex justify-between">Tendencia en Deportes <span className="text-xl">...</span></p>
                  <p className="font-bold text-[15px] mt-0.5">The Flock</p>
                  <p className="text-[13px] text-zinc-500 mt-0.5">5,632 posts</p>
               </div>
               <Link href="/search" className="block hover:bg-zinc-800/50 cursor-pointer px-4 py-3 xl:rounded-b-2xl transition">
                  <p className="text-[15px] text-sky-500 hover:text-sky-400">Mostrar más</p>
               </Link>
            </div>
         </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <MobileNav />
    </div>
  )
}
