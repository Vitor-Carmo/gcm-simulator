import os
import json
import time
import re
from mistralai import Mistral

# Configurações
api_key = os.environ.get("MISTRAL_API_KEY")
model = "mistral-large-latest" # Recomendo o Large para esta tarefa por ser a mais complexa
client = Mistral(api_key=api_key)

INPUT_DB = "db_simulado.json"
OUTPUT_DB = "db_simulado_REVISADO.json"
LOG_HUMANO = "log_normalizacao_master.txt"

def salvar_log(prova_id, acoes):
    with open(LOG_HUMANO, "a", encoding="utf-8") as f:
        f.write(f"\n{'='*60}\n")
        f.write(f"REVISÃO PROVA: {prova_id}\n")
        f.write(f"AÇÕES REALIZADAS:\n{acoes}\n")
        f.write(f"{'='*60}\n")

def normalizar_prova_ia(prova_json, texto_bruto):
    # Limitamos o texto bruto para não estourar o contexto, mas o Large aguenta muito
    prompt = f"""
    [INST] VOCÊ É UM AUDITOR DE DADOS DE CONCURSOS.
    Sua tarefa é REVISAR e NORMALIZAR o JSON de uma prova de GCM com base no texto bruto extraído do PDF.

    DADOS ATUAIS (JSON):
    {json.dumps(prova_json, ensure_ascii=False)}

    TEXTO BRUTO DA PROVA:
    {texto_bruto}

    TAREFAS OBRIGATÓRIAS:
    1. CONFERIR GABARITO: Verifique se o campo "res" (resposta) condiz com o texto. Se estiver errado ou nulo, corrija.
    2. VINCULAR CONTEXTOS: Verifique se cada questão ("n") está vinculada ao "ctx_id" correto. Se uma questão usa um texto e não tem ctx_id, adicione.
    3. INTEGRIDADE DO TEXTO: Corrija erros de OCR nas perguntas ("txt") e alternativas ("opts").
    4. CATEGORIZAÇÃO: Ajuste o campo "cat" (Português, Matemática, Direito Penal, etc).
    5. NÃO QUEBRE A ESTRUTURA: Retorne EXATAMENTE a mesma estrutura de chaves: "id", "metadata", "contextos", "questoes" (com sub-chaves n, ctx_id, txt, opts, res, cat).

    SAÍDA:
    Retorne um objeto JSON puro. Antes do JSON, escreva um parágrafo curto chamado "LOG:" resumindo o que você alterou.
    [/INST]
    """

    try:
        response = client.chat.complete(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        full_res = response.choices[0].message.content
        
        # Extrair Log Humano
        log_match = re.search(r"LOG:(.*?)(?=\{|\s*\[)", full_res, re.DOTALL | re.IGNORECASE)
        log_texto = log_match.group(1).strip() if log_match else "Nenhuma alteração descrita."
        
        # Extrair JSON
        json_match = re.search(r"\{.*\}", full_res, re.DOTALL)
        if json_match:
            return json.loads(json_match.group(0)), log_texto
        return None, "Erro: JSON não encontrado na resposta"

    except Exception as e:
        return None, f"Erro na API: {str(e)}"

def main():
    if not os.path.exists(INPUT_DB):
        print("❌ Arquivo db_simulado.json não encontrado!")
        return

    with open(INPUT_DB, "r", encoding="utf-8") as f:
        db = json.load(f)

    db_revisado = []
    
    with open(LOG_HUMANO, "w", encoding="utf-8") as f:
        f.write("INICIANDO NORMALIZAÇÃO MASTER\n")

    for prova in db:
        prova_id = prova["id"]
        print(f"🧠 IA Analisando: {prova_id}...")
        
        # Buscar o texto bruto da pasta original para dar contexto à IA
        caminho_texto = f"provas/{prova_id}/texto_bruto_para_contexto.txt"
        texto_bruto = ""
        if os.path.exists(caminho_texto):
            with open(caminho_texto, "r", encoding="utf-8") as f:
                texto_bruto = f.read()

        while True:
            prova_limpa, log_ia = normalizar_prova_ia(prova, texto_bruto)
            
            if "429" in log_ia:
                print("⏳ Rate limit. Aguardando 30s...")
                time.sleep(30)
                continue
            
            if prova_limpa:
                db_revisado.append(prova_limpa)
                salvar_log(prova_id, log_ia)
                print(f"✅ Revisada com sucesso.")
            else:
                print(f"❌ Falha na revisão: {log_ia}")
                db_revisado.append(prova) # Mantém a original se a IA falhar
            break
        
        # Salva o progresso a cada prova (segurança)
        with open(OUTPUT_DB, "w", encoding="utf-8") as f:
            json.dump(db_revisado, f, ensure_ascii=False, indent=2)
        
        time.sleep(2) # Respiro para a API

    print(f"\n✨ Processo concluído! Arquivo final: {OUTPUT_DB}")

if __name__ == "__main__":
    main()