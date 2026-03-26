import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'

export function PdfModal({ metadados, isOpen, onClose }) {
  if (!metadados) return null
  const pdfUrl = metadados.links?.pdf || metadados.prova_pdf

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="pdf-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 bg-black/90 z-[60] flex flex-col"
        >
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#0f172a] border-b border-slate-700/30">
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-widest">Prova Original</p>
              <p className="text-[13px] text-slate-200 font-medium">{metadados.orgao} · {metadados.ano} · {metadados.banca}</p>
            </div>
            <div className="flex items-center gap-2">
              {pdfUrl && (
                <a href={pdfUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900/40 border border-blue-700/40 text-[12px] text-blue-300 font-medium hover:bg-blue-900/60 transition-all">
                  <ExternalLink size={12} />
                  Abrir
                </a>
              )}
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700/40 text-slate-300 hover:text-white transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>
          <div className="flex-1 relative overflow-hidden">
            {pdfUrl
              ? <iframe src={pdfUrl} title="Prova Original" className="w-full h-full border-none" allow="fullscreen" />
              : (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm">
                  PDF não disponível para este simulado misto.
                </div>
              )
            }
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
