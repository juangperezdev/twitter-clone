import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock session
vi.mock('@/lib/session', () => ({
  decrypt: vi.fn(() => Promise.resolve({ userId: 'user-123' })),
}))

// Mock cookies
const mockCookies = {
  get: vi.fn().mockReturnValue({ value: 'mock-session-token' } as any),
  set: vi.fn(),
  delete: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}))

describe('Timeline Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loadTweets', () => {
    it('should return tweets for "forYou" mode', async () => {
      const { loadTweets } = await import('@/actions/timeline')
      
      const mockTweets = Array.from({ length: 5 }).map((_, i) => ({
        id: `tweet-${i}`,
        content: `Tweet ${i}`,
        imageUrl: null,
        authorId: `user-${i}`,
        createdAt: new Date(),
        author: {
          id: `user-${i}`,
          username: `user${i}`,
          name: `User ${i}`,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          resetTokenExpiry: null,
        },
        _count: { likes: i },
        likes: [],
      }))
      
      prismaMock.tweet.findMany.mockResolvedValueOnce(mockTweets)
      
      const result = await loadTweets(0, 'forYou')
      
      expect(result.tweets).toHaveLength(5)
      expect(result.hasMore).toBe(false)
    })

    it('should detect hasMore when more than 10 tweets', async () => {
      const { loadTweets } = await import('@/actions/timeline')
      
      const mockTweets = Array.from({ length: 11 }).map((_, i) => ({
        id: `tweet-${i}`,
        content: `Tweet ${i}`,
        imageUrl: null,
        authorId: `user-${i}`,
        createdAt: new Date(),
        author: {
          id: `user-${i}`,
          username: `user${i}`,
          name: `User ${i}`,
          avatar: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          resetTokenExpiry: null,
        },
        _count: { likes: 0 },
        likes: [],
      }))
      
      prismaMock.tweet.findMany.mockResolvedValueOnce(mockTweets)
      
      const result = await loadTweets(0, 'forYou')
      
      expect(result.tweets).toHaveLength(10) // Trimmed
      expect(result.hasMore).toBe(true)
    })

    it('should filter by following in "following" mode', async () => {
      const { loadTweets } = await import('@/actions/timeline')
      
      prismaMock.tweet.findMany.mockResolvedValueOnce([])
      
      await loadTweets(0, 'following')
      
      expect(prismaMock.tweet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            parentId: null,
            OR: [
              { authorId: 'user-123' },
              { author: { followers: { some: { followerId: 'user-123' } } } },
            ],
          },
        }),
      )
    })

    it('should return empty for unauthenticated users', async () => {
      mockCookies.get.mockReturnValueOnce(undefined as any)
      const { decrypt } = await import('@/lib/session')
      vi.mocked(decrypt).mockResolvedValueOnce(null)
      
      const { loadTweets } = await import('@/actions/timeline')
      const result = await loadTweets(0, 'forYou')
      
      expect(result.tweets).toEqual([])
      expect(result.hasMore).toBe(false)
    })
  })
})
