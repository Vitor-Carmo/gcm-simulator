import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen } from 'lucide-react'

const LETTERS = ['A', 'B', 'C', 'D', 'E']

function altClass(letra, selected, isConfirmed, correta) {
  if (!isConfirmed) {
    return letra === selected
      ? 'border-blue-500/80 bg-blue-950/30 text-slate-100'
      : 'border-slate-700/40 bg-[#1e293b] text-slate-300 hover:border-slate-600/60 hover:bg-slate-700/30'
  }
  if (letra === correta) return 'border-green-500/70 bg-green-950/30 text-slate-100'
  if (letra === selected) return 'border-red-500/60 bg-red-950/20 text-slate-300'
  return 'border-slate-700/20 bg-[#1e293b]/60 text-slate-500 opacity-60'
}

function letterClass(letra, selected, isConfirmed, correta) {
  if (!isConfirmed) {
    return letra === selected
      ? 'bg-blue-900/50 border-blue-500/60 text-blue-300'
      : 'bg-slate-700/30 border-slate-600/30 text-slate-500'
  }
  if (letra === correta) return 'bg-green-900/40 border-green-500/50 text-green-300'
  if (letra === selected) return 'bg-red-900/30 border-red-500/40 text-red-300'
  return 'bg-slate-700/20 border-slate-600/20 text-slate-600'
}

export function QuestionCard({ questao, contexto, selectedAnswer, isConfirmed, onSelect, onConfirm, onOpenContext, questionIndex, total }) {
  // adapta novo formato: txt, opts, res, cat
  const enunciado = questao.txt || questao.enunciado || ''
  const alternativas = questao.opts || questao.alternativas || {}
  const correta = questao.res || questao.correta || ''
  const categoria = questao.cat || questao.categoria || ''
  const numero = questao.n || questao.numero || questionIndex + 1

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${questao.prova_id || ''}-${numero}`}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.2 }}
      >
        {/* Meta */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-slate-500 uppercase tracking-widest">
            Q.<span className="text-blue-400 font-semibold">{numero}</span> de {total}
          </span>
          {categoria && (
            <>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span className="text-[11px] text-slate-600 uppercase tracking-wide truncate">{categoria}</span>
            </>
          )}
        </div>

        {/* Botão contexto */}
        {contexto && (
          <button
            onClick={onOpenContext}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl mb-4 bg-blue-950/20 border border-blue-800/30 hover:bg-blue-950/40 hover:border-blue-700/50 transition-all"
          >
            <BookOpen size={15} className="text-blue-400 flex-shrink-0" />
            <span className="text-[13px] text-blue-300 font-medium flex-1 text-left">Ler Texto de Apoio</span>
            <span className="text-[10px] text-slate-600 uppercase tracking-wider">
              Q.{contexto.range_questoes?.[0]}–{contexto.range_questoes?.[1]}
            </span>
          </button>
        )}

        {/* Enunciado */}
        <div className="bg-[#1e293b] border border-slate-700/30 rounded-2xl p-5 mb-4">
          <p className="text-[15px] text-slate-100 leading-relaxed">{enunciado}</p>
        </div>

        {/* Alternativas */}
        <div className="flex flex-col gap-2.5 mb-4">
          {LETTERS.map(letra => {
            const texto = alternativas[letra]
            if (!texto) return null
            return (
              <motion.button
                key={letra}
                onClick={() => onSelect(letra)}
                disabled={isConfirmed}
                whileTap={!isConfirmed ? { scale: 0.98 } : {}}
                className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-150 ${altClass(letra, selectedAnswer, isConfirmed, correta)}`}
              >
                <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[11px] font-semibold flex-shrink-0 mt-0.5 transition-all ${letterClass(letra, selectedAnswer, isConfirmed, correta)}`}>
                  {letra}
                </span>
                <span className="text-[14px] leading-relaxed flex-1">{texto}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Confirmar */}
        {!isConfirmed && (
          <motion.button
            onClick={onConfirm}
            disabled={!selectedAnswer}
            whileTap={selectedAnswer ? { scale: 0.97 } : {}}
            className={`w-full py-4 rounded-xl text-[15px] font-semibold transition-all duration-150
              ${selectedAnswer ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-900/20 text-blue-900/40 border border-blue-800/20 cursor-not-allowed'}`}
          >
            Confirmar Resposta
          </motion.button>
        )}

        {/* Feedback */}
        <AnimatePresence>
          {isConfirmed && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl px-4 py-3.5 flex items-start gap-3 border
                ${selectedAnswer === correta ? 'bg-green-950/30 border-green-800/30' : 'bg-red-950/20 border-red-800/25'}`}
            >
              <span className="text-lg leading-none mt-0.5">{selectedAnswer === correta ? '✓' : '✗'}</span>
              <div>
                <p className={`text-[13px] font-semibold mb-0.5 ${selectedAnswer === correta ? 'text-green-300' : 'text-red-300'}`}>
                  {selectedAnswer === correta ? 'Resposta correta!' : 'Resposta incorreta.'}
                </p>
                {selectedAnswer !== correta && (
                  <p className="text-[12px] text-slate-400">
                    A alternativa correta é <span className="text-green-400 font-semibold">{correta}</span>.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
