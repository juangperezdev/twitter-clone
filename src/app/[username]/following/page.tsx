import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { FollowButton } from '@/components/FollowButton'

interface Props {
  params: Promise<{ username: string }>
}

export default async function FollowingPage({ params }: Props) {
  const { username } = await params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')?.value
  if (!sessionCookie) redirect('/login')
  const session = await decrypt(sessionCookie)
  if (!session?.userId) redirect('/login')
  const currentUserId = String(session.userId)

  const profileUser = await prisma.user.findUnique({
    where: { username },
    include: {
      following: {
        include: {
          following: {
            include: {
              _count: { select: { followers: true } },
              followers: { select: { followerId: true } }
            }
          }
        }
      }
    }
  })

  if (!profileUser) notFound()

  const getAvatar = (avatarUrl: string | null, seed: string) => {
    return avatarUrl?.includes('cloudflare') || !avatarUrl
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
      : avatarUrl;
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <nav className="w-1/4 max-w-[275px] pt-4 px-4 h-screen sticky top-0 hidden sm:flex flex-col border-r border-zinc-800">
        <Link href="/" className="mb-6 w-14 h-14 flex items-center justify-center rounded-full hover:bg-zinc-900 transition">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">F</span>
          </div>
        </Link>
      </nav>

      <main className="flex-1 max-w-[600px] border-r border-zinc-800 min-h-screen">
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center gap-6">
          <Link href={`/${username}`} className="p-2 hover:bg-zinc-900 rounded-full transition -ml-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{profileUser.name || profileUser.username}</h1>
            <p className="text-[13px] text-zinc-500">@{profileUser.username}</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          <Link href={`/${username}/followers`} className="flex-1 flex justify-center hover:bg-zinc-900 transition cursor-pointer">
            <span className="py-4 text-zinc-500 font-medium text-sm">Seguidores</span>
          </Link>
          <Link href={`/${username}/following`} className="flex-1 flex justify-center hover:bg-zinc-900 transition cursor-pointer">
            <span className="py-4 relative text-white font-bold text-sm">
              Siguiendo
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500 rounded-full" />
            </span>
          </Link>
        </div>

        {/* Lista */}
        <div>
          {profileUser.following.map(({ following: followedUser }) => {
            const amIFollowing = followedUser.followers.some(f => f.followerId === currentUserId)
            return (
              <div key={followedUser.id} className="p-4 hover:bg-zinc-950/40 transition flex items-start gap-3 border-b border-zinc-800">
                <Link href={`/${followedUser.username}`} className="w-10 h-10 bg-zinc-800 rounded-full shrink-0 overflow-hidden block">
                  <img src={getAvatar(followedUser.avatar, followedUser.username)} alt="" className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center gap-2">
                    <Link href={`/${followedUser.username}`} className="truncate">
                      <p className="font-bold text-sm hover:underline truncate">{followedUser.name}</p>
                      <p className="text-zinc-500 text-sm truncate">@{followedUser.username}</p>
                    </Link>
                    {followedUser.id !== currentUserId && (
                      <FollowButton targetUserId={followedUser.id} isFollowing={amIFollowing} />
                    )}
                  </div>
                  {followedUser.bio && <p className="text-sm mt-1 text-zinc-300 line-clamp-2">{followedUser.bio}</p>}
                </div>
              </div>
            )
          })}
          {profileUser.following.length === 0 && (
            <p className="text-zinc-500 text-center py-16 text-sm">@{username} no sigue a nadie todavía.</p>
          )}
        </div>
      </main>
      <aside className="w-1/3 max-w-[350px] p-4 hidden lg:block" />
    </div>
  )
}
