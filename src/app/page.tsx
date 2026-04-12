import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ComposeTweet } from '@/components/ComposeTweet'
import { TimelineFeed } from '@/components/TimelineFeed'
import { MobileNav } from '@/components/MobileNav'

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
      {/* Sidebar Izquierdo — oculto en mobile */}
      <nav className="w-1/4 max-w-[275px] pt-4 px-2 xl:px-4 h-screen sticky top-0 hidden sm:flex flex-col border-r border-zinc-800">
        <Link href="/" className="mb-4 w-14 h-14 flex items-center justify-center rounded-full hover:bg-zinc-900 transition">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">F</span>
          </div>
        </Link>
        <Link href="/" className="px-4 xl:px-5 py-3 hover:bg-zinc-900 rounded-full w-fit mb-0.5 text-lg xl:text-[20px] font-bold flex items-center gap-4 transition">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.484 3.017-7.997 7.042c-1.589.697-2.675 2.502-2.675 4.458 0 2.222 1.488 4.103 3.513 4.757A3.987 3.987 0 007.996 22h8.001a3.987 3.987 0 003.159-3.743c2.025-.654 3.513-2.535 3.513-4.757 0-1.956-1.086-3.761-2.676-4.458zm-7.997-5.042c2.81 0 5.176 1.957 5.86 4.606C17.067 8.243 16.273 8 15.42 8H8.572c-.853 0-1.647.243-2.436.606.684-2.649 3.05-4.606 5.86-4.606z"/></svg>
          <span className="hidden xl:inline">Inicio</span>
        </Link>
        <Link href="/notifications" className="px-4 xl:px-5 py-3 hover:bg-zinc-900 rounded-full w-fit mb-0.5 text-lg xl:text-[20px] flex items-center gap-4 transition text-zinc-200 relative">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          <span className="hidden xl:inline">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 left-8 xl:left-9 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black">
              {unreadCount}
            </span>
          )}
        </Link>
        <Link href="/search" className="px-4 xl:px-5 py-3 hover:bg-zinc-900 rounded-full w-fit mb-0.5 text-lg xl:text-[20px] flex items-center gap-4 transition text-zinc-200">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <span className="hidden xl:inline">Explorar</span>
        </Link>
        <Link href={`/${user.username}`} className="px-4 xl:px-5 py-3 hover:bg-zinc-900 rounded-full w-fit mb-4 text-lg xl:text-[20px] flex items-center gap-4 transition text-zinc-200">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="hidden xl:inline">Perfil</span>
        </Link>
        
        <Link href="/" className="w-full bg-sky-500 hover:bg-sky-600 transition-colors py-3.5 rounded-full font-bold text-center text-[17px] shadow-lg shadow-sky-500/20 hidden xl:block">
          Postear
        </Link>
        <Link href="/" className="xl:hidden w-14 h-14 bg-sky-500 hover:bg-sky-600 rounded-full flex items-center justify-center transition shadow-lg shadow-sky-500/20">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </Link>
        
        <form action={async () => {
          'use server';
          const { deleteSession } = await import('@/lib/session');
          await deleteSession();
          redirect('/login');
        }} className="mt-auto mb-4 relative group">
          <div className="flex items-center gap-3 p-3 rounded-full hover:bg-zinc-900 transition cursor-pointer">
            <div className="w-10 h-10 bg-zinc-800 rounded-full overflow-hidden shrink-0">
              <img src={getAvatar(user.avatar, user.username)} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="hidden xl:block truncate">
              <p className="font-bold text-sm leading-tight truncate">{user.name}</p>
              <p className="text-zinc-500 text-sm truncate">@{user.username}</p>
            </div>
            <div className="hidden xl:block ml-auto text-xl font-bold">...</div>
          </div>
          
          <button type="submit" className="absolute bottom-[110%] w-[100%] rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] bg-black py-4 px-4 font-bold text-red-500 border border-zinc-700 opacity-0 group-hover:opacity-100 transition duration-200 invisible group-hover:visible z-50">
            Cerrar sesión de @{user.username}
          </button>
        </form>
      </nav>

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
