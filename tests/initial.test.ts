import { describe, it, expect } from 'vitest'
import { initialState } from '../src/state'

describe('Initial State', () => {
  it('should have 0 balance', () => {
    expect(initialState.usdcBalance).toBe(0)
  })
})
