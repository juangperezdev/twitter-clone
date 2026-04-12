import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/components/Sidebar'

export default async function NotificationsPage() {
  // Auth check
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get('session')?.value
  if (!sessionValue) redirect('/login')
  const session = await decrypt(sessionValue)
  if (!session?.userId) redirect('/login')
  const currentUserId = String(session.userId)

  // Cargar notificaciones
  const notifications = await prisma.notification.findMany({
    where: { recipientId: currentUserId },
    orderBy: { createdAt: 'desc' },
    include: {
      actor: {
        select: {
          username: true,
          name: true,
          avatar: true
        }
      },
      tweet: {
        select: {
          id: true,
          content: true
        }
      }
    },
    take: 50
  })

  // Marcar como leídas
  await prisma.notification.updateMany({
    where: { recipientId: currentUserId, read: false },
    data: { read: true }
  })

  const getAvatar = (avatarUrl: string | null, seed: string) => {
    return avatarUrl?.includes('cloudflare') || !avatarUrl
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
      : avatarUrl;
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <Sidebar />

      <main className="flex-1 max-w-[600px] border-r border-zinc-800 min-h-screen">
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-zinc-800 items-center gap-4 px-4 py-3 flex">
          <Link href="/" className="p-2 hover:bg-zinc-900 rounded-full transition -ml-2 sm:hidden">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <h1 className="text-xl font-bold">Notificaciones</h1>
        </header>

        <div>
          {notifications.map((notif) => (
            <div key={notif.id} className={`p-4 border-b border-zinc-800 flex gap-4 ${!notif.read ? 'bg-sky-500/5' : ''}`}>
              <div className="mt-1">
                {notif.type === 'FOLLOW' && <span className="text-sky-500 text-2xl">👤</span>}
                {notif.type === 'LIKE' && <span className="text-pink-500 text-2xl">❤️</span>}
                {notif.type === 'REPLY' && <span className="text-sky-500 text-2xl">💬</span>}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800">
                    <img src={getAvatar(notif.actor.avatar, notif.actor.username)} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <Link href={`/${notif.actor.username}`} className="font-bold hover:underline">
                    {notif.actor.name || notif.actor.username}
                  </Link>
                </div>
                
                <p className="text-[15px] text-zinc-300">
                  {notif.type === 'FOLLOW' && 'te empezó a seguir'}
                  {notif.type === 'LIKE' && 'le dio me gusta a tu post'}
                  {notif.type === 'REPLY' && 'respondió a tu post'}
                </p>

                {notif.tweet && (
                  <Link href={`/status/${notif.tweet.id}`} className="block mt-2 text-zinc-500 text-sm italic line-clamp-2">
                    "{notif.tweet.content}"
                  </Link>
                )}
                
                <span className="text-[13px] text-zinc-600 mt-2 block">
                  {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="text-center py-20 px-8">
              <h2 className="text-2xl font-bold mb-2">Nada que ver por acá... todavía.</h2>
              <p className="text-zinc-500">Cuando alguien te siga o interactúe con tus posts, lo verás aquí.</p>
            </div>
          )}
        </div>
      </main>
      
      <aside className="w-1/3 max-w-[350px] p-4 hidden lg:block" />
    </div>
  )
}
