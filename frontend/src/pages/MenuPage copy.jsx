import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Filter, Clock, ChevronRight, Shield, Shuffle, BarChart2 } from 'lucide-react'

const MODOS = [
  { id: 'prova',   icon: BookOpen,  label: 'Por Prova',    desc: 'Simule uma prova completa' },
  { id: 'materia', icon: Filter,    label: 'Por Matéria',  desc: 'Foque em uma disciplina' },
  { id: 'banca',   icon: Shield,    label: 'Por Banca',    desc: 'Questões de uma banca específica' },
  { id: 'misto',   icon: Shuffle,   label: 'Aleatório',    desc: 'Mix de todas as provas' },
]

export function MenuPage({ filtros, historico, onIniciar }) {
  const [modo, setModo] = useState(null)
  const [config, setConfig] = useState({})
  const [qtd, setQtd] = useState(30)

  function handleIniciar() {
    if (modo === 'prova' && !config.prova_id) return
    if (modo === 'materia' && !config.cat) return
    if (modo === 'banca' && !config.banca) return

    onIniciar({ tipo: modo, ...config, qtd })
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-[#0f172a] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-blue-400" />
          <span className="text-[11px] text-blue-400 uppercase tracking-widest font-medium">GCM Simulador</span>
        </div>
        <h1 className="text-2xl font-semibold text-slate-100 leading-tight">
          Simulador de<br />Questões GCM
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">{filtros.provas.length} provas · {filtros.materias.length} matérias</p>
      </div>

      <div className="flex-1 px-5 pb-8 overflow-y-auto">
        {/* Modos */}
        <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Escolha o modo</p>
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {MODOS.map(m => {
            const Icon = m.icon
            const ativo = modo === m.id
            return (
              <button
                key={m.id}
                onClick={() => { setModo(m.id); setConfig({}) }}
                className={`flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all
                  ${ativo
                    ? 'border-blue-500/70 bg-blue-950/30'
                    : 'border-slate-700/40 bg-[#1e293b] hover:border-slate-600/60'
                  }`}
              >
                <Icon size={18} className={ativo ? 'text-blue-400' : 'text-slate-500'} />
                <div>
                  <p className={`text-[13px] font-semibold ${ativo ? 'text-blue-300' : 'text-slate-200'}`}>{m.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{m.desc}</p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Configuração dinâmica */}
        <AnimatePresence mode="wait">
          {modo && (
            <motion.div
              key={modo}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mb-6"
            >
              <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Configurar</p>
              <div className="flex flex-col gap-3">

                {modo === 'prova' && (
                  <select
                    value={config.prova_id || ''}
                    onChange={e => setConfig({ prova_id: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-700/40 rounded-xl px-4 py-3.5 text-[14px] text-slate-200 focus:outline-none focus:border-blue-500/60"
                  >
                    <option value="">Selecione a prova...</option>
                    {filtros.provas.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.orgao} · {p.ano} · {p.banca}
                      </option>
                    ))}
                  </select>
                )}

                {modo === 'materia' && (
                  <select
                    value={config.cat || ''}
                    onChange={e => setConfig({ cat: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-700/40 rounded-xl px-4 py-3.5 text-[14px] text-slate-200 focus:outline-none focus:border-blue-500/60"
                  >
                    <option value="">Selecione a matéria...</option>
                    {filtros.materias.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}

                {modo === 'banca' && (
                  <select
                    value={config.banca || ''}
                    onChange={e => setConfig({ banca: e.target.value })}
                    className="w-full bg-[#1e293b] border border-slate-700/40 rounded-xl px-4 py-3.5 text-[14px] text-slate-200 focus:outline-none focus:border-blue-500/60"
                  >
                    <option value="">Selecione a banca...</option>
                    {filtros.bancas.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}

                {modo !== 'prova' && (
                  <div className="flex items-center gap-3 bg-[#1e293b] border border-slate-700/40 rounded-xl px-4 py-3.5">
                    <span className="text-[13px] text-slate-400 flex-1">Nº de questões</span>
                    <div className="flex items-center gap-2">
                      {[15, 30, 50].map(n => (
                        <button
                          key={n}
                          onClick={() => setQtd(n)}
                          className={`w-10 h-8 rounded-lg text-[13px] font-medium transition-all
                            ${qtd === n ? 'bg-blue-600 text-white' : 'bg-slate-700/50 text-slate-400'}`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleIniciar}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-xl py-4 text-[15px] font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  Iniciar Simulado
                  <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Histórico */}
        {historico.length > 0 && (
          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Histórico recente</p>
            <div className="flex flex-col gap-2">
              {historico.slice(0, 5).map(h => {
                const pct = Math.round((h.acertos / h.total) * 100)
                return (
                  <div key={h.id} className="flex items-center gap-3 bg-[#1e293b] border border-slate-700/30 rounded-xl px-4 py-3">
                    <BarChart2 size={15} className="text-slate-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-slate-200 truncate">
                        {h.config?.cat || h.config?.banca || h.prova_id?.split('_').slice(1,4).join(' ') || 'Simulado'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {h.acertos}/{h.total} acertos · {new Date(h.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <span className={`text-[13px] font-semibold ${pct >= 70 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                      {pct}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
