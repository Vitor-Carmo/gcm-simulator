import Dexie from 'dexie'

export const db = new Dexie('GCMSimulador')

db.version(5).stores({
  provas:    'id, banca, ano, orgao',
  questoes:  '++pk, prova_id, n, cat, [prova_id+cat]',
  contextos: '++pk, prova_id, id_contexto',
  historico: '++id, sessao_id, prova_id, createdAt',
})

export async function importarDados(dados, fingerprint) {
  const LAST_FINGERPRINT_KEY = 'gcm_db_fingerprint'
  const lastFingerprint = localStorage.getItem(LAST_FINGERPRINT_KEY)
  
  const totalNoDb = await db.provas.count()

  // CONDIÇÃO DE ATUALIZAÇÃO:
  if (totalNoDb === 0 || lastFingerprint !== fingerprint) {
    console.log("🔄 Dados novos detectados ou banco vazio. Sincronizando...")
    
    // Limpa tudo antes de colocar os dados novos (evita duplicatas e lixo)
    await Promise.all([
      db.provas.clear(),
      db.questoes.clear(),
      db.contextos.clear()
    ])

    await db.transaction('rw', db.provas, db.questoes, db.contextos, async () => {
      for (const prova of dados) {
        await db.provas.put({
          id:    prova.id,
          cargo: prova.metadata.cargo,
          orgao: prova.metadata.orgao,
          ano:   prova.metadata.ano,
          banca: prova.metadata.banca,
          links: prova.metadata.links,
        })

        if (prova.contextos) {
          await db.contextos.bulkPut(prova.contextos.map(ctx => ({ ...ctx, prova_id: prova.id })))
        }
        
        if (prova.questoes) {
          await db.questoes.bulkPut(prova.questoes.map(q => ({ ...q, prova_id: prova.id, cat: q.cat || 'Geral' })))
        }
      }
    })

    // Salva a nova assinatura para a próxima vez
    localStorage.setItem(LAST_FINGERPRINT_KEY, fingerprint)
    console.log("✅ Banco de dados sincronizado com sucesso!")
  } else {
    console.log("🟢 Banco de dados já está atualizado.")
  }
}

export async function valoresUnicos(campo) {
  const provas = await db.provas.toArray()
  return [...new Set(provas.map(p => p[campo]).filter(Boolean))].sort()
}

export async function materiasUnicas() {
  const questoes = await db.questoes.toArray()
  return [...new Set(questoes.map(q => q.cat).filter(Boolean))].sort()
}

export async function carregarProva(provaId) {
  const [metadados, questoes, contextos] = await Promise.all([
    db.provas.get(provaId),
    db.questoes.where('prova_id').equals(provaId).sortBy('n'),
    db.contextos.where('prova_id').equals(provaId).toArray(),
  ])
  return { metadados, questoes, contextos }
}

export async function carregarPorFiltro({ prova_id, cat, banca, ano, limite = 60 }) {
  let questoes

  if (prova_id && cat) {
    questoes = await db.questoes.where('[prova_id+cat]').equals([prova_id, cat]).toArray()

  } else if (prova_id) {
    questoes = await db.questoes.where('prova_id').equals(prova_id).toArray()

  } else if (banca || ano) {
    const ids = await db.provas.toArray()
      .then(ps => ps.filter(p => {
        if (banca && p.banca !== banca) return false
        if (ano && p.ano !== ano) return false
        return true
      }).map(p => p.id))
    questoes = await db.questoes.where('prova_id').anyOf(ids).toArray()
    if (cat) questoes = questoes.filter(q => q.cat === cat)

  } else if (cat) {
    questoes = await db.questoes.where('cat').equals(cat).toArray()

  } else {
    questoes = await db.questoes.toArray()
  }

  // Reservoir sampling — O(n) mas sem ordenar o array inteiro
  // Garante seleção verdadeiramente aleatória sem trazer mais do que o necessário
  const selecionadas = reservoirSample(questoes, limite)

  // busca metadados só das questões selecionadas
  const provaIds = [...new Set(selecionadas.map(q => q.prova_id))]
  const provas = await Promise.all(provaIds.map(id => db.provas.get(id)))
  const provasMap = Object.fromEntries(provas.filter(Boolean).map(p => [p.id, p]))

  const ctxIds = [...new Set(selecionadas.map(q => q.ctx_id).filter(Boolean))]
  let ctxMap = {}
  if (ctxIds.length) {
    const ctxList = await db.contextos.where('id_contexto').anyOf(ctxIds).toArray()
    ctxMap = Object.fromEntries(ctxList.map(c => [c.id_contexto, c]))
  }

  return { questoes: selecionadas, provasMap, ctxMap }
}

/**
 * Reservoir sampling (algoritmo R de Vitter)
 * Seleciona k itens aleatórios de um array em O(n)
 * sem precisar ordenar o array inteiro — muito mais eficiente que sort() para arrays grandes
 */
function reservoirSample(arr, k) {
  if (arr.length <= k) return arr
  
  const reservoir = arr.slice(0, k)
  
  for (let i = k; i < arr.length; i++) {
    const j = Math.floor(Math.random() * (i + 1))
    if (j < k) {
      reservoir[j] = arr[i]
    }
  }
  
  return reservoir
}
export async function salvarHistorico(sessao) {
  await db.historico.put({ ...sessao, createdAt: Date.now() })
}

export async function buscarHistorico(limite = 20) {
  return db.historico.orderBy('createdAt').reverse().limit(limite).toArray()
}

export async function buscarContextosPorIds(ctxIds) {
  if (!ctxIds || ctxIds.length === 0) return {}
  const ctxList = await db.contextos.where('id_contexto').anyOf(ctxIds).toArray()
  return Object.fromEntries(ctxList.map(c => [c.id_contexto, c]))
}
