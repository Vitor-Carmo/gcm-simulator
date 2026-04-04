import { useState, useEffect } from 'react'
import { db, importarDados, valoresUnicos, materiasUnicas, carregarProva, carregarPorFiltro, salvarHistorico, buscarHistorico, buscarContextosPorIds } from './data/db'
import { MenuPage } from './pages/MenuPage'
import { SimuladoPage } from './pages/SimuladoPage'
import { ResultadoPage } from './pages/ResultadoPage'

async function sha256(text) {
  const data = new TextEncoder().encode(text)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function App() {
  const [tela, setTela] = useState('loading') // loading | menu | simulado | resultado
  const [filtros, setFiltros] = useState({ bancas: [], anos: [], materias: [], provas: [] })
  const [provaAtiva, setProvaAtiva] = useState(null) // { questoes, provasMap, ctxMap, config }
  const [resultado, setResultado] = useState(null)
  const [historico, setHistorico] = useState([])

  useEffect(() => {
    async function boot() {
      try {
        // importa dados reais
        const resp = await fetch(`${import.meta.env.BASE_URL}gcm_data.min.json`)
        const dados = await resp.json()
        const text = JSON.stringify(dados)
        const fingerprint = await sha256(text)
        await importarDados(dados, fingerprint)

        // carrega filtros disponíveis
        const [bancas, anos, materias, provasDb] = await Promise.all([
          valoresUnicos('banca'),
          valoresUnicos('ano'),
          materiasUnicas(),
          db.provas.toArray(),
        ])
        setFiltros({ bancas, anos, materias, provas: provasDb })

        const hist = await buscarHistorico()
        setHistorico(hist)

        setTela('menu')
      } catch (e) {
        console.error(e)
        setTela('menu')
      }
    }
    boot()
  }, [])

  async function iniciarSimulado(config) {
    // config: { tipo, prova_id, cat, banca, qtd, modo, ano }
    let dados
    if (config.tipo === 'prova') {
      const p = await carregarProva(config.prova_id)
      const provasMap = { [p.metadados.id]: p.metadados }
      const ctxMap = Object.fromEntries(p.contextos.map(c => [c.id_contexto, c]))
      dados = { questoes: p.questoes, provasMap, ctxMap }
    } else {
      dados = await carregarPorFiltro({
        prova_id: config.prova_id,
        cat: config.cat || config.filtroCat,
        banca: config.banca,
        ano: config.ano,
        limite: config.qtd || 30,
      })
    }
    setProvaAtiva({ ...dados, config })
    setTela('simulado')
  }

  async function finalizarSimulado(respostas) {
    const sessao = {
      sessao_id: `s_${Date.now()}`,
      prova_id: provaAtiva.config.prova_id || 'misto',
      config: provaAtiva.config,
      respostas,
      total: provaAtiva.questoes.length,
      acertos: respostas.filter(r => r.correta).length,
      createdAt: Date.now(),
    }
    await salvarHistorico(sessao)
    const hist = await buscarHistorico()
    setHistorico(hist)
    setResultado({ ...sessao, questoes: provaAtiva.questoes, provasMap: provaAtiva.provasMap })
    setTela('resultado')
  }

  async function iniciarRevisaoErros(resultadoAtual) {
    // Filtra só questões erradas
    const questoesErro = resultadoAtual.respostas
      .map((r, i) => ({ resposta: r, questao: resultadoAtual.questoes[i] }))
      .filter(({ resposta }) => !resposta.correta)
      .map(({ questao }) => questao)

    if (questoesErro.length === 0) return

    // Agrupa por prova_id para montar o provasMap
    const provaIds = [...new Set(questoesErro.map(q => q.prova_id).filter(Boolean))]
    const provasMap = {}
    provaIds.forEach(id => {
      if (resultadoAtual.provasMap?.[id]) {
        provasMap[id] = resultadoAtual.provasMap[id]
      }
    })

    // Busca contextos das questões de erro
    const ctxIds = [...new Set(questoesErro.map(q => q.ctx_id).filter(Boolean))]
    const ctxMap = await buscarContextosPorIds(ctxIds)

    const configRevisao = {
      ...resultadoAtual.config,
      tipo: 'revisao',
      modo: 'treino',
      mostrarRespostaCerta: true,
    }

    setProvaAtiva({ questoes: questoesErro, provasMap, ctxMap, config: configRevisao })
    setTela('simulado')
  }

  if (tela === 'loading') {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-sm">Carregando banco de questões...</p>
      </div>
    )
  }

  if (tela === 'menu') {
    return (
      <MenuPage
        filtros={filtros}
        historico={historico}
        onIniciar={iniciarSimulado}
      />
    )
  }

  if (tela === 'simulado' && provaAtiva) {
    return (
      <SimuladoPage
        prova={provaAtiva}
        onFinalizar={finalizarSimulado}
        onVoltar={() => setTela('menu')}
      />
    )
  }

  if (tela === 'resultado' && resultado) {
    return (
      <ResultadoPage
        resultado={resultado}
        onNovoSimulado={() => setTela('menu')}
        onRevisarErros={() => iniciarRevisaoErros(resultado)}
      />
    )
  }

  return null
}
