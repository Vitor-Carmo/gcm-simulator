# CLAUDE.md — Contexto do Projeto GCM Simulator

## Projeto

**GCM Simulator** — plataforma de estudo mobile-first para concursos de Guarda Civil Municipal.

### O que faz
- Carrega questões de provas de concursos GCM de PDFs
- Normaliza dados usando **Mistral** (API oficial, não Ollama)
- Disponibiliza simulado offline via IndexedDB (Dexie.js)
- Deploy automático para GitHub Pages via GitHub Actions

### Stack
- **Frontend**: React 18 + Vite + TailwindCSS + Framer Motion + Dexie.js
- **Data Engine**: Python 3.10+ com venv isolado
- **IA**: Mistral (extração, gabaritos, contextos, normalização)
- **CI/CD**: GitHub Actions
- **Testes**: Vitest + Testing Library

### Fontes de dados
- PDFs de provas得来的 de `data-engine/raw-provas/`
- CDN de PDFs em `gcm-simulator-provas-cdn` (externo ao repo)

---

## Pipeline de Dados

A pipeline completa está em `data-engine/scripts/run_pipeline.py`:

```
01_import_provas.py        → importa pastas de provas
02_extrair_questoes.py     → extrai questões (Mistral)
03_minerar_gabarito.py     → minera gabaritos (Mistral)
04_minerar_contextos.py    → vincula textos de apoio (Mistral)
05_gerar_banco.py          → gera gcm_data.json
05b_normalizar.py          → normaliza dados (Mistral)
05c_aplicar_normalizacao.py → aplica normalizações
06_minificar.py            → minifica para frontend/public/
07_sync_cdn.py             → sincroniza PDFs com CDN
```

Dados fluem: `raw-provas/` → `gcm_data.json` → `gcm_data.min.json` → `frontend/public/`

---

## Estrutura de Diretórios

```
/frontend                   — app React
  /public/gcm_data.min.json — banco de questões minificado
  /src/test/               — testes Vitest
  vite.config.js
  package.json              — usa yarn (não npm)
  yarn.lock

/data-engine
  /scripts
    run_pipeline.py         — orquestra toda a pipeline
    common.py               — config e utilitários compartilhados
    01..07*.py              — passos da pipeline
    /utils                  — scripts legados (versão Ollama/MiniMax)
  /raw-provas               — PDFs brutos (gitignored)
  .env                      — MISTRAL_API_KEY (gitignored)

/.github/workflows
  deploy.yml               — CI: testes → minify → build → deploy
```

---

## Variáveis de Ambiente

```
MISTRAL_API_KEY=<token>  # em data-engine/.env
```

---

## Como o Usuário Prefere Trabalhar

- **yarn** para tudo no frontend (não npm)
- Pipeline rodada manualmente via `python run_pipeline.py`
- Prefere commits limpos e descritivos, não necessariamente pequenos
- Gosta de test coverage antes de deploy
- Nota no footer: "Projeto feito para o amor da minha vida Larissa Pires"

---

## Notas Técnicas Importantes

- `reservoirSample` em `db.js` — algoritmo R de Vitter, O(n), usado para seleção aleatória de questões
- Dexie.js schema v5: `provas`, `questoes`, `contextos`, `historico`
- Timer de 45 minutos no simulado (`useTimer` hook)
- Frontend é mobile-first, max-width 430px
- Base URL para deploy em subpath: `/gcm-simulator/`

---

## Funcionalidades do Simulado

### Modos de simulado
- **Por Prova**: seleciona uma prova específica completa
- **Por Matéria**: filtra por categoria (Direito Penal, Legislação, Português, etc.)
- **Por Banca**: filtra por banca examinadora (FGV, VUNESP, IBFC, etc.)
- **Aleatório**: reservoir sampling de todo o banco

### Modo Treino vs Simulado
- **Treino**: sem timer, pode revisar respostas imediatamente
- **Simulado**: timer de 45 min, navegação livre entre questões, termina ao confirmar ou no timeout

### Navegação e finalização
- Seta do teclado e botões Anterior/Próxima
- Pode avançar para última questão e terminar antecipadamente ("Finalizar" aparece na última)
- Percentual de acerto calculado sobre **questões respondidas** (não total)

### Revisão de erros
- Botão "Revisar Erros (N)" após o resultado
- Mostra só as questões erradas com feedback de acerto/erro

### Histórico e gráfico
- Salva resultados no IndexedDB (`historico`)
- Gráfico SVG de evolução (últimos 10 resultados, linha azul + dots coloridos)
- Label do histórico inclui ano quando filtrado por ano

---

## Testes (Vitest + Testing Library)

Suite completa: **80 testes**, 7 arquivos, todos passando.

### Arquivos de teste (`frontend/src/test/`)

| Arquivo | Qtd | O que testa |
|---|---|---|
| `QuestionCard.test.jsx` | 17 | Renderização, seleção, confirmação, contexto, modo revisão |
| `ResultadoPage.test.jsx` | 15 | Score, mensagens (Aprovado/Bom/Continue), gabarito, revisar erros |
| `MenuPage.test.jsx` | 26 | Seleção de modos, filtros ano/matéria, iniciar simulado/treino |
| `SimuladoPage.test.jsx` | 8 | Navegação por setas/teclado e botões Anterior/Próxima |
| `HistoricoChart.test.jsx` | 4 | Renderização SVG condicional (mínimo 2 itens) |
| `reservoirSample.test.js` | 7 | Algoritmo R de Vitter — aleatoriedade e limites |
| `db.test.js` | 3 | `buscarContextosPorIds` — comportamento com ctxIds vazio/null/inexistente |

### Bugs capturados por testes
- Filtro secundário de matéria sobrescrevia matéria principal no modo "Por Matéria"
- Label do histórico não exibia ano quando filtrado por ano
- Percentual calculado sobre total de questões em vez de respondidas

### Dicas de escrita de testes
- Testes usam `@testing-library/jest-dom` (importado em `setup.js`)
- Textos quebrados por `<br>` em JSX causam problemas com `getByText` — use `getAllByText` ou queries por `className`
- AnimatePresence do Framer Motion pode deixar elementos no DOM após transição — use `waitFor` ou `cleanup()`
- `getByRole('button', { name: /texto/i })` é mais confiável que matchers de texto para botões
- Para testar IndexedDB/Dexie, use `vi.spyOn` no módulo já importado (não `vi.mock` com factory async)
