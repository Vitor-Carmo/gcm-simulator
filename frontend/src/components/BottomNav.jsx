import { ChevronLeft, ChevronRight } from 'lucide-react'

export function BottomNav({ currentIndex, total, onNavigate }) {
  const progress = ((currentIndex + 1) / total) * 100

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]
                    bg-[#0f172a] border-t border-slate-700/25 px-4 pt-3 pb-6 z-10">
      <div className="flex items-center gap-3">
        {/* Anterior */}
        <button
          onClick={() => onNavigate(-1)}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl border border-slate-700/40 bg-[#1e293b]
                     text-[14px] font-medium text-slate-400
                     hover:text-slate-100 hover:border-slate-600/60 transition-all
                     disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronLeft size={16} />
          Anterior
        </button>

        {/* Progresso central */}
        <div className="flex flex-col items-center min-w-[60px]">
          <span className="text-[15px] font-semibold text-slate-100 tabular-nums">
            {currentIndex + 1}/{total}
          </span>
          <div className="w-full h-1 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Próxima */}
        <button
          onClick={() => onNavigate(1)}
          disabled={currentIndex === total - 1}
          className="flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-xl border border-slate-700/40 bg-[#1e293b]
                     text-[14px] font-medium text-slate-400
                     hover:text-slate-100 hover:border-slate-600/60 transition-all
                     disabled:opacity-30 disabled:pointer-events-none"
        >
          Próxima
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  )
}
