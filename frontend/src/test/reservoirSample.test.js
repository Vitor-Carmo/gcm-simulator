/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Test the reservoir sample algorithm directly
function reservoirSample(arr, k) {
  if (arr.length <= k) return arr
  const reservoir = arr.slice(0, k)
  for (let i = k; i < arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1))
    if (j < k) {
      reservoir[j] = arr[i]
    }
  }
  return reservoir
}

describe('reservoirSample', () => {
  it('returns all items when array length <= k', () => {
    const arr = [1, 2, 3]
    expect(reservoirSample(arr, 5)).toEqual([1, 2, 3])
    expect(reservoirSample(arr, 3)).toEqual([1, 2, 3])
  })

  it('returns exactly k items when array length > k', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i)
    const result = reservoirSample(arr, 10)
    expect(result).toHaveLength(10)
  })

  it('all returned items are from the original array', () => {
    const arr = Array.from({ length: 50 }, (_, i) => ({ id: i }))
    const result = reservoirSample(arr, 10)
    result.forEach(item => {
      expect(arr).toContainEqual(item)
    })
  })

  it('no duplicates in result', () => {
    const arr = Array.from({ length: 100 }, (_, i) => i)
    const result = reservoirSample(arr, 30)
    const unique = new Set(result)
    expect(unique.size).toBe(result.length)
  })

  it('handles k = 1', () => {
    const arr = [1, 2, 3, 4, 5]
    const result = reservoirSample(arr, 1)
    expect(result).toHaveLength(1)
    expect(arr).toContain(result[0])
  })

  it('handles k = 0', () => {
    const arr = [1, 2, 3]
    const result = reservoirSample(arr, 0)
    expect(result).toHaveLength(0)
  })

  it('does not modify original array', () => {
    const arr = [1, 2, 3, 4, 5]
    const copy = [...arr]
    reservoirSample(arr, 3)
    expect(arr).toEqual(copy)
  })
})
