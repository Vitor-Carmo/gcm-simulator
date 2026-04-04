import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

globalThis.expect = expect

afterEach(() => {
  cleanup()
})
