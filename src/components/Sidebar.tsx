import Link from 'next/link'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { prisma } from '@/lib/db'
import { NotificationListener } from './NotificationListener'

function getAvatar(avatarUrl: string | null, seed: string) {
  return avatarUrl?.includes('cloudflare') || !avatarUrl
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
    : avatarUrl
}

export async function Sidebar() {
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get('session')?.value
  if (!sessionValue) return null
  
  const session = await decrypt(sessionValue)
  if (!session?.userId) return null
  const userId = String(session.userId)

  const user = await prisma.user.findUnique({ 
    where: { id: userId },
    select: { id: true, username: true, name: true, avatar: true }
  })

  if (!user) return null

  const unreadCount = await prisma.notification.count({
    where: { recipientId: userId, read: false }
  })

  return (
    <nav className="w-1/4 max-w-[275px] pt-4 px-2 xl:px-4 h-screen sticky top-0 hidden sm:flex flex-col border-r border-zinc-800">
      <Link href="/" className="mb-4 w-14 h-14 flex items-center justify-center rounded-full hover:bg-zinc-900 transition font-bold text-2xl">
        <div className="w-11 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">FX</span>
        </div>
      </Link>
      
      <Link href="/" className="px-4 xl:px-5 py-3 hover:bg-zinc-900 rounded-full w-fit mb-0.5 text-lg xl:text-[20px] font-bold flex items-center gap-4 transition">
        <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.484 3.017-7.997 7.042c-1.589.697-2.675 2.502-2.675 4.458 0 2.222 1.488 4.103 3.513 4.757A3.987 3.987 0 007.996 22h8.001a3.987 3.987 0 003.159-3.743c2.025-.654 3.513-2.535 3.513-4.757 0-1.956-1.086-3.761-2.676-4.458zm-7.997-5.042c2.81 0 5.176 1.957 5.86 4.606C17.067 8.243 16.273 8 15.42 8H8.572c-.853 0-1.647.243-2.436.606.684-2.649 3.05-4.606 5.86-4.606z"/></svg>
        <span className="hidden xl:inline">Inicio</span>
      </Link>
      
      <Link href="/notifications" className="px-4 xl:px-5 py-3 hover:bg-zinc-900 rounded-full w-fit mb-0.5 text-lg xl:text-[20px] flex items-center gap-4 transition text-zinc-200 relative">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        <span className="hidden xl:inline">Notificaciones</span>
        <NotificationListener initialCount={unreadCount} userId={userId} />
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
      
      <div className="mt-auto mb-4 relative group">
        <div className="flex items-center gap-3 p-3 rounded-full hover:bg-zinc-900 transition cursor-pointer">
          <div className="w-10 h-10 bg-zinc-800 rounded-full overflow-hidden shrink-0">
            <img src={getAvatar(user.avatar, user.username)} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <div className="hidden xl:block truncate">
            <p className="font-bold text-sm leading-tight truncate">{user.name || user.username}</p>
            <p className="text-zinc-500 text-sm truncate">@{user.username}</p>
          </div>
          <div className="hidden xl:block ml-auto text-xl font-bold">...</div>
        </div>
        
        <form action={async () => {
          'use server';
          const { deleteSession } = await import('@/lib/session');
          const { redirect } = await import('next/navigation');
          await deleteSession();
          redirect('/login');
        }} className="absolute bottom-[110%] w-[100%]">
          <button type="submit" className="w-full rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.1)] bg-black py-4 px-4 font-bold text-red-500 border border-zinc-700 opacity-0 group-hover:opacity-100 transition duration-200 invisible group-hover:visible z-50">
            Cerrar sesión
          </button>
        </form>
      </div>
    </nav>
  )
}
