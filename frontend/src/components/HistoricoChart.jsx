/**
 * HistoricoChart — Gráfico SVG minimalista de evolução de acertos.
 * Sem dependência de bibliotecas de charting.
 * Usa apenas dados já em memória (state historico).
 */
export function HistoricoChart({ historico }) {
  if (!historico || historico.length < 2) return null

  // Pega os últimos 10 resultados
  const pontos = historico.slice(0, 10).reverse()

  // Calcula percentage para cada ponto
  const dados = pontos.map(h => ({
    pct: h.total > 0 ? Math.round((h.acertos / h.total) * 100) : 0,
    data: new Date(h.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }))

  const width = dados.length * 64
  const height = 100
  const paddingX = 24
  const paddingY = 8
  const chartWidth = width - paddingX * 2
  const chartHeight = height - paddingY * 2

  // Converte percentage para coordenada Y (invertido: 100% = topo)
  const toY = pct => paddingY + chartHeight - (pct / 100) * chartHeight

  // Gera pontos para a polyline
  const points = dados.map((d, i) => {
    const x = paddingX + (i / Math.max(dados.length - 1, 1)) * chartWidth
    return `${x},${toY(d.pct)}`
  }).join(' ')

  // Cor do ponto baseada no percentage
  const dotColor = (pct) => {
    if (pct >= 70) return '#4ade80' // green
    if (pct >= 50) return '#fbbf24' // amber
    return '#f87171' // red
  }

  return (
    <div className="bg-[#1e293b] border border-slate-700/30 rounded-2xl p-4 mb-6">
      <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">Evolução</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[100px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Linha horizontal tracejada de referência 50% */}
        <line
          x1={paddingX}
          y1={toY(50)}
          x2={width - paddingX}
          y2={toY(50)}
          stroke="#475569"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
        />

        {/* Polyline de evolução */}
        <polyline
          points={points}
          stroke="#3b82f6"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {dados.map((d, i) => {
          const x = paddingX + (i / Math.max(dados.length - 1, 1)) * chartWidth
          const y = toY(d.pct)
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="5"
                fill={dotColor(d.pct)}
                stroke="#0f172a"
                strokeWidth="2"
              />
              {/* Tooltip on hover seria ideal mas por simplicidade mostra só no hover */}
              <title>{d.data}: {d.pct}%</title>
            </g>
          )
        })}
      </svg>
      {/* Labels */}
      <div className="flex justify-between mt-1 px-4">
        {dados.map((d, i) => (
          <span key={i} className="text-[9px] text-slate-600">{d.data}</span>
        ))}
      </div>
    </div>
  )
}
