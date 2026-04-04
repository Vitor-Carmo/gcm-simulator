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

  // BUG: histórico não exibia o ano quando filtrado por ano
  it('mostra ano no label do histórico quando filtrado', () => {
    const historicoComAno = [
      {
        id: 1,
        sessao_id: 's_1',
        prova_id: 'misto',
        config: { tipo: 'misto', cat: 'Português', ano: '2024' },
        respostas: [],
        total: 10,
        acertos: 7,
        createdAt: Date.now() - 86400000,
      },
    ]
    render(<MenuPage filtros={mockFiltros} historico={historicoComAno} onIniciar={() => {}} />)
    // Deve exibir "Português · 2024" ao invés de só "Português"
    expect(screen.getByText('Português · 2024')).toBeTruthy()
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

describe('MenuPage - Modo treino/simulado', () => {
  afterEach(cleanup)

  it('mostra toggle treino/simulado quando modo está selecionado', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    fireEvent.click(screen.getByText('Aleatório'))
    await waitFor(() => {
      expect(screen.getByText('Simulado')).toBeTruthy()
      expect(screen.getByText('Treino')).toBeTruthy()
    })
  })

  it('muda para modo treino ao clicar', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)
    fireEvent.click(screen.getByText('Aleatório'))
    await waitFor(() => screen.getByText('Nº de questões'))
    fireEvent.click(screen.getByText('Treino'))
    fireEvent.click(screen.getByText('Iniciar Treino'))
    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ modo: 'treino' })
    )
  })
})

describe('MenuPage - Filtros por ano e matéria', () => {
  afterEach(cleanup)

  it('mostra filtros de ano e matéria no modo aleatório', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    fireEvent.click(screen.getByText('Aleatório'))
    await waitFor(() => {
      expect(screen.getByText('Todos os anos')).toBeTruthy()
      expect(screen.getByText('Todas matérias')).toBeTruthy()
    })
  })

  it('mostra filtros de ano e matéria no modo matéria', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    fireEvent.click(screen.getByText('Por Matéria'))
    await waitFor(() => {
      expect(screen.getByText('Todos os anos')).toBeTruthy()
      expect(screen.getByText('Todas matérias')).toBeTruthy()
    })
  })

  it('mostra filtros de ano e matéria no modo banca', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    fireEvent.click(screen.getByText('Por Banca'))
    await waitFor(() => {
      expect(screen.getByText('Todos os anos')).toBeTruthy()
      expect(screen.getByText('Todas matérias')).toBeTruthy()
    })
  })

  it('não mostra filtros de ano/matéria no modo prova', async () => {
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={() => {}} />)
    fireEvent.click(screen.getByText('Por Prova'))
    await waitFor(() => {
      expect(screen.queryByText('Todos os anos')).toBeNull()
      expect(screen.queryByText('Todas matérias')).toBeNull()
    })
  })

  it('passa filtro de ano ao iniciar modo aleatório', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)
    fireEvent.click(screen.getByText('Aleatório'))
    await waitFor(() => screen.getByText('Nº de questões'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: '2024' } })

    fireEvent.click(screen.getByText('Iniciar Simulado'))
    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'misto', ano: '2024' })
    )
  })

  it('passa filtro de matéria ao iniciar modo aleatório', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)
    fireEvent.click(screen.getByText('Aleatório'))
    await waitFor(() => screen.getByText('Nº de questões'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[1], { target: { value: 'Português' } })

    fireEvent.click(screen.getByText('Iniciar Simulado'))
    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'misto', cat: 'Português' })
    )
  })

  it('passa ambos filtros ano e matéria ao iniciar modo aleatório', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)
    fireEvent.click(screen.getByText('Aleatório'))
    await waitFor(() => screen.getByText('Nº de questões'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: '2024' } })
    fireEvent.change(selects[1], { target: { value: 'Direito Penal' } })

    fireEvent.click(screen.getByText('Iniciar Simulado'))
    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'misto', ano: '2024', cat: 'Direito Penal' })
    )
  })

  it('passa matéria selecionada no modo Por Matéria', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)
    fireEvent.click(screen.getByText('Por Matéria'))
    await waitFor(() => screen.getByText('Selecione a matéria...'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'Direito Penal' } })

    fireEvent.click(screen.getByText('Iniciar Simulado'))
    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'materia', cat: 'Direito Penal' })
    )
  })

  // BUG: o filtro secundario de matéria não pode sobrescrever a matéria principal no modo "Por Matéria"
  it('filtro secundario de matéria não sobrescreve matéria principal no modo Por Matéria', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)
    fireEvent.click(screen.getByText('Por Matéria'))
    await waitFor(() => screen.getByText('Selecione a matéria...'))

    // Seleciona "Direito Penal" no select principal de matéria
    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'Direito Penal' } })
    // Não mexe no filtro "Todas matérias" (fica como vazio "")
    // Este teste falha sem a correção porque filtroCat sobrescrevia config.cat

    fireEvent.click(screen.getByText('Iniciar Simulado'))
    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'materia', cat: 'Direito Penal' })
    )
  })

  it('passa matéria e ano no modo Por Matéria', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)
    fireEvent.click(screen.getByText('Por Matéria'))
    await waitFor(() => screen.getByText('Selecione a matéria...'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'Direito Penal' } })
    fireEvent.change(selects[1], { target: { value: '2024' } })

    fireEvent.click(screen.getByText('Iniciar Simulado'))
    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'materia', cat: 'Direito Penal', ano: '2024' })
    )
  })

  it('passa banca e ano no modo Por Banca', async () => {
    const onIniciar = vi.fn()
    render(<MenuPage filtros={mockFiltros} historico={[]} onIniciar={onIniciar} />)
    fireEvent.click(screen.getByText('Por Banca'))
    await waitFor(() => screen.getByText('Selecione a banca...'))

    const selects = screen.getAllByRole('combobox')
    fireEvent.change(selects[0], { target: { value: 'FGV' } })
    fireEvent.change(selects[1], { target: { value: '2023' } })

    fireEvent.click(screen.getByText('Iniciar Simulado'))
    expect(onIniciar).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'banca', banca: 'FGV', ano: '2023' })
    )
  })
})
