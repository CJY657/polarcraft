import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  generateAccessToken,
  generateEmailVerifyToken,
  generateRefreshToken,
  verifyEmailVerifyToken,
  verifyRefreshToken,
} from './jwt.util.js'

describe('JWT refresh tokens', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates a unique token for repeated requests in the same second', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T00:00:00.000Z'))

    const payload = {
      sub: 'user-1',
      username: 'alice',
      role: 'user' as const,
    }
    const firstToken = generateRefreshToken(payload)
    const secondToken = generateRefreshToken(payload)

    expect(secondToken).not.toBe(firstToken)
    expect(verifyRefreshToken(firstToken)).toMatchObject({
      ...payload,
      type: 'refresh',
    })
  })
})

describe('Email verification tokens', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('round-trips the user id and email', () => {
    const token = generateEmailVerifyToken('user-1', 'alice@example.com')

    expect(verifyEmailVerifyToken(token)).toMatchObject({
      sub: 'user-1',
      email: 'alice@example.com',
      type: 'email_verify',
    })
  })

  it('rejects an access token signed with the same secret', () => {
    const accessToken = generateAccessToken({
      sub: 'user-1',
      username: 'alice',
      role: 'user' as const,
    })

    expect(() => verifyEmailVerifyToken(accessToken)).toThrow(
      'Invalid or expired email verification token'
    )
  })

  it('rejects a token past its 24 hour expiry', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-28T00:00:00.000Z'))
    const token = generateEmailVerifyToken('user-1', 'alice@example.com')

    vi.setSystemTime(new Date('2026-07-29T00:00:01.000Z'))

    expect(() => verifyEmailVerifyToken(token)).toThrow(
      'Invalid or expired email verification token'
    )
  })
})
