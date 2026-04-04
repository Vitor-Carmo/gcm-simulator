import { FileSearch, ArrowLeft } from 'lucide-react'
import { useTimer } from '../hooks/useTimer'

export function Header({ metadados, onOpenPdf, onVoltar, respondidas, total, modo }) {
  const { formatted } = useTimer(modo === 'treino' ? null : 45 * 60)
  const isTreino = modo === 'treino'

  return (
    <header className="sticky top-0 z-10 bg-[#0f172a] border-b border-slate-700/30 px-4 py-3 flex items-center gap-3">
      <button onClick={onVoltar} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors">
        <ArrowLeft size={15} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest truncate">
          {metadados.orgao || 'Simulado'} · {metadados.ano || ''}
        </p>
        <p className="text-[12px] text-slate-400 mt-0.5">{metadados.banca || ''} · {respondidas}/{total}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onOpenPdf}
          title="Ver prova original"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400 text-xs font-medium hover:text-slate-200 transition-all"
        >
          <FileSearch size={13} />
          PDF
        </button>
        {!isTreino && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-950/40 border border-blue-800/30">
            <span className={`w-1.5 h-1.5 rounded-full ${formatted.isCritical ? 'bg-red-500' : formatted.isWarning ? 'bg-amber-400' : 'bg-blue-500'} animate-pulse`} />
            <span className="text-[13px] font-semibold text-slate-200 tabular-nums">{formatted.display}</span>
          </div>
        )}
      </div>
    </header>
  )
}
