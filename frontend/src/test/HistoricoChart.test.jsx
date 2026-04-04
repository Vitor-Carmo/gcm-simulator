/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { HistoricoChart } from '../components/HistoricoChart'

const mockHistorico = (pcts) =>
  pcts.map((pct, i) => ({
    id: i + 1,
    acertos: pct,
    total: 100,
    createdAt: Date.now() - i * 86400000,
  }))

describe('HistoricoChart - Renderização', () => {
  afterEach(cleanup)

  it('não renderiza quando histórico tem menos de 2 itens', () => {
    const { container } = render(<HistoricoChart historico={[{ id: 1, acertos: 50, total: 100 }]} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('não renderiza quando histórico está vazio', () => {
    const { container } = render(<HistoricoChart historico={[]} />)
    expect(container.querySelector('svg')).toBeNull()
  })

  it('renderiza quando histórico tem 2 ou mais itens', () => {
    const { container } = render(<HistoricoChart historico={mockHistorico([50, 70])} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })

  it('renderiza com 10 pontos (limite)', () => {
    const { container } = render(<HistoricoChart historico={mockHistorico([10, 20, 30, 40, 50, 60, 70, 80, 90, 100])} />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
