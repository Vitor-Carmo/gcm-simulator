/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as dbModule from '../data/db'

describe('buscarContextosPorIds', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna objeto vazio quando ctxIds é vazio', async () => {
    const result = await dbModule.buscarContextosPorIds([])
    expect(result).toEqual({})
  })

  it('retorna objeto vazio quando ctxIds é null', async () => {
    const result = await dbModule.buscarContextosPorIds(null)
    expect(result).toEqual({})
  })

  it('retorna ctxMap vazio quando não encontra contextos', async () => {
    const mockToArray = vi.fn().mockResolvedValue([])
    const mockWhere = vi.fn().mockReturnValue({
      anyOf: vi.fn().mockReturnValue({ toArray: mockToArray }),
    })
    const originalWhere = dbModule.db.contextos.where
    dbModule.db.contextos.where = mockWhere

    const result = await dbModule.buscarContextosPorIds(['ctx_inexistente'])

    expect(result).toEqual({})
    expect(mockWhere).toHaveBeenCalledWith('id_contexto')
    expect(mockToArray).toHaveBeenCalled()

    dbModule.db.contextos.where = originalWhere
  })
})
