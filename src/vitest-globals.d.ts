/**
 * Vitest Global Type Declarations
 * Provides type definitions for vitest globals in test files
 */

import type { Assertion, expect } from 'vitest'

declare module 'vitest' {
  interface Matchers<R = void> {
    toBe(expected: unknown): R
    toEqual(expected: unknown): R
    toBeNull(): R
    toBeUndefined(): R
    toBeDefined(): R
    toBeTruthy(): R
    toBeFalsy(): R
    toBeGreaterThan(expected: number): R
    toBeLessThan(expected: number): R
    toContain(expected: unknown): R
    toHaveLength(expected: number): R
    toThrow(expected?: unknown): R
    toMatch(expected: string | RegExp): R
    toBeInstanceOf(expected: unknown): R
  }
}

declare global {
  const describe: typeof import('vitest').describe
  const it: typeof import('vitest').it
  const test: typeof import('vitest').test
  const expect: typeof import('vitest').expect
  const beforeAll: typeof import('vitest').beforeAll
  const afterAll: typeof import('vitest').afterAll
  const beforeEach: typeof import('vitest').beforeEach
  const afterEach: typeof import('vitest').afterEach
  const vi: typeof import('vitest').vi
}

export {}
