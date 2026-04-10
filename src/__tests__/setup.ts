import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock next/headers (cookies)
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`REDIRECT:${url}`) }),
  notFound: vi.fn(() => { throw new Error('NOT_FOUND') }),
  usePathname: vi.fn(() => '/'),
}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Env vars para tests
process.env.SESSION_SECRET = 'test-secret-key-that-is-long-enough-32chars!'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
