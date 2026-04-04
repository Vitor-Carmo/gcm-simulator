"""
05b - Normalizar Banco com IA
Revisa o gcm_data.json com Mistral: corrige gabaritos, vincula contextos,
corrige OCR, categoriza questões.
Uso: python 05b_normalizar.py
     python 05b_normalizar.py --single "id_da_prova"
"""
import os
import sys
import json
import time
import re
import random
from dotenv import load_dotenv

# Load .env
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(DATA_DIR, '.env'))

from mistralai import Mistral

api_key = os.environ.get("MISTRAL_API_KEY")
model = "mistral-large-latest"
client = Mistral(api_key=api_key) if api_key else None

MAX_RETRIES = 5
BASE_DELAY = 2


def chamar_api_com_retry(prompt, max_retries=MAX_RETRIES):
    """Chama a API com retry exponencial + jitter para erros 5xx."""
    for tentativa in range(max_retries):
        try:
            response = client.chat.complete(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response
        except Exception as e:
            erro_str = str(e)
            is_5xx = any(c in erro_str for c in ["500", "503", "upstream", "unreachable", "internal_server_error"])
            if is_5xx and tentativa < max_retries - 1:
                delay = (BASE_DELAY ** tentativa) + random.uniform(0, 1)
                print(f"      ⏳ Erro 5xx, retry {tentativa + 1}/{max_retries} em {delay:.1f}s...")
                time.sleep(delay)
            else:
                raise

DATA_DIR_PROJECT = os.path.dirname(DATA_DIR)
INPUT_DB = os.path.join(DATA_DIR_PROJECT, 'gcm_data.json')
OUTPUT_DB = os.path.join(DATA_DIR_PROJECT, 'gcm_data_normalizado.json')
LOG_FILE = os.path.join(BASE_DIR, '..', 'logs', 'log_normalizacao_ia.txt')


def salvar_log(prova_id, log_texto):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"\n{'='*60}\n")
        f.write(f"PROVA: {prova_id}\n")
        f.write(f"LOG: {log_texto}\n")
        f.write(f"{'='*60}\n")


def normalizar_prova_ia(prova_json, texto_bruto):
    prompt = f"""
[INST] VOCÊ É UM AUDITOR DE DADOS DE CONCURSOS.
Sua tarefa é REVISAR e NORMALIZAR o JSON de uma prova de GCM com base no texto bruto do PDF.

DADOS ATUAIS (JSON):
{json.dumps(prova_json, ensure_ascii=False)}

TEXTO BRUTO DO PDF:
{texto_bruto[:15000]}

TAREFAS OBRIGATÓRIAS:
1. REMOVA QUESTÕES INVÁLIDAS: Questões sobre "caneta", "quantas questões", "cor da capa", "instruções" etc. não são questões de concurso.
2. CONFERIR GABARITO: Verifique se "res" está correto. Se estiver errado ou nulo, corrija.
3. VINCULAR CONTEXTOS: Verifique se cada questão tem o "ctx_id" correto.
4. CORRIGIR OCR: Corrija erros em "txt" e "opts".
5. CATEGORIZAR: Ajuste "cat" (Português, Matemática, Direito Penal, etc).
6. ESTRUTURA: Mantenha EXATAMENTE: id, metadata, contextos, questoes (com n, ctx_id, txt, opts, res, cat).

SAÍDA:
Antes do JSON, escreva "LOG:" seguido de um parágrafo resumindo as alterações.
Retorne APENAS o JSON puro após o LOG:. [/INST]
"""

    try:
        response = chamar_api_com_retry(prompt)
        full_res = response.choices[0].message.content

        # Extrair LOG
        log_match = re.search(r"LOG:(.*?)(?=\{)", full_res, re.DOTALL | re.IGNORECASE)
        log_texto = log_match.group(1).strip() if log_match else "Nenhuma alteração."

        # Extrair JSON
        json_match = re.search(r'\{.*\}', full_res, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0)), log_texto
        return None, "JSON não encontrado na resposta"

    except Exception as e:
        return None, f"Erro na API: {str(e)}"


def processar_prova(prova):
    if not client:
        return None, "MISTRAL_API_KEY não definida"

    prova_id = prova["id"]
    print(f"   🔍 Normalizando: {prova_id}")

    # Tenta encontrar texto bruto da prova
    texto_bruto = ""
    txt_path = os.path.join(DATA_DIR_PROJECT, '../../provas', prova_id, 'texto_bruto_debug.txt')
    if os.path.exists(txt_path):
        with open(txt_path, "r", encoding="utf-8") as f:
            texto_bruto = f.read()

    prova_limpa, log_ia = normalizar_prova_ia(prova, texto_bruto)

    if prova_limpa:
        salvar_log(prova_id, log_ia)
        print(f"      ✅ normalizado.")
    else:
        print(f"      ⚠️ Falhou: {log_ia}")

    return prova_limpa, log_ia


def main():
    if not os.path.exists(INPUT_DB):
        print(f"❌ gcm_data.json não encontrado!")
        return

    with open(INPUT_DB, "r", encoding="utf-8") as f:
        db = json.load(f)

    # Filtrar só provas específicas se passado --single
    single_id = None
    if "--single" in sys.argv:
        idx = sys.argv.index("--single")
        single_id = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None
        if single_id:
            db = [p for p in db if p["id"] == single_id]
            print(f"🔍 Modo single: {single_id}")

    print(f"📦 Normalizando {len(db)} provas...\n")

    db_normalizado = []

    for prova in db:
        prova_id = prova["id"]

        # Ignora provas sem questões (já puladas na geração)
        if not prova.get("questoes"):
            db_normalizado.append(prova)
            continue

        prova_limpa, log_ia = processar_prova(prova)

        if prova_limpa:
            db_normalizado.append(prova_limpa)
        else:
            db_normalizado.append(prova)  # Mantém original se falhar

        # Salva progresso a cada 5 provas
        if len(db_normalizado) % 5 == 0:
            with open(OUTPUT_DB, "w", encoding="utf-8") as f:
                json.dump(db_normalizado, f, ensure_ascii=False, indent=2)

        time.sleep(1)

    # Salva final
    with open(OUTPUT_DB, "w", encoding="utf-8") as f:
        json.dump(db_normalizado, f, ensure_ascii=False, indent=2)

    print(f"\n✨ Normalização concluída! {len(db_normalizado)} provas.")
    print(f"📁 Saída: {OUTPUT_DB}")


if __name__ == "__main__":
    main()
