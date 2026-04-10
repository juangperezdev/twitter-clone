import { cookies } from 'next/headers'
import { decrypt, deleteSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { TweetInteraction } from '@/components/TweetInteraction'
import { createTweet } from '@/actions/tweet'
import { ComposeTweet } from '@/components/ComposeTweet'

export default async function HomePage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  
  if (!sessionCookie) redirect('/login')

  const session = await decrypt(sessionCookie)
  if (!session?.userId) redirect('/login')

  const user = await prisma.user.findUnique({ where: { id: String(session.userId) } })
  if (!user) {
    await deleteSession()
    redirect('/login')
  }

  // Fetch de TODOS los tweets con la data relacional esencial
  const tweets = await prisma.tweet.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
      _count: { select: { likes: true } },
      likes: { select: { userId: true } } // Fundamental para saber si el "Corazón" del usuario está rojo
    }
  })

  // Evitar imágenes de Faker rotas usando un placeholder confiable según el seed param 
  const getAvatar = (avatarUrl: string | null, seed: string) => {
    return avatarUrl?.includes('cloudflare') || !avatarUrl 
        ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}` 
        : avatarUrl;
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center selection:bg-sky-500/30">
      {/* Sidebar Izquierdo */}
      <nav className="w-1/4 max-w-[275px] pt-4 px-4 h-screen sticky top-0 hidden sm:flex flex-col border-r border-zinc-800">
        <Link href="/" className="mb-6 w-14 h-14 flex items-center justify-center rounded-full hover:bg-zinc-900 transition">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">F</span>
          </div>
        </Link>
        <Link href="/" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-1 text-[20px] font-bold flex items-center gap-4 transition">
          <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19.993 9.042C19.48 5.017 16.054 2 11.996 2s-7.484 3.017-7.997 7.042c-1.589.697-2.675 2.502-2.675 4.458 0 2.222 1.488 4.103 3.513 4.757A3.987 3.987 0 007.996 22h8.001a3.987 3.987 0 003.159-3.743c2.025-.654 3.513-2.535 3.513-4.757 0-1.956-1.086-3.761-2.676-4.458zm-7.997-5.042c2.81 0 5.176 1.957 5.86 4.606C17.067 8.243 16.273 8 15.42 8H8.572c-.853 0-1.647.243-2.436.606.684-2.649 3.05-4.606 5.86-4.606z"/></svg>
          Inicio
        </Link>
        <Link href="#" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-1 text-[20px] flex items-center gap-4 transition text-zinc-200">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Explorar
        </Link>
        <Link href="#" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-4 text-[20px] flex items-center gap-4 transition text-zinc-200">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          Notificaciones
        </Link>
        
        <Link href="#" className="w-full bg-sky-500 hover:bg-sky-600 transition-colors py-3.5 rounded-full font-bold text-center text-[17px] shadow-lg shadow-sky-500/20">
          Postear
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
            <div className="hidden lg:block truncate">
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
      <main className="flex-1 w-[600px] max-w-[600px] border-r border-zinc-800 min-h-screen">
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-zinc-800 cursor-pointer">
          <h1 className="text-xl font-bold p-4">Inicio</h1>
          <div className="flex">
            <div className="flex-1 hover:bg-zinc-900 transition flex justify-center pb-0 text-white font-bold relative">
              <span className="py-4 relative">Para ti <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-full"></div></span>
            </div>
            <div className="flex-1 hover:bg-zinc-900 transition flex justify-center py-4 text-zinc-500 font-medium">
              Siguiendo
            </div>
          </div>
        </header>

        {/* Compose Tweet Box Interactiva con Preview */}
        <ComposeTweet 
           userAvatar={getAvatar(user.avatar, user.username)} 
           userName={user.name || ''} 
           userUsername={user.username} 
        />

        {/* Live Feed List */}
        <div>
          {tweets.map(tweet => (
            <article key={tweet.id} className="p-4 border-b border-zinc-800 hover:bg-zinc-950/40 transition cursor-pointer flex gap-4 group">
               <div className="w-10 h-10 bg-zinc-800 rounded-full shrink-0 overflow-hidden">
                 <img src={getAvatar(tweet.author.avatar, tweet.author.username)} alt="Avatar" className="w-full h-full object-cover" />
               </div>
               <div className="flex-1 w-full min-w-0">
                 <div className="flex items-center gap-1.5 text-[15px] truncate max-w-full">
                   <Link href={`/${tweet.author.username}`} className="font-bold hover:underline truncate text-white max-w-[50%]">{tweet.author.name}</Link>
                   <span className="text-zinc-500 truncate">@{tweet.author.username}</span>
                   <span className="text-zinc-500 shrink-0">·</span>
                   <span className="text-zinc-500 shrink-0 hover:underline">{new Date(tweet.createdAt).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                 </div>
                 <p className="mt-0.5 mb-1.5 text-[15px] leading-snug break-words">{tweet.content}</p>
                 
                 {/* Si el post posee Media adjunta */}
                 {tweet.imageUrl && (
                    <div className="mt-2.5 mb-3 rounded-2xl overflow-hidden border border-zinc-800 flex bg-black">
                      <img src={tweet.imageUrl} alt="Contenido multimedia del tweet" className="w-full object-cover max-h-[450px]" loading="lazy" />
                    </div>
                 )}
                 
                 {/* Acciones de React Client-Side (Likes / Eliminar) */}
                 <TweetInteraction tweet={tweet} loggedUserId={user.id} />
               </div>
            </article>
          ))}
          {tweets.length === 0 && (
            <div className="text-zinc-500 text-center py-10">No hay publicaciones recientes.</div>
          )}
        </div>
      </main>

      {/* Right Sidebar - Tendencias */}
      <aside className="w-1/3 max-w-[350px] p-4 hidden lg:block">
         <div className="sticky top-4 space-y-4">
            <div className="bg-zinc-900/50 rounded-full flex items-center px-4 py-3 group border border-transparent focus-within:border-sky-500 focus-within:bg-black transition-colors">
               <svg className="w-5 h-5 text-zinc-500 group-focus-within:text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               <input type="text" placeholder="Buscar" className="bg-transparent border-none outline-none ml-3 w-full placeholder-zinc-500 text-white" />
            </div>

            <div className="bg-zinc-900 rounded-2xl pt-4 pb-2 border border-zinc-800">
               <h2 className="font-bold text-xl px-4 mb-3">Qué está pasando</h2>
               {/* Trends estáticas */}
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
               <div className="hover:bg-zinc-800/50 cursor-pointer px-4 py-3 xl:rounded-b-2xl transition">
                  <p className="text-[15px] text-sky-500 hover:text-sky-400">Mostrar más</p>
               </div>
            </div>
         </div>
      </aside>
    </div>
  )
}
