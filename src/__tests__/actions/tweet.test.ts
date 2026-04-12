import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'

// Mock session
const mockDecrypt = vi.fn(() => Promise.resolve({ userId: 'user-123' }))
vi.mock('@/lib/session', () => ({
  decrypt: mockDecrypt,
}))

// Mock cookies con estado mutable
const mockCookieValue = { value: 'mock-session-token' }
const mockCookies = {
  get: vi.fn().mockReturnValue(mockCookieValue as any),
  set: vi.fn(),
  delete: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}))

describe('Tweet Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Restaurar mocks a estado autenticado por defecto
    mockCookies.get.mockReturnValue({ value: 'mock-session-token' })
    mockDecrypt.mockResolvedValue({ userId: 'user-123' })
  })

  describe('createTweet', () => {
    it('should redirect to login if not authenticated', async () => {
      mockCookies.get.mockReturnValueOnce(undefined as any)
      
      const { createTweet } = await import('@/actions/tweet')
      const formData = new FormData()
      formData.set('content', 'Hello world')
      
      await expect(createTweet(formData)).rejects.toThrow('REDIRECT:/login')
    })

    it('should reject empty tweets', async () => {
      const { createTweet } = await import('@/actions/tweet')
      const formData = new FormData()
      formData.set('content', '')
      
      const result = await createTweet(formData)
      expect(result).toBeUndefined()
      expect(prismaMock.tweet.create).not.toHaveBeenCalled()
    })

    it('should create tweet with valid content and redirect', async () => {
      const { createTweet } = await import('@/actions/tweet')
      prismaMock.tweet.create.mockResolvedValueOnce({ id: 'tweet-1' })
      
      const formData = new FormData()
      formData.set('content', 'This is a valid tweet!')
      
      await expect(createTweet(formData)).rejects.toThrow('REDIRECT:/')
      expect(prismaMock.tweet.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'This is a valid tweet!',
            authorId: 'user-123',
          }),
        })
      )
    })

    it('should enforce 280 character limit', async () => {
      const { createTweet } = await import('@/actions/tweet')
      const formData = new FormData()
      formData.set('content', 'a'.repeat(281))
      
      const result = await createTweet(formData)
      expect(result).toBeUndefined()
      expect(prismaMock.tweet.create).not.toHaveBeenCalled()
    })

    it('should accept tweets at exactly 280 characters', async () => {
      const { createTweet } = await import('@/actions/tweet')
      prismaMock.tweet.create.mockResolvedValueOnce({ id: 'tweet-280' })
      
      const formData = new FormData()
      formData.set('content', 'a'.repeat(280))
      
      await expect(createTweet(formData)).rejects.toThrow('REDIRECT:/')
      expect(prismaMock.tweet.create).toHaveBeenCalled()
    })
  })

  describe('toggleLike', () => {
    it('should create a like if none exists', async () => {
      const { toggleLike } = await import('@/actions/tweet')
      prismaMock.like.findUnique.mockResolvedValueOnce(null)
      prismaMock.like.create.mockResolvedValueOnce({ id: 'like-1' })
      
      await toggleLike('tweet-123')
      
      expect(prismaMock.like.create).toHaveBeenCalledWith({
        data: { userId: 'user-123', tweetId: 'tweet-123' },
      })
    })

    it('should delete like if already liked', async () => {
      const { toggleLike } = await import('@/actions/tweet')
      prismaMock.like.findUnique.mockResolvedValueOnce({ id: 'like-1' })
      
      await toggleLike('tweet-123')
      
      expect(prismaMock.like.delete).toHaveBeenCalledWith({
        where: { id: 'like-1' },
      })
    })

    it('should throw if not authenticated', async () => {
      mockCookies.get.mockReturnValueOnce(undefined as any)
      
      const { toggleLike } = await import('@/actions/tweet')
      await expect(toggleLike('tweet-123')).rejects.toThrow('Unauthenticated')
    })
  })

  describe('deleteTweet', () => {
    it('should delete own tweet', async () => {
      const { deleteTweet } = await import('@/actions/tweet')
      prismaMock.tweet.findUnique.mockResolvedValueOnce({
        id: 'tweet-1',
        authorId: 'user-123',
      })
      
      await expect(deleteTweet('tweet-1')).rejects.toThrow('REDIRECT:/')
      
      expect(prismaMock.tweet.delete).toHaveBeenCalledWith({
        where: { id: 'tweet-1' },
      })
    })

    it('should reject deletion of other users tweet', async () => {
      const { deleteTweet } = await import('@/actions/tweet')
      prismaMock.tweet.findUnique.mockResolvedValueOnce({
        id: 'tweet-1',
        authorId: 'other-user-456',
      })
      
      await expect(deleteTweet('tweet-1')).rejects.toThrow('No tienes permisos')
    })
  })
})
