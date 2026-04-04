"""
03 - Minerar Gabarito
Usa Mistral para extrair o gabarito do PDF de gabarito.
Uso: python 03_minerar_gabarito.py [pasta]
     python 03_minerar_gabarito.py 001_guarda_civil_pref_paratysp_2025_avança_sp
     python 03_minerar_gabarito.py  # todas
"""
import os
import sys
import json
import pdfplumber
import time
import re
from dotenv import load_dotenv

# Load .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(os.path.dirname(BASE_DIR))
load_dotenv(os.path.join(DATA_DIR, '.env'))

from mistralai import Mistral
from common import RAW_PROVAS_DIR, list_provas, get_pdf_gabarito

api_key = os.environ.get("MISTRAL_API_KEY")
model = "mistral-medium-latest"
client = Mistral(api_key=api_key) if api_key else None


def processar_gabarito(pasta_nome):
    if not client:
        print("❌ MISTRAL_API_KEY não definida.")
        return

    pasta_path = os.path.join(RAW_PROVAS_DIR, pasta_nome)
    questoes_path = os.path.join(pasta_path, "questoes.json")

    if not os.path.exists(questoes_path):
        print(f"⚠️ questoes.json não existe: {pasta_nome}")
        return

    with open(questoes_path, 'r', encoding='utf-8') as f:
        questoes = json.load(f)

    # Verifica se já tem gabarito
    if all("correta" in q for q in questoes):
        print(f"⏩ {pasta_nome}: já tem gabarito.")
        return

    pdf_path = get_pdf_gabarito(pasta_path)
    if not pdf_path:
        print(f"⚠️ PDF do gabarito não encontrado: {pasta_nome}")
        return

    print(f"🔑 Processando gabarito: {pasta_nome}")

    with pdfplumber.open(pdf_path) as pdf:
        texto = "\n".join(p.extract_text() or "" for p in pdf.pages[:3])

    prompt = f"""
Analise o texto extraído de um PDF de GABARITO da prova: {pasta_nome}.

OBJETIVO:
Extrair os pares (Número da Questão : Alternativa Correta).

REGRAS:
1. Foque no cargo de GUARDA CIVIL MUNICIPAL (GCM).
2. Ignore outros cargos. Se houver Prova 1, 2, etc., use a Prova 1.
3. Se os dados estiverem em sequência (Ex: "ABCDE..."), numere-os de 1 em diante.
4. Retorne APENAS o JSON puro, sem explicações.
FORMATO: {{"1": "A", "2": "C", "3": "B"}}

TEXTO:
{texto}
"""

    try:
        chat_response = client.chat.complete(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        resposta_bruta = chat_response.choices[0].message.content

        # Log para debug
        with open("../logs/log_gabarito_ia.txt", "a", encoding="utf-8") as log:
            log.write(f"\n{'='*60}\n{pasta_nome}\n{resposta_bruta}\n")

        match = re.search(r'\{.*\}', resposta_bruta, re.DOTALL)
        if match:
            gabarito_map = json.loads(match.group(0))
            count = 0
            for q in questoes:
                num = str(q.get("numero"))
                if num in gabarito_map:
                    q["correta"] = str(gabarito_map[num]).upper()
                    count += 1

            with open(questoes_path, 'w', encoding='utf-8') as f:
                json.dump(questoes, f, ensure_ascii=False, indent=2)
            print(f"   ✅ {pasta_nome}: {count} respostas aplicadas.")
        else:
            print(f"   ⚠️ JSON não encontrado na resposta. Verifique log_gabarito_ia.txt")

    except Exception as e:
        print(f"   ❌ Erro: {e}")


def main():
    if len(sys.argv) > 1:
        for arg in sys.argv[1:]:
            if os.path.exists(os.path.join(RAW_PROVAS_DIR, arg)):
                processar_gabarito(arg)
            else:
                print(f"⚠️ Pasta não existe: {arg}")
    else:
        pastas = list_provas()
        print(f"📦 Processando {len(pastas)} pastas...\n")
        for pasta in pastas:
            processar_gabarito(pasta)


if __name__ == "__main__":
    main()
