import { describe, it, expect } from 'vitest'
import api from '../api'

describe('API client', () => {
  it('exports an axios instance', () => {
    expect(api).toBeDefined()
    expect(typeof api.get).toBe('function')
    expect(typeof api.post).toBe('function')
    expect(typeof api.put).toBe('function')
    expect(typeof api.delete).toBe('function')
  })

  it('has correct base URL', () => {
    expect(api.defaults.baseURL).toContain('/api/v1')
  })

  it('has withCredentials enabled', () => {
    expect(api.defaults.withCredentials).toBe(true)
  })
})
