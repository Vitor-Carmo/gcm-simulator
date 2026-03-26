import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export function ContextDrawer({ contexto, isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 z-40"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: '100%', x: '-50%' }}
            animate={{ y: 0, x: '-50%' }}
            exit={{ y: '100%', x: '-50%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-1/2 w-full max-w-[430px] 
                      bg-[#1e293b] rounded-t-2xl z-50 flex flex-col"
            style={{ maxHeight: '75vh' }}
          >
            {/* Handle */}
            <div className="flex-shrink-0 pt-3 pb-1 flex justify-center">
              <div className="w-9 h-1 rounded-full bg-slate-600/60" />
            </div>

            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-slate-700/40">
              <div>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-0.5">Texto de Apoio</p>
                <p className="text-[14px] font-medium text-slate-100">
                  {contexto?.titulo ?? 'Texto de referência'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-700/50 text-slate-400 hover:text-slate-100 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-hide">
              {contexto?.conteudo?.split('\n\n').map((paragrafo, i) => (
                <p key={i} className="text-[14px] text-slate-300 leading-relaxed mb-4 last:mb-0">
                  {paragrafo}
                </p>
              ))}
            </div>

            {/* Segurança bottom */}
            <div className="flex-shrink-0 h-6" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
