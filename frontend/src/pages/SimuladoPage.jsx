import { useState, useCallback, useEffect } from 'react'
import { Header } from '../components/Header'
import { QuestionCard } from '../components/QuestionCard'
import { BottomNav } from '../components/BottomNav'
import { ContextDrawer } from '../components/ContextDrawer'
import { PdfModal } from '../components/PdfModal'

export function SimuladoPage({ prova, onFinalizar, onVoltar }) {
  const { questoes, provasMap, ctxMap, config } = prova

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [confirmed, setConfirmed] = useState({})
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)

  const questaoAtual = questoes[currentIndex]
  const metadados = provasMap[questaoAtual?.prova_id] || {}
  const contextoAtual = questaoAtual?.ctx_id ? ctxMap[questaoAtual.ctx_id] : null
  const selectedAnswer = answers[currentIndex] ?? null
  const isConfirmed = !!confirmed[currentIndex]
  const total = questoes.length

  const selectAnswer = useCallback((letra) => {
    if (confirmed[currentIndex]) return
    setAnswers(prev => ({ ...prev, [currentIndex]: letra }))
  }, [currentIndex, confirmed])

  const confirmAnswer = useCallback(() => {
    if (!answers[currentIndex] || confirmed[currentIndex]) return
    setConfirmed(prev => ({ ...prev, [currentIndex]: true }))
  }, [currentIndex, answers, confirmed])

  const navigate = useCallback((dir) => {
    setCurrentIndex(prev => Math.max(0, Math.min(total - 1, prev + dir)))
  }, [total])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') navigate(1)
      if (e.key === 'ArrowLeft') navigate(-1)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  function handleFinalizar() {
    const respostas = questoes.map((q, i) => ({
      questao: q,
      resposta: answers[i] ?? null,
      correta: answers[i] === q.res,
      confirmada: !!confirmed[i],
    }))
    onFinalizar(respostas)
  }

  const respondidas = Object.keys(confirmed).length
  const podeFinalizarCedo = respondidas >= Math.floor(total * 0.5) || currentIndex === total - 1
  
  if (!questaoAtual) return null

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#0f172a] flex flex-col relative">
      <Header
        metadados={metadados}
        onOpenPdf={() => setPdfOpen(true)}
        onVoltar={onVoltar}
        respondidas={respondidas}
        total={total}
      />

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-36 scrollbar-hide">
        <QuestionCard
          questao={questaoAtual}
          contexto={contextoAtual}
          selectedAnswer={selectedAnswer}
          isConfirmed={isConfirmed}
          onSelect={selectAnswer}
          onConfirm={confirmAnswer}
          onOpenContext={() => setDrawerOpen(true)}
          questionIndex={currentIndex}
          total={total}
        />

        {/* Botão finalizar */}
        {podeFinalizarCedo && (
          <button
            onClick={handleFinalizar}
            className="w-full mt-4 py-3.5 rounded-xl border border-amber-700/40 bg-amber-950/20 text-amber-300 text-[14px] font-medium transition-all hover:bg-amber-950/40"
          >
            Encerrar e Ver Resultado ({respondidas}/{total} respondidas)
          </button>
        )}
      </main>

      <BottomNav currentIndex={currentIndex} total={total} onNavigate={navigate} />

      <ContextDrawer contexto={contextoAtual} isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <PdfModal metadados={metadados} isOpen={pdfOpen} onClose={() => setPdfOpen(false)} pagina={questaoAtual?.pagina} />
    </div>
  )
}
