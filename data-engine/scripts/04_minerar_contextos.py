"""
04 - Minerar Contextos
Usa Mistral para extrair textos de apoio (contextos) do PDF da prova.
Uso: python 04_minerar_contextos.py [pasta]
     python 04_minerar_contextos.py 001_guarda_civil_pref_paratysp_2025_avança_sp
     python 04_minerar_contextos.py  # todas
"""
import os
import sys
import json
import pdfplumber
import time
import re
import random
from dotenv import load_dotenv

# Load .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(os.path.dirname(BASE_DIR))
load_dotenv(os.path.join(DATA_DIR, '.env'))

from mistralai import Mistral
from common import RAW_PROVAS_DIR, list_provas, get_pdf_prova

api_key = os.environ.get("MISTRAL_API_KEY")
model = "mistral-medium-latest"
client = Mistral(api_key=api_key) if api_key else None

MAX_RETRIES = 5
BASE_DELAY = 2  # segundos


def llamar_api_mistral(prompt, max_retries=MAX_RETRIES):
    """Chama a API com retry exponencial + jitter."""
    for tentativa in range(max_retries):
        try:
            response = client.chat.complete(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response
        except Exception as e:
            erro_str = str(e)
            is_503 = "503" in erro_str or "upstream" in erro_str.lower() or "overflow" in erro_str.lower()
            if is_503 and tentativa < max_retries - 1:
                delay = (BASE_DELAY ** tentativa) + random.uniform(0, 1)
                print(f"   ⏳ 503 detectado, retry {tentativa + 1}/{max_retries} em {delay:.1f}s...")
                time.sleep(delay)
            else:
                raise


def limpar_json_sujo(content):
    content = content.strip()
    def substituir_quebra(match):
        return match.group(0).replace('\n', '\\n').replace('\r', '\\r')
    content = re.sub(r'":\s*"(.*?)"', substituir_quebra, content, flags=re.DOTALL)
    return content


def processar_contexto(pasta_nome):
    if not client:
        print("❌ MISTRAL_API_KEY não definida.")
        return

    pasta_path = os.path.join(RAW_PROVAS_DIR, pasta_nome)
    pdf_path = get_pdf_prova(pasta_path)

    if not pdf_path:
        print(f"⚠️ PDF não encontrado: {pasta_nome}")
        return

    # Extrai texto das primeiras páginas (onde costumam estar os textos de apoio)
    texto_bruto = ""
    with pdfplumber.open(pdf_path) as pdf:
        for i in range(min(10, len(pdf.pages))):
            t = pdf.pages[i].extract_text()
            if t:
                texto_bruto += f"\n--- PÁGINA {i+1} ---\n{t}"

    if not texto_bruto.strip():
        print(f"⚠️ Texto não extraído: {pasta_nome}")
        return

    # Salva texto bruto para debug
    txt_debug = os.path.join(pasta_path, "texto_bruto_debug.txt")
    with open(txt_debug, "w", encoding="utf-8") as f:
        f.write(texto_bruto)

    prompt = f"""
[INST] VOCÊ É UM ESPECIALISTA EM ESTRUTURAÇÃO DE DADOS DE CONCURSOS.
Analise o texto da prova '{pasta_nome}' e extraia TODOS os textos de apoio.

CRITÉRIOS:
1. Identifique textos que servem para múltiplas questões (ex: "Leia para as questões 1 a 5").
2. Identifique mini-contextos ou enunciados longos para questões específicas.
3. Extraia o conteúdo INTEGRAL, limpando apenas sujeiras de página.
4. O range_questoes deve ser [inicio, fim].

REGRAS DE FORMATO (CRÍTICO):
1. Retorne uma LISTA de objetos JSON.
2. O campo "conteudo" DEVE ser uma string única.
3. JAMAIS use quebras de linha reais dentro das strings. Use '\\n'.
4. Não use aspas duplas dentro do texto, use aspas simples.
5. O campo "id_contexto" deve seguir o padrão: {pasta_nome}_T1, _T2, etc.

RETORNE APENAS O JSON:
[
  {{
    "id_contexto": "{pasta_nome}_T1",
    "titulo": "Título do texto",
    "autor": "Autor (se houver)",
    "conteudo": "Texto completo...",
    "range_questoes": [1, 5],
    "referencia": "Fonte"
  }}
]

Se não houver textos de apoio, retorne []. [/INST]

TEXTO DA PROVA:
{texto_bruto[:20000]}
"""

    print(f"🔍 Minerando contextos: {pasta_nome}")

    try:
        chat_response = llamar_api_mistral(prompt)
        resposta_bruta = chat_response.choices[0].message.content

        # Log
        with open("../logs/log_contextos_ia.txt", "a", encoding="utf-8") as log:
            log.write(f"\n{'='*80}\n{pasta_nome}\n{resposta_bruta}\n")

        match = re.search(r'\[.*\]', resposta_bruta, re.DOTALL)
        if match:
            json_str = match.group(0)
            try:
                contextos = json.loads(json_str)
            except json.JSONDecodeError:
                contextos = json.loads(limpar_json_sujo(json_str))

            output_path = os.path.join(pasta_path, "contextos.json")
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(contextos, f, ensure_ascii=False, indent=2)
            print(f"   ✅ {len(contextos)} contextos salvos.")
        else:
            print(f"   ⚠️ JSON não encontrado. Verifique log_contextos_ia.txt")

    except Exception as e:
        print(f"   ❌ Erro: {e}")


def main():
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if os.path.exists(os.path.join(RAW_PROVAS_DIR, arg)):
                processar_contexto(arg)
            else:
                print(f"⚠️ Pasta não existe: {arg}")
    else:
        pastas = list_provas()
        print(f"📦 Processando {len(pastas)} pastas...\n")
        for pasta in pastas:
            processar_contexto(pasta)
            time.sleep(1)


if __name__ == "__main__":
    main()
