import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'

// Mock session
vi.mock('@/lib/session', () => ({
  decrypt: vi.fn(() => Promise.resolve({ userId: 'user-123' })),
}))

// Mock cookies
const mockCookies = {
  get: vi.fn(() => ({ value: 'mock-session-token' })),
}
const mockHeaders = {
  get: vi.fn().mockReturnValue('localhost:3000'),
}
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookies)),
  headers: vi.fn(() => Promise.resolve(mockHeaders)),
}))

describe('Recovery Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('forgotPassword', () => {
    it('should return error for missing email', async () => {
      const { forgotPassword } = await import('@/actions/recovery')
      
      const formData = new FormData()
      formData.set('email', '')
      
      const result = await forgotPassword(undefined, formData)
      expect(result?.error).toBeDefined()
    })

    it('should return success even for non-existent email (anti-enumeration)', async () => {
      const { forgotPassword } = await import('@/actions/recovery')
      
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      
      const formData = new FormData()
      formData.set('email', 'nonexistent@test.com')
      
      const result = await forgotPassword(undefined, formData)
      expect(result?.success).toBe(true)
    })

    it('should generate reset token for existing user', async () => {
      const { forgotPassword } = await import('@/actions/recovery')
      
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'user-1', email: 'test@test.com' })
      prismaMock.user.update.mockResolvedValueOnce({})
      
      const formData = new FormData()
      formData.set('email', 'test@test.com')
      
      const result = await forgotPassword(undefined, formData)
      
      expect(result?.success).toBe(true)
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            resetToken: expect.any(String),
            resetTokenExpiry: expect.any(Date),
          }),
        }),
      )
    })
  })

  describe('resetPassword', () => {
    it('should reject missing credentials', async () => {
      const { resetPassword } = await import('@/actions/recovery')
      
      const formData = new FormData()
      formData.set('token', '')
      formData.set('password', '')
      
      const result = await resetPassword(undefined, formData)
      expect(result?.error).toBeDefined()
    })

    it('should reject invalid/expired token', async () => {
      const { resetPassword } = await import('@/actions/recovery')
      
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      
      const formData = new FormData()
      formData.set('token', 'invalid-token')
      formData.set('password', 'NewPassword1!')
      
      const result = await resetPassword(undefined, formData)
      expect(result?.error).toContain('expirado')
    })

    it('should reject expired token', async () => {
      const { resetPassword } = await import('@/actions/recovery')
      
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        resetToken: 'token',
        resetTokenExpiry: new Date(Date.now() - 3600000), // expired 1h ago
      })
      
      const formData = new FormData()
      formData.set('token', 'token')
      formData.set('password', 'NewPassword1!')
      
      const result = await resetPassword(undefined, formData)
      expect(result?.error).toContain('expirado')
    })

    it('should update password with valid token', async () => {
      const { resetPassword } = await import('@/actions/recovery')
      
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        resetToken: 'valid-token',
        resetTokenExpiry: new Date(Date.now() + 3600000),
      })
      prismaMock.user.update.mockResolvedValueOnce({})
      
      const formData = new FormData()
      formData.set('token', 'valid-token')
      formData.set('password', 'NewPassword1!')
      
      const result = await resetPassword(undefined, formData)
      
      expect(result?.success).toBe(true)
      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-1' },
          data: expect.objectContaining({
            resetToken: null,
            resetTokenExpiry: null,
          }),
        }),
      )
    })
  })
})
