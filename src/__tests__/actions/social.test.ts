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
  get: vi.fn(() => ({ value: 'mock-session-token' })),
  set: vi.fn(),
  delete: vi.fn(),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
}))

describe('Social Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('toggleFollow', () => {
    it('should create follow if not following', async () => {
      const { toggleFollow } = await import('@/actions/social')
      prismaMock.follow.findUnique.mockResolvedValueOnce(null)
      prismaMock.follow.create.mockResolvedValueOnce({})
      
      await toggleFollow('user-456')
      
      expect(prismaMock.follow.create).toHaveBeenCalledWith({
        data: {
          followerId: 'user-123',
          followingId: 'user-456',
        },
      })
    })

    it('should unfollow if already following', async () => {
      const { toggleFollow } = await import('@/actions/social')
      prismaMock.follow.findUnique.mockResolvedValueOnce({
        followerId: 'user-123',
        followingId: 'user-456',
      })
      
      await toggleFollow('user-456')
      
      expect(prismaMock.follow.delete).toHaveBeenCalled()
    })

    it('should reject self-follow', async () => {
      const { toggleFollow } = await import('@/actions/social')
      
      await expect(toggleFollow('user-123')).rejects.toThrow('Cannot follow yourself')
    })
  })

  describe('searchUsers', () => {
    it('should return empty array for short queries', async () => {
      const { searchUsers } = await import('@/actions/social')
      const result = await searchUsers('a')
      expect(result).toEqual([])
    })

    it('should return empty array for empty query', async () => {
      const { searchUsers } = await import('@/actions/social')
      const result = await searchUsers('')
      expect(result).toEqual([])
    })

    it('should search users by name or username', async () => {
      const { searchUsers } = await import('@/actions/social')
      
      const mockUsers = [
        { id: '1', username: 'john', name: 'John Doe', avatar: null, bio: 'Hi', _count: { followers: 5, following: 3, tweets: 10 } },
        { id: '2', username: 'johnny', name: 'Johnny', avatar: null, bio: null, _count: { followers: 2, following: 1, tweets: 3 } },
      ]
      prismaMock.user.findMany.mockResolvedValueOnce(mockUsers)
      
      const result = await searchUsers('john')
      
      expect(result).toHaveLength(2)
      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { username: { contains: 'john', mode: 'insensitive' } },
              { name: { contains: 'john', mode: 'insensitive' } },
            ],
          },
          take: 20,
        }),
      )
    })
  })
})
