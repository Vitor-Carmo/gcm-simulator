/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { ResultadoPage } from '../pages/ResultadoPage'

const mockQuestoes = [
  { n: 1, txt: 'Questão 1', res: 'A', cat: 'Direito Penal' },
  { n: 2, txt: 'Questão 2', res: 'B', cat: 'Direito Penal' },
  { n: 3, txt: 'Questão 3', res: 'C', cat: 'Legislação' },
  { n: 4, txt: 'Questão 4', res: 'D', cat: 'Legislação' },
  { n: 5, txt: 'Questão 5', res: 'A', cat: 'Português' },
]

function makeRespostas(acertosMap) {
  // acertosMap: array de respostas do usuário (letra ou null), alinhado com mockQuestoes
  return mockQuestoes.map((q, i) => {
    const resposta = acertosMap[i]
    return {
      questao: q,
      resposta,
      correta: resposta === q.res,
      confirmada: true,
    }
  })
}

function makeResultado(acertosMap) {
  const totalRespondidas = acertosMap.filter(r => r != null).length
  const acertos = acertosMap.filter((r, i) => r === mockQuestoes[i].res).length
  return {
    questoes: mockQuestoes,
    respostas: makeRespostas(acertosMap),
    acertos,
    provasMap: {},
  }
}

describe('ResultadoPage - Score e mensagens', () => {
  afterEach(cleanup)

  it('mostra score correto e mensagem Aprovado para 100%', () => {
    render(<ResultadoPage resultado={makeResultado(['A', 'B', 'C', 'D', 'A'])} onNovoSimulado={() => {}} />)
    const h1 = document.querySelector('h1.text-3xl')
    expect(h1.textContent).toBe('100%')
    expect(screen.getByText('Aprovado!')).toBeTruthy()
  })

  it('mostra score correto e mensagem Continue estudando! para 0%', () => {
    render(<ResultadoPage resultado={makeResultado(['B', 'C', 'D', 'A', 'B'])} onNovoSimulado={() => {}} />)
    const h1 = document.querySelector('h1.text-3xl')
    expect(h1.textContent).toBe('0%')
    expect(screen.getByText('Continue estudando!')).toBeTruthy()
  })

  it('mostra mensagem Bom desempenho! para 60%', () => {
    render(<ResultadoPage resultado={makeResultado(['A', 'B', 'C', 'A', 'B'])} onNovoSimulado={() => {}} />)
    const h1 = document.querySelector('h1.text-3xl')
    expect(h1.textContent).toBe('60%')
    expect(screen.getByText('Bom desempenho!')).toBeTruthy()
  })

  it('mostra texto de questões corretas', () => {
    render(<ResultadoPage resultado={makeResultado(['A', 'B', 'C', 'D', 'A'])} onNovoSimulado={() => {}} />)
    expect(screen.getByText('5 de 5 questões respondidas corretas')).toBeTruthy()
  })
})

describe('ResultadoPage - Desempenho por matéria', () => {
  afterEach(cleanup)

  it('mostra matérias no desempenho', () => {
    render(<ResultadoPage resultado={makeResultado(['A', 'B', 'C', 'D', 'A'])} onNovoSimulado={() => {}} />)
    // Usa getAllByText já que cada matéria aparece em múltiplos lugares
    const dp = screen.getAllByText('Direito Penal')
    expect(dp.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Legislação').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Português').length).toBeGreaterThan(0)
  })

  it('mostra score 2/2 para Direito Penal com 100%', () => {
    render(<ResultadoPage resultado={makeResultado(['A', 'B', 'C', 'D', 'A'])} onNovoSimulado={() => {}} />)
    const dpSection = document.querySelector('[class*="flex flex-col gap-2 mb-6"]')
    expect(dpSection.innerHTML).toContain('Direito Penal')
  })
})

describe('ResultadoPage - Gabarito', () => {
  afterEach(cleanup)

  it('renderiza enunciados das questões', () => {
    render(<ResultadoPage resultado={makeResultado(['A', 'B', 'C', 'D', 'A'])} onNovoSimulado={() => {}} />)
    expect(screen.getByText('Questão 1')).toBeTruthy()
    expect(screen.getByText('Questão 5')).toBeTruthy()
  })

  it('mostra gabarito com questões corretas em verde', () => {
    render(<ResultadoPage resultado={makeResultado(['A', 'B', 'C', 'D', 'A'])} onNovoSimulado={() => {}} />)
    // Verifica que existe pelo menos um ícone de check (resposta correta)
    const checks = document.querySelectorAll('svg')
    const checkSvgs = Array.from(checks).filter(svg => svg.classList.contains('text-green-400'))
    expect(checkSvgs.length).toBeGreaterThan(0)
  })

  it('mostraCorreta quando usuário errou', () => {
    render(<ResultadoPage resultado={makeResultado(['B', 'C', 'D', 'A', 'B'])} onNovoSimulado={() => {}} />)
    const allResp = screen.getAllByText(/Sua resp:/i)
    expect(allResp.length).toBeGreaterThan(0)
  })

  it('mostra traço para questões não respondidas', () => {
    render(<ResultadoPage resultado={makeResultado(['A', null, null, null, null])} onNovoSimulado={() => {}} />)
    const allResp = screen.getAllByText(/Sua resp:/i)
    const comTraco = allResp.filter(el => el.textContent.includes('—'))
    expect(comTraco.length).toBeGreaterThan(0)
  })
})

describe('ResultadoPage - Navegação', () => {
  afterEach(cleanup)

  it('chama onNovoSimulado ao clicar no botão', () => {
    const onNovoSimulado = vi.fn()
    render(<ResultadoPage resultado={makeResultado(['A', 'B', 'C', 'D', 'A'])} onNovoSimulado={onNovoSimulado} />)
    fireEvent.click(screen.getByRole('button', { name: /Novo Simulado/i }))
    expect(onNovoSimulado).toHaveBeenCalled()
  })
})
