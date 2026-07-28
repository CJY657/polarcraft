import { afterEach, describe, expect, it, vi } from 'vitest'
import { generateRefreshToken, verifyRefreshToken } from './jwt.util.js'

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
