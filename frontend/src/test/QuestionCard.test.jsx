/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { QuestionCard } from '../components/QuestionCard'

const mockQuestao = {
  prova_id: 'prova1',
  n: 1,
  txt: 'Qual é a capital do Brasil?',
  opts: {
    A: 'São Paulo',
    B: 'Rio de Janeiro',
    C: 'Brasília',
    D: 'Salvador',
  },
  res: 'C',
  cat: 'Geografia',
}

const mockQuestaoComContexto = {
  ...mockQuestao,
  ctx_id: 'ctx1',
}

const mockContexto = {
  id_contexto: 'ctx1',
  titulo: 'Geografia do Brasil',
  conteudo: 'O Brasil é um país localizado na América do Sul.\n\nSua capital é Brasília, которая foi construída especificamente para esse fim.',
  range_questoes: [1, 5],
}

describe('QuestionCard - Renderização básica', () => {
  afterEach(cleanup)

  it('renderiza enunciado da questão', () => {
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer={null}
        isConfirmed={false}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    expect(screen.getByText('Qual é a capital do Brasil?')).toBeTruthy()
  })

  it('renderiza todas as alternativas A, B, C, D', () => {
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer={null}
        isConfirmed={false}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    expect(screen.getByText('São Paulo')).toBeTruthy()
    expect(screen.getByText('Rio de Janeiro')).toBeTruthy()
    expect(screen.getByText('Brasília')).toBeTruthy()
    expect(screen.getByText('Salvador')).toBeTruthy()
  })

  it('renderiza categoria da questão', () => {
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer={null}
        isConfirmed={false}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    expect(screen.getByText('Geografia')).toBeTruthy()
  })

  it('mostra botão de confirmar desabilitado quando nenhuma resposta selecionada', () => {
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer={null}
        isConfirmed={false}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    const btn = screen.getByRole('button', { name: /Confirmar/i })
    expect(btn).toBeDisabled()
  })
})

describe('QuestionCard - Seleção de alternativas', () => {
  afterEach(cleanup)

  it('chama onSelect ao clicar em uma alternativa', () => {
    const onSelect = vi.fn()
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer={null}
        isConfirmed={false}
        onSelect={onSelect}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    fireEvent.click(screen.getByText('Brasília'))
    expect(onSelect).toHaveBeenCalledWith('C')
  })

  it('alternativa selecionada fica visível como selecionada', () => {
    const onSelect = vi.fn()
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer="B"
        isConfirmed={false}
        onSelect={onSelect}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    // O botão de confirmar deve estar habilitado agora
    const btn = screen.getByRole('button', { name: /Confirmar/i })
    expect(btn).not.toBeDisabled()
  })

  it('não permite selecionar após confirmação', () => {
    const onSelect = vi.fn()
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer="A"
        isConfirmed={true}
        onSelect={onSelect}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    fireEvent.click(screen.getByText('São Paulo'))
    expect(onSelect).not.toHaveBeenCalled()
  })
})

describe('QuestionCard - Confirmação', () => {
  afterEach(cleanup)

  it('chama onConfirm ao clicar em confirmar', () => {
    const onConfirm = vi.fn()
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer="C"
        isConfirmed={false}
        onSelect={() => {}}
        onConfirm={onConfirm}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Confirmar/i }))
    expect(onConfirm).toHaveBeenCalled()
  })

  it('após confirmar, mostra feedback de resposta correta', () => {
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer="C"
        isConfirmed={true}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    expect(screen.getByText('Resposta correta!')).toBeTruthy()
  })

  it('após confirmar com resposta errada, mostra resposta incorreta', () => {
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer="A"
        isConfirmed={true}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    expect(screen.getByText('Resposta incorreta.')).toBeTruthy()
    // Encontra o span verde dentro do parágrafo de feedback (não o botão da alternativa C)
    const feedbackP = Array.from(document.querySelectorAll('p.text-slate-400'))
      .find(p => p.textContent.includes('alternativa correta'))
    expect(feedbackP).toBeTruthy()
    expect(feedbackP.querySelector('span.text-green-400').textContent).toBe('C')
  })
})

describe('QuestionCard - Contexto', () => {
  afterEach(cleanup)

  it('mostra botão de contexto quando contexto existe', () => {
    render(
      <QuestionCard
        questao={mockQuestaoComContexto}
        contexto={mockContexto}
        selectedAnswer={null}
        isConfirmed={false}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    expect(screen.getByText('Ler Texto de Apoio')).toBeTruthy()
  })

  it('não mostra botão de contexto quando não existe', () => {
    render(
      <QuestionCard
        questao={mockQuestao}
        contexto={null}
        selectedAnswer={null}
        isConfirmed={false}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={() => {}}
        questionIndex={0}
        total={5}
      />
    )

    expect(screen.queryByText('Ler Texto de Apoio')).toBeNull()
  })

  it('chama onOpenContext ao clicar no botão de contexto', () => {
    const onOpenContext = vi.fn()
    render(
      <QuestionCard
        questao={mockQuestaoComContexto}
        contexto={mockContexto}
        selectedAnswer={null}
        isConfirmed={false}
        onSelect={() => {}}
        onConfirm={() => {}}
        onOpenContext={onOpenContext}
        questionIndex={0}
        total={5}
      />
    )

    fireEvent.click(screen.getByText('Ler Texto de Apoio'))
    expect(onOpenContext).toHaveBeenCalled()
  })
})
