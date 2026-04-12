import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { FollowButton } from '@/components/FollowButton'
import { TweetInteraction } from '@/components/TweetInteraction'

interface Props {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { username } = await params
  const { tab } = await searchParams
  const activeTab = tab === 'likes' ? 'likes' : 'posts'

  // Auth check
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) redirect('/login')
  const session = await decrypt(sessionCookie)
  if (!session?.userId) redirect('/login')
  const currentUserId = String(session.userId)

  // Cargar perfil
  const profileUser = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: { select: { followers: true, following: true, tweets: true } },
      followers: { select: { followerId: true } },
    }
  })

  if (!profileUser) notFound()

  const isOwnProfile = profileUser.id === currentUserId
  const isFollowing = profileUser.followers.some(f => f.followerId === currentUserId)

  // Tweets a mostrar (propios o likeados)
  const tweets = await prisma.tweet.findMany({
    where: activeTab === 'likes' 
      ? { likes: { some: { userId: profileUser.id } } }
      : { authorId: profileUser.id },
    orderBy: { createdAt: 'desc' },
    include: {
      author: true,
      _count: { select: { likes: true } },
      likes: { select: { userId: true } }
    }
  })

  const getAvatar = (avatarUrl: string | null, seed: string) => {
    return avatarUrl?.includes('cloudflare') || !avatarUrl
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
      : avatarUrl;
  }

  // Count unread notifications
  const unreadCount = await prisma.notification.count({
    where: { recipientId: currentUserId, read: false }
  })

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      {/* Sidebar */}
      <nav className="w-1/4 max-w-[275px] pt-4 px-4 h-screen sticky top-0 hidden sm:flex flex-col border-r border-zinc-800">
        <Link href="/" className="mb-6 w-14 h-14 flex items-center justify-center rounded-full hover:bg-zinc-900 transition font-bold text-2xl bg-white text-black">
          F
        </Link>
        <Link href="/" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-1 text-[20px] flex items-center gap-4 transition text-zinc-200">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          Inicio
        </Link>
        <Link href="/notifications" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-1 text-[20px] flex items-center gap-4 transition text-zinc-200 relative">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          Notificaciones
          {unreadCount > 0 && (
            <span className="absolute top-2 left-9 bg-sky-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-black">
              {unreadCount}
            </span>
          )}
        </Link>
        <Link href="/search" className="px-5 py-3.5 hover:bg-zinc-900 rounded-full w-fit mb-1 text-[20px] flex items-center gap-4 transition text-zinc-200">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          Explorar
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-[600px] border-r border-zinc-800 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center gap-6">
          <Link href="/" className="p-2 hover:bg-zinc-900 rounded-full transition -ml-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold leading-tight">{profileUser.name || profileUser.username}</h1>
            <p className="text-[13px] text-zinc-500">{profileUser._count.tweets} posts</p>
          </div>
        </header>

        {/* Banner */}
        <div className="h-48 bg-gradient-to-br from-sky-900/50 via-zinc-900 to-zinc-950" />

        {/* Perfil Info */}
        <div className="px-4 pb-4 border-b border-zinc-800">
          <div className="flex justify-between items-start -mt-16 mb-4">
            <div className="w-[134px] h-[134px] rounded-full border-4 border-black overflow-hidden bg-zinc-800">
              <img src={getAvatar(profileUser.avatar, profileUser.username)} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            {!isOwnProfile && (
              <div className="mt-20">
                <FollowButton targetUserId={profileUser.id} isFollowing={isFollowing} />
              </div>
            )}
            {isOwnProfile && (
              <div className="mt-20">
                <button className="px-5 py-2 rounded-full font-bold text-sm border border-zinc-600 text-white hover:bg-zinc-900 transition">
                  Editar perfil
                </button>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold">{profileUser.name || profileUser.username}</h2>
          <p className="text-zinc-500 text-[15px]">@{profileUser.username}</p>
          {profileUser.bio && <p className="mt-3 text-[15px] leading-relaxed">{profileUser.bio}</p>}
          
          <div className="flex items-center gap-1 text-zinc-500 text-sm mt-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span>Se unió en {new Date(profileUser.createdAt).toLocaleDateString('es', { month: 'long', year: 'numeric' })}</span>
          </div>

          <div className="flex gap-5 mt-3">
            <Link href={`/${username}/following`} className="hover:underline">
              <span className="font-bold text-white">{profileUser._count.following}</span>
              <span className="text-zinc-500 text-sm ml-1">Siguiendo</span>
            </Link>
            <Link href={`/${username}/followers`} className="hover:underline">
              <span className="font-bold text-white">{profileUser._count.followers}</span>
              <span className="text-zinc-500 text-sm ml-1">Seguidores</span>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <Link 
            href={`/${username}`} 
            className="flex-1 flex justify-center hover:bg-zinc-900 transition cursor-pointer"
          >
            <span className={`py-4 relative text-sm ${activeTab === 'posts' ? 'text-white font-bold' : 'text-zinc-500 font-medium'}`}>
              Posts
              {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-full" />}
            </span>
          </Link>
          <Link 
            href={`/${username}?tab=likes`} 
            className="flex-1 flex justify-center hover:bg-zinc-900 transition cursor-pointer"
          >
            <span className={`py-4 relative text-sm ${activeTab === 'likes' ? 'text-white font-bold' : 'text-zinc-500 font-medium'}`}>
              Likes
              {activeTab === 'likes' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-full" />}
            </span>
          </Link>
        </div>

        {/* Listado de tweets */}
        <div>
          {tweets.map(tweet => (
            <article key={tweet.id} className="p-4 border-b border-zinc-800 hover:bg-zinc-950/40 transition flex gap-4">
              <Link href={`/${tweet.author.username}`} className="w-10 h-10 bg-zinc-800 rounded-full shrink-0 overflow-hidden">
                <img src={getAvatar(tweet.author.avatar, tweet.author.username)} alt="Avatar" className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 w-full min-w-0">
                <div className="flex items-center gap-1.5 text-[15px] truncate text-white">
                  <Link href={`/${tweet.author.username}`} className="font-bold truncate hover:underline">{tweet.author.name}</Link>
                  <Link href={`/${tweet.author.username}`} className="text-zinc-500 truncate">@{tweet.author.username}</Link>
                  <span className="text-zinc-500 shrink-0">·</span>
                  <span className="text-zinc-500 shrink-0">{new Date(tweet.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
                <p className="mt-0.5 mb-1.5 text-[15px] leading-snug break-words">{tweet.content}</p>
                {tweet.imageUrl && (
                  <div className="mt-2.5 mb-3 rounded-2xl overflow-hidden border border-zinc-800 flex bg-black">
                    <img src={tweet.imageUrl} alt="Media" className="w-full object-cover max-h-[450px]" loading="lazy" />
                  </div>
                )}
                <TweetInteraction tweet={tweet} loggedUserId={currentUserId} />
              </div>
            </article>
          ))}
          {tweets.length === 0 && (
            <div className="text-zinc-500 text-center py-16 px-8">
              <p className="text-lg font-bold text-white mb-1">
                {activeTab === 'likes' ? 'No tienes likes todavía' : 'Todavía sin publicaciones'}
              </p>
              <p className="text-sm">
                {activeTab === 'likes' 
                  ? 'Cuando des like a un post, aparecerá acá.' 
                  : (isOwnProfile ? 'Cuando publiques algo, aparecerá acá.' : `@${username} todavía no ha publicado nada.`)}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-1/3 max-w-[350px] p-4 hidden lg:block" />
    </div>
  )
}
