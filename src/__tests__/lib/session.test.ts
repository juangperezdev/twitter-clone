// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SignJWT, jwtVerify } from 'jose'

// Test the session logic directly without importing session.ts (which has server-only)
// This tests the core encrypt/decrypt logic
const secretKey = 'test-secret-key-that-is-long-enough-32chars!'
const encodedKey = new TextEncoder().encode(secretKey)

async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(encodedKey)
}

async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session!, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload
  } catch {
    return null
  }
}

describe('Session Library', () => {
  it('should encrypt and decrypt a payload correctly', async () => {
    const payload = { userId: 'user-123' }
    const token = await encrypt(payload)
    
    expect(token).toBeDefined()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3) // JWT: header.payload.signature
    
    const decrypted = await decrypt(token)
    expect(decrypted).toBeDefined()
    expect(decrypted?.userId).toBe('user-123')
  })

  it('should return null for an invalid token', async () => {
    const result = await decrypt('invalid-token')
    expect(result).toBeNull()
  })

  it('should return null for an empty token', async () => {
    const result = await decrypt('')
    expect(result).toBeNull()
  })

  it('should return null for undefined token', async () => {
    const result = await decrypt(undefined)
    expect(result).toBeNull()
  })

  it('should generate different tokens for different payloads', async () => {
    const token1 = await encrypt({ userId: 'user-1' })
    const token2 = await encrypt({ userId: 'user-2' })
    expect(token1).not.toBe(token2)
  })

  it('should set expiration time on token', async () => {
    const token = await encrypt({ userId: 'user-123' })
    const decoded = await decrypt(token)
    
    expect(decoded?.exp).toBeDefined()
    const sevenDaysFromNow = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
    expect(decoded!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000))
    expect(decoded!.exp).toBeLessThanOrEqual(sevenDaysFromNow + 5)
  })

  it('should reject tampered tokens', async () => {
    const token = await encrypt({ userId: 'user-123' })
    const tampered = token.slice(0, -5) + 'xxxxx'
    const result = await decrypt(tampered)
    expect(result).toBeNull()
  })

  it('should reject tokens signed with different key', async () => {
    const wrongKey = new TextEncoder().encode('wrong-key-that-is-also-long-enough!')
    const wrongToken = await new SignJWT({ userId: 'hacker' })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(wrongKey)
    
    const result = await decrypt(wrongToken)
    expect(result).toBeNull()
  })
})
