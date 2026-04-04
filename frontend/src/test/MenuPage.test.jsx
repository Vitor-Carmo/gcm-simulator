/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import React from 'react'
import { MenuPage } from '../pages/MenuPage'

const mockFiltros = {
  bancas: ['FGV', 'VUNESP', 'IBFC'],
  anos: ['2024', '2023', '2022'],
  materias: ['Direito Penal', 'Legislação', 'Português'],
  provas: [
    { id: 'prova1', orgao: 'Prefeitura de São Paulo', ano: '2024', banca: 'FGV' },
    { id: 'prova2', orgao: 'Prefeitura de Campinas', ano: '2023', banca: 'VUNESP' },
  ],
}

const mockHistorico = [
  {
    id: 1,
    sessao_id: 's_1',
    prova_id: 'prova1',
    config: { tipo: 'prova', prova_id: 'prova1' },
    respostas: [],
    total: 10,
    acertos: 7,
    createdAt: Date.now() - 86400000,
  },
]

describe('MenuPage - Renderização inicial', () => {
  afterEach(cleanup)

  it('mostra título do app', () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    // Título completo está em um h1 com <br> separando as linhas
    const h1 = document.querySelector('h1')
    expect(h1).toBeTruthy()
    expect(h1.textContent).toContain('Simulador')
    expect(h1.textContent).toContain('Questões GCM')
  })

  it('mostra contagem de provas e matérias', () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    expect(screen.getByText('2 provas · 3 matérias')).toBeTruthy()
  })

  it('mostra os 4 modos de simulado', () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    expect(screen.getByText('Por Prova')).toBeTruthy()
    expect(screen.getByText('Por Matéria')).toBeTruthy()
    expect(screen.getByText('Por Banca')).toBeTruthy()
    expect(screen.getByText('Aleatório')).toBeTruthy()
  })

  it('não mostra seção de histórico quando vazio', () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    expect(screen.queryByText('Histórico recente')).toBeNull()
  })

  it('mostra seção de histórico quando há registros', () => {
    render(<MenuPage filtros={mockFiltros} historico={mockHistorico} onIniciar={() => {}} />)
    expect(screen.getByText('Histórico recente')).toBeTruthy()
  })
})

describe('MenuPage - Seleção de modos', () => {
  afterEach(cleanup)

  it('selecionar modo prova mostra configuração', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)

    fireEvent.click(screen.getByText('Por Prova'))

    await waitFor(() => {
      expect(screen.getByText('Selecione a prova...')).toBeTruthy()
    })
  })

  it('selecionar modo matéria mostra configuração', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)

    fireEvent.click(screen.getByText('Por Matéria'))

    await waitFor(() => {
      expect(screen.getByText('Selecione a matéria...')).toBeTruthy()
    })
  })

  it('selecionar modo banca mostra configuração', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)

    fireEvent.click(screen.getByText('Por Banca'))

    await waitFor(() => {
      expect(screen.getByText('Selecione a banca...')).toBeTruthy()
    })
  })

  it('selecionar modo aleatório mostra quantidade de questões', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)

    fireEvent.click(screen.getByText('Aleatório'))

    await waitFor(() => {
      expect(screen.getByText('Nº de questões')).toBeTruthy()
    })
  })
})

describe('MenuPage - Iniciar simulado', () => {
  afterEach(cleanup)

  it('não chama onIniciar quando modo prova sem selecionar', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)

    fireEvent.click(screen.getByText('Por Prova'))

    await waitFor(() => screen.getByText('Selecione a prova...'))

    fireEvent.click(screen.getByText('Iniciar Simulado'))

    expect(onIniciar).not.toHaveBeenCalled()
  })

  it('inicia modo prova com prova selecionada', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)

    fireEvent.click(screen.getByText('Por Prova'))

    await waitFor(() => screen.getByText('Selecione a prova...'))

    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'prova1' } })

    fireEvent.click(screen.getByText('Iniciar Simulado'))

    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'prova', prova_id: 'prova1' })
    )
  })

  it('inicia modo aleatório', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)

    fireEvent.click(screen.getByText('Aleatório'))

    await waitFor(() => screen.getByText('Nº de questões'))

    fireEvent.click(screen.getByText('Iniciar Simulado'))

    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'misto', qtd: 30 })
    )
  })
})
