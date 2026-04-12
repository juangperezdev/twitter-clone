import { prisma } from '@/lib/db'
import { cookies } from 'next/headers'
import { decrypt } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { TweetInteraction } from '@/components/TweetInteraction'
import { ComposeTweet } from '@/components/ComposeTweet'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StatusPage({ params }: Props) {
  const { id } = await params

  // Auth check
  const cookieStore = await cookies()
  const sessionValue = cookieStore.get('session')?.value
  if (!sessionValue) redirect('/login')
  const session = await decrypt(sessionValue)
  if (!session?.userId) redirect('/login')
  const currentUserId = String(session.userId)

  const currentUser = await prisma.user.findUnique({ 
    where: { id: currentUserId },
    select: { avatar: true, username: true, name: true }
  })

  if (!currentUser) redirect('/login')

  // Cargar tweet con autor, padre e hijos
  const tweet = await prisma.tweet.findUnique({
    where: { id },
    include: {
      author: true,
      _count: { select: { likes: true, replies: true } },
      likes: { select: { userId: true } },
      parent: {
        include: {
          author: true,
          _count: { select: { likes: true } },
          likes: { select: { userId: true } }
        }
      },
      replies: {
        orderBy: { createdAt: 'asc' },
        include: {
          author: true,
          _count: { select: { likes: true, replies: true } },
          likes: { select: { userId: true } }
        }
      }
    }
  })

  if (!tweet) notFound()

  const getAvatar = (avatarUrl: string | null, seed: string) => {
    return avatarUrl?.includes('cloudflare') || !avatarUrl
      ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`
      : avatarUrl;
  }

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <main className="flex-1 max-w-[600px] border-x border-zinc-800 min-h-screen">
        <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-md border-b border-zinc-800 px-4 py-3 flex items-center gap-6">
          <Link href="/" className="p-2 hover:bg-zinc-900 rounded-full">
             ←
          </Link>
          <h1 className="text-xl font-bold">Post</h1>
        </header>

        {/* Parent Tweet (Thread line) */}
        {tweet.parent && (
          <div className="p-4 flex gap-4 pb-0">
             <div className="relative flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800">
                <img src={getAvatar(tweet.parent.author.avatar, tweet.parent.author.username)} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="w-0.5 flex-1 bg-zinc-800 my-1" />
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-1 text-sm">
                <span className="font-bold text-white">{tweet.parent.author.name}</span>
                <span className="text-zinc-500">@{tweet.parent.author.username}</span>
              </div>
              <p className="text-[15px] mt-0.5">{tweet.parent.content}</p>
            </div>
          </div>
        )}

        {/* Main Tweet */}
        <article className="p-4 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-800">
              <img src={getAvatar(tweet.author.avatar, tweet.author.username)} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">{tweet.author.name}</p>
              <p className="text-zinc-500 text-sm">@{tweet.author.username}</p>
            </div>
          </div>

          <p className="text-[22px] leading-normal mb-4 break-words">{tweet.content}</p>

          {tweet.imageUrl && (
            <div className="mb-4 rounded-2xl overflow-hidden border border-zinc-800">
              <img src={tweet.imageUrl} alt="Media" className="w-full" />
            </div>
          )}

          <div className="py-4 border-y border-zinc-800 text-zinc-500 text-[15px] flex gap-4">
             <span><span className="text-white font-bold">{tweet._count.likes}</span> Me gusta</span>
             <span><span className="text-white font-bold">{tweet._count.replies}</span> Respuestas</span>
          </div>

          <div className="py-2">
            <TweetInteraction tweet={tweet} loggedUserId={currentUserId} />
          </div>
        </article>

        {/* Reply Editor */}
        <div className="pt-4 border-b border-zinc-800">
          <p className="text-sm text-zinc-500 mb-[-8px] ml-[72px]">Respondiendo a <span className="text-sky-500">@{tweet.author.username}</span></p>
          <ComposeTweet 
            placeholder="Postea tu respuesta" 
            parentId={tweet.id} 
            userAvatar={getAvatar(currentUser.avatar, currentUser.username)}
            userName={currentUser.name || ''}
            userUsername={currentUser.username}
          />
        </div>

        {/* Replies List */}
        <div>
          {tweet.replies.map((reply) => (
             <article key={reply.id} className="p-4 border-b border-zinc-800 flex gap-4 hover:bg-zinc-950 transition">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                  <img src={getAvatar(reply.author.avatar, reply.author.username)} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[15px] truncate text-white">
                    <span className="font-bold truncate">{reply.author.name}</span>
                    <span className="text-zinc-500 truncate">@{reply.author.username}</span>
                    <span className="text-zinc-500 shrink-0">·</span>
                    <span className="text-zinc-500 shrink-0">{new Date(reply.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-0.5 text-[15px] break-words">{reply.content}</p>
                  <TweetInteraction tweet={reply} loggedUserId={currentUserId} />
                </div>
             </article>
          ))}
        </div>
      </main>
    </div>
  )
}
