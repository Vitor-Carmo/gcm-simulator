/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import React from 'react'
import { SimuladoPage } from '../pages/SimuladoPage'

const mockProva = {
  questoes: [
    { prova_id: 'prova1', n: 1, txt: 'Questão 1', opts: { A: 'Alt A', B: 'Alt B', C: 'Alt C', D: 'Alt D' }, res: 'A', cat: 'Cat1' },
    { prova_id: 'prova1', n: 2, txt: 'Questão 2', opts: { A: 'Alt A', B: 'Alt B', C: 'Alt C', D: 'Alt D' }, res: 'B', cat: 'Cat1' },
    { prova_id: 'prova1', n: 3, txt: 'Questão 3', opts: { A: 'Alt A', B: 'Alt B', C: 'Alt C', D: 'Alt D' }, res: 'C', cat: 'Cat1' },
  ],
  provasMap: {
    prova1: { id: 'prova1', orgao: 'Pref', ano: '2024', banca: 'FGV' }
  },
  ctxMap: {},
  config: { tipo: 'prova', prova_id: 'prova1' }
}

// Helper: pega o contador do BottomNav (formato "X/Y")
function getCounter() {
  const spans = screen.getAllByText(/\d+\/\d+/)
  return spans.find(s => s.className.includes('tabular-nums'))
}

describe('SimuladoPage - Navegação por setas', () => {
  afterEach(cleanup)

  it('seta direita avança para próxima questão', () => {
    render(<SimuladoPage prova={mockProva} onFinalizar={() => {}} onVoltar={() => {}} />)

    expect(getCounter().textContent).toBe('1/3')

    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(getCounter().textContent).toBe('2/3')
  })

  it('seta esquerda volta para questão anterior', () => {
    render(<SimuladoPage prova={mockProva} onFinalizar={() => {}} onVoltar={() => {}} />)

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(getCounter().textContent).toBe('3/3')

    fireEvent.keyDown(window, { key: 'ArrowLeft' })

    expect(getCounter().textContent).toBe('2/3')
  })

  it('seta direita não avança além da última questão', () => {
    render(<SimuladoPage prova={mockProva} onFinalizar={() => {}} onVoltar={() => {}} />)

    for (let i = 0; i < 5; i++) {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    }

    expect(getCounter().textContent).toBe('3/3')
  })

  it('seta esquerda não volta além da primeira questão', () => {
    render(<SimuladoPage prova={mockProva} onFinalizar={() => {}} onVoltar={() => {}} />)

    fireEvent.keyDown(window, { key: 'ArrowLeft' })

    expect(getCounter().textContent).toBe('1/3')
  })
})

describe('SimuladoPage - Botões de navegação', () => {
  afterEach(cleanup)

  it('botão Anterior começa desabilitado na primeira questão', () => {
    render(<SimuladoPage prova={mockProva} onFinalizar={() => {}} onVoltar={() => {}} />)

    const anteriorBtn = screen.getByRole('button', { name: /Anterior/i })
    expect(anteriorBtn).toBeDisabled()
  })

  it('botão Próxima funciona corretamente', () => {
    render(<SimuladoPage prova={mockProva} onFinalizar={() => {}} onVoltar={() => {}} />)

    const proximoBtn = screen.getByRole('button', { name: /Próxima/i })

    fireEvent.click(proximoBtn)
    expect(getCounter().textContent).toBe('2/3')
  })

  it('botão Anterior fica habilitado após avançar', () => {
    render(<SimuladoPage prova={mockProva} onFinalizar={() => {}} onVoltar={() => {}} />)

    const anteriorBtn = screen.getByRole('button', { name: /Anterior/i })
    expect(anteriorBtn).toBeDisabled()

    fireEvent.keyDown(window, { key: 'ArrowRight' })

    expect(screen.getByRole('button', { name: /Anterior/i })).not.toBeDisabled()
  })

  it('botão Próxima fica desabilitado na última questão', () => {
    render(<SimuladoPage prova={mockProva} onFinalizar={() => {}} onVoltar={() => {}} />)

    // Navega até o final
    for (let i = 0; i < 3; i++) {
      fireEvent.keyDown(window, { key: 'ArrowRight' })
    }

    expect(screen.getByRole('button', { name: /Próxima/i })).toBeDisabled()
  })
})
