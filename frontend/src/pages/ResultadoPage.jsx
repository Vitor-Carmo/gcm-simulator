import { motion } from 'framer-motion'
import { CheckCircle, XCircle, BarChart2, RotateCcw, Home } from 'lucide-react'

export function ResultadoPage({ resultado, onNovoSimulado }) {
  const { questoes, respostas, acertos, provasMap } = resultado

  // % baseada em questões RESPONDIDAS, não total do simulado
  const totalRespondidas = respostas.filter(r => r.resposta != null).length
  const pct = totalRespondidas > 0 ? Math.round((acertos / totalRespondidas) * 100) : 0

  // agrupa erros por matéria (apenas respondidas)
  const errosPorMateria = {}
  respostas.forEach((r, i) => {
    if (r.resposta == null) return // não conta não respondidas
    const cat = questoes[i]?.cat || 'Geral'
    if (!errosPorMateria[cat]) errosPorMateria[cat] = { acertos: 0, total: 0 }
    errosPorMateria[cat].total++
    if (r.correta) errosPorMateria[cat].acertos++
  })

  const materias = Object.entries(errosPorMateria).sort((a, b) => {
    const pctA = a[1].acertos / a[1].total
    const pctB = b[1].acertos / b[1].total
    return pctA - pctB // piores primeiro
  })

  const emoji = pct >= 70 ? '🎉' : pct >= 50 ? '💪' : '📚'
  const msg = pct >= 70 ? 'Aprovado!' : pct >= 50 ? 'Bom desempenho!' : 'Continue estudando!'

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#0f172a] flex flex-col">
      <div className="flex-1 px-5 pt-10 pb-8 overflow-y-auto">
        {/* Score principal */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-3">{emoji}</div>
          <h1 className="text-3xl font-bold text-slate-100 mb-1">{pct}%</h1>
          <p className="text-slate-400">{msg}</p>
          <p className="text-[13px] text-slate-500 mt-1">{acertos} de {totalRespondidas} questões respondidas corretas</p>
        </motion.div>

        {/* Barra de progresso geral */}
        <div className="bg-[#1e293b] rounded-2xl p-5 mb-4">
          <div className="flex justify-between text-[12px] text-slate-400 mb-2">
            <span>Aproveitamento geral</span>
            <span className={pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}>{pct}%</span>
          </div>
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${pct >= 70 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Desempenho por matéria */}
        <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Desempenho por matéria</p>
        <div className="flex flex-col gap-2 mb-6">
          {materias.map(([cat, stats]) => {
            const p = Math.round((stats.acertos / stats.total) * 100)
            return (
              <div key={cat} className="bg-[#1e293b] border border-slate-700/30 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] text-slate-300 font-medium truncate flex-1 mr-3">{cat}</span>
                  <span className="text-[12px] text-slate-400">{stats.acertos}/{stats.total}</span>
                  <span className={`text-[13px] font-semibold ml-2 ${p >= 70 ? 'text-green-400' : p >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {p}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700/40 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${p >= 70 ? 'bg-green-500' : p >= 50 ? 'bg-amber-400' : 'bg-red-500'}`}
                    style={{ width: `${p}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Gabarito detalhado */}
        <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Gabarito</p>
        <div className="flex flex-col gap-2 mb-8">
          {respostas.map((r, i) => {
            const q = questoes[i]
            if (!q) return null
            return (
              <div key={i} className={`flex items-start gap-3 rounded-xl px-4 py-3 border
                ${r.correta ? 'bg-green-950/20 border-green-800/30' : r.resposta ? 'bg-red-950/15 border-red-800/25' : 'bg-slate-800/30 border-slate-700/30'}`}
              >
                {r.correta
                  ? <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  : <XCircle size={16} className={`flex-shrink-0 mt-0.5 ${r.resposta ? 'text-red-400' : 'text-slate-600'}`} />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-slate-300 leading-relaxed line-clamp-2">{q.txt}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[11px] text-slate-500">
                      Sua resp: <span className={r.correta ? 'text-green-400' : 'text-red-400'}>{r.resposta || '—'}</span>
                    </span>
                    {!r.correta && (
                      <span className="text-[11px] text-slate-500">
                        Correta: <span className="text-green-400">{q.res}</span>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-600">{q.cat}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Botão */}
      <div className="px-5 pb-8 pt-2">
        <button
          onClick={onNovoSimulado}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 text-[15px] font-semibold flex items-center justify-center gap-2 transition-all"
        >
          <Home size={16} />
          Novo Simulado
        </button>
      </div>
    </div>
  )
}
