"""
02 - Extrair Questões
Usa Mistral para extrair questões de um PDF de prova.
Uso: python 02_extrair_questoes.py [pasta]
     python 02_extrair_questoes.py 001_guarda_civil_pref_paratysp_2025_avança_sp
     python 02_extrair_questoes.py  # processa todas
"""
import os
import sys
import json
import pdfplumber
import time
import re
from dotenv import load_dotenv

# Load .env before importing from common
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# .env is at project root: gcm-simulator/.env
DATA_DIR = os.path.dirname(os.path.dirname(BASE_DIR))
load_dotenv(os.path.join(DATA_DIR, '.env'))

from mistralai import Mistral
from common import RAW_PROVAS_DIR, list_provas, get_pdf_prova

api_key = os.environ.get("MISTRAL_API_KEY")
model = "mistral-medium-latest"
client = Mistral(api_key=api_key) if api_key else None


def extrair_json_resposta(resposta_bruta):
    match = re.search(r'\[.*\]|\{.*\}', resposta_bruta, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except:
            pass
    return None


def processar_pagina(pdf_path, num_pagina, texto_pag):
    prompt = f"""
Extraia as questões do texto abaixo para uma lista JSON.
FORMATO: [{{"numero": int, "pergunta": str, "alternativas": {{"A": str, "B": str, "C": str, "D": str, "E": str}}, "categoria": str, "pagina": int}}]

REGRAS ESTRITAS:
- Retorne APENAS o JSON puro, sem explicações.
- Se não houver 5 alternativas, preencha com null.
- Tente inferir a categoria (Português, Matemática, Direito Penal, etc).
- IGNORE E NÃO INCLUA questões administrativas como:
  * "Qual caneta usar?" / "cor de caneta"
  * "Quantas questões tem a prova?"
  * "Instruções sobre preenchimento da folha de respostas"
  * "Como dissertar" / "redação"
  * "Conteúdo da prova" / "programa"
  * Qualquer texto sobre o concurso, banca ou organization
- Só inclua questões que tenham enunciado + 5 alternativas com letras A-E. Porem se não tiver E, preencha com null.
- Se a página não tiver questões reais, retorne lista vazia [].

TEXTO:
{texto_pag}
"""
    try:
        chat_response = client.chat.complete(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        resposta = chat_response.choices[0].message.content
        dados = extrair_json_resposta(resposta)
        if dados:
            for q in dados:
                q['pagina'] = num_pagina
            return dados
    except Exception as e:
        print(f"   ❌ Erro Mistral: {e}")
    return []


def processar_pasta(pasta_nome, resume=True):
    if not client:
        print("❌ MISTRAL_API_KEY não definida.")
        return

    pasta_path = os.path.join(RAW_PROVAS_DIR, pasta_nome)
    if not os.path.exists(pasta_path):
        print(f"❌ Pasta não encontrada: {pasta_nome}")
        return

    pdf_path = get_pdf_prova(pasta_path)
    if not pdf_path:
        print(f"❌ PDF da prova não encontrado em: {pasta_nome}")
        return

    output_json = os.path.join(pasta_path, "questoes.json")
    todas_questoes = []
    paginas_concluidas = set()

    if resume and os.path.exists(output_json):
        with open(output_json, "r", encoding="utf-8") as f:
            todas_questoes = json.load(f)
            paginas_concluidas = {q.get("pagina") for q in todas_questoes}
        print(f"   ✅ {len(todas_questoes)} questões existentes. Retomando...")

    print(f"📄 Processando: {pasta_nome}")

    with pdfplumber.open(pdf_path) as pdf:
        total = len(pdf.pages)

        for i, page in enumerate(pdf.pages):
            num_pagina = i + 1
            if num_pagina in paginas_concluidas:
                continue

            texto = page.extract_text() or ""
            if not texto.strip():
                continue

            if 'gabarito' in texto.lower():
                continue

            print(f"   📃 Pág {num_pagina}/{total}...")
            questoes = processar_pagina(pdf_path, num_pagina, texto)

            if questoes:
                todas_questoes.extend(questoes)
                with open(output_json, "w", encoding="utf-8") as f:
                    json.dump(todas_questoes, f, ensure_ascii=False, indent=2)
                print(f"      +{len(questoes)} questões salvas.")

            time.sleep(1)

    print(f"   🏁 {pasta_nome}: {len(todas_questoes)} questões.")


def main():
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if os.path.exists(os.path.join(RAW_PROVAS_DIR, arg)):
                processar_pasta(arg)
            else:
                print(f"⚠️ Pasta não existe: {arg}")
    else:
        pastas = list_provas()
        print(f"📦 Processando {len(pastas)} pastas...\n")
        for pasta in pastas:
            processar_pasta(pasta)


if __name__ == "__main__":
    main()
