import { describe, it, expect } from 'vitest'
import { cn, formatDate, truncate } from '../utils'

describe('cn', () => {
  it('merges class names', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('handles conditional classes', () => {
    const result = cn('base', false && 'hidden', 'extra')
    expect(result).toContain('base')
    expect(result).toContain('extra')
    expect(result).not.toContain('hidden')
  })
})

describe('formatDate', () => {
  it('formats date to Indonesian locale', () => {
    const result = formatDate('2026-01-15')
    expect(result).toContain('15')
    expect(result).toContain('2026')
  })

  it('handles Date object', () => {
    const result = formatDate(new Date('2026-06-20'))
    expect(result).toContain('20')
    expect(result).toContain('2026')
  })
})

describe('truncate', () => {
  it('returns original string if shorter than limit', () => {
    const result = truncate('hello', 10)
    expect(result).toBe('hello')
  })

  it('truncates long strings with ellipsis', () => {
    const result = truncate('hello world', 5)
    expect(result).toBe('hello...')
  })

  it('handles exact length', () => {
    const result = truncate('hello', 5)
    expect(result).toBe('hello')
  })
})
