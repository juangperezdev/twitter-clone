import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '../mocks/prisma'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock session
vi.mock('@/lib/session', () => ({
  encrypt: vi.fn(() => Promise.resolve('mock-token')),
  decrypt: vi.fn(() => Promise.resolve({ userId: 'user-123' })),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
}))

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should reject registration with missing fields', async () => {
      const { register } = await import('@/actions/auth')
      
      const formData = new FormData()
      formData.set('email', '')
      formData.set('username', '')
      formData.set('password', '')
      formData.set('name', '')
      
      const result = await register(undefined, formData)
      expect(result?.error).toBe('Revisa los campos obligatorios.')
    })

    it('should reject weak passwords', async () => {
      const { register } = await import('@/actions/auth')
      
      const formData = new FormData()
      formData.set('email', 'test@test.com')
      formData.set('username', 'testuser')
      formData.set('password', 'weak')
      formData.set('name', 'Test User')
      
      const result = await register(undefined, formData)
      expect(result?.error).toContain('contraseña')
    })

    it('should reject password without uppercase', async () => {
      const { register } = await import('@/actions/auth')
      
      const formData = new FormData()
      formData.set('email', 'test@test.com')
      formData.set('username', 'testuser')
      formData.set('password', 'password1!')
      formData.set('name', 'Test')
      
      const result = await register(undefined, formData)
      expect(result?.error).toContain('contraseña')
    })

    it('should reject password without number', async () => {
      const { register } = await import('@/actions/auth')
      
      const formData = new FormData()
      formData.set('email', 'test@test.com')
      formData.set('username', 'testuser')
      formData.set('password', 'Password!')
      formData.set('name', 'Test')
      
      const result = await register(undefined, formData)
      expect(result?.error).toContain('contraseña')
    })

    it('should reject password without symbol', async () => {
      const { register } = await import('@/actions/auth')
      
      const formData = new FormData()
      formData.set('email', 'test@test.com')
      formData.set('username', 'testuser')
      formData.set('password', 'Password1')
      formData.set('name', 'Test')
      
      const result = await register(undefined, formData)
      expect(result?.error).toContain('contraseña')
    })

    it('should reject duplicate email/username', async () => {
      const { register } = await import('@/actions/auth')
      
      prismaMock.user.findFirst.mockResolvedValueOnce({ id: 'existing' })
      
      const formData = new FormData()
      formData.set('email', 'existing@test.com')
      formData.set('username', 'existinguser')
      formData.set('password', 'Password1!')
      formData.set('name', 'Test')
      
      const result = await register(undefined, formData)
      expect(result?.error).toContain('ya está en uso')
    })

    it('should create user and redirect on valid registration', async () => {
      const { register } = await import('@/actions/auth')
      
      prismaMock.user.findFirst.mockResolvedValueOnce(null)
      prismaMock.user.create.mockResolvedValueOnce({ id: 'new-user-id' })
      
      const formData = new FormData()
      formData.set('email', 'new@test.com')
      formData.set('username', 'newuser')
      formData.set('password', 'Password1!')
      formData.set('name', 'New User')
      
      await expect(register(undefined, formData)).rejects.toThrow('REDIRECT:/')
      expect(prismaMock.user.create).toHaveBeenCalledOnce()
    })
  })

  describe('login', () => {
    it('should reject empty fields', async () => {
      const { login } = await import('@/actions/auth')
      
      const formData = new FormData()
      formData.set('emailOrUsername', '')
      formData.set('password', '')
      
      const result = await login(undefined, formData)
      expect(result?.error).toBe('Llena todos los campos.')
    })

    it('should reject non-existent user', async () => {
      const { login } = await import('@/actions/auth')
      
      prismaMock.user.findFirst.mockResolvedValueOnce(null)
      
      const formData = new FormData()
      formData.set('emailOrUsername', 'nobody@test.com')
      formData.set('password', 'Password1!')
      
      const result = await login(undefined, formData)
      expect(result?.error).toBe('Credenciales inválidas.')
    })

    it('should reject wrong password', async () => {
      const bcrypt = await import('bcryptjs')
      const { login } = await import('@/actions/auth')
      
      prismaMock.user.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        password: await bcrypt.hash('CorrectPassword1!', 10),
      })
      
      const formData = new FormData()
      formData.set('emailOrUsername', 'user@test.com')
      formData.set('password', 'WrongPassword1!')
      
      const result = await login(undefined, formData)
      expect(result?.error).toBe('Credenciales inválidas.')
    })

    it('should redirect on successful login', async () => {
      const bcrypt = await import('bcryptjs')
      const { login } = await import('@/actions/auth')
      
      const hashedPw = await bcrypt.hash('Password1!', 10)
      prismaMock.user.findFirst.mockResolvedValueOnce({
        id: 'user-123',
        password: hashedPw,
      })
      
      const formData = new FormData()
      formData.set('emailOrUsername', 'user@test.com')
      formData.set('password', 'Password1!')
      
      await expect(login(undefined, formData)).rejects.toThrow('REDIRECT:/')
    })
  })

  describe('checkUsernameAvailability', () => {
    it('should return null for short usernames', async () => {
      const { checkUsernameAvailability } = await import('@/actions/auth')
      const result = await checkUsernameAvailability('ab')
      expect(result).toBeNull()
    })

    it('should return true for available username', async () => {
      const { checkUsernameAvailability } = await import('@/actions/auth')
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      const result = await checkUsernameAvailability('newuser')
      expect(result).toBe(true)
    })

    it('should return false for taken username', async () => {
      const { checkUsernameAvailability } = await import('@/actions/auth')
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'exists' })
      const result = await checkUsernameAvailability('takenuser')
      expect(result).toBe(false)
    })
  })

  describe('checkEmailAvailability', () => {
    it('should return null for invalid email', async () => {
      const { checkEmailAvailability } = await import('@/actions/auth')
      const result = await checkEmailAvailability('notanemail')
      expect(result).toBeNull()
    })

    it('should return true for available email', async () => {
      const { checkEmailAvailability } = await import('@/actions/auth')
      prismaMock.user.findUnique.mockResolvedValueOnce(null)
      const result = await checkEmailAvailability('new@test.com')
      expect(result).toBe(true)
    })

    it('should return false for taken email', async () => {
      const { checkEmailAvailability } = await import('@/actions/auth')
      prismaMock.user.findUnique.mockResolvedValueOnce({ id: 'exists' })
      const result = await checkEmailAvailability('taken@test.com')
      expect(result).toBe(false)
    })
  })
})
