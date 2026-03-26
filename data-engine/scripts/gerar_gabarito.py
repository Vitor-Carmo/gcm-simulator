import os
import json
import pdfplumber
import glob
import re
from mistralai import Mistral

# Configurações
api_key = os.environ.get("MISTRAL_API_KEY")
model = "mistral-medium-latest"
client = Mistral(api_key=api_key)

def pedir_gabarito_ia(texto_pdf, nome_prova, pasta_atual):
    prompt = f"""
    Analise o texto extraído de um PDF de GABARITO da prova: {nome_prova}.
    
    OBJETIVO:
    Extrair os pares (Número da Questão : Alternativa Correta).
    
    REGRAS:
    1. Foque no cargo de GUARDA CIVIL MUNICIPAL (GCM).
    2. Ignore outros cargos. Se houver Prova 1, 2, etc., use a Prova 1.
    3. Se os dados estiverem em sequência (Ex: "ABCDE..."), numere-os de 1 em diante.
    4. Retorne APENAS o JSON puro, sem explicações.

    FORMATO:
    {{"1": "A", "2": "C", "3": "B"}}

    TEXTO:
    {texto_pdf}
    """
    
    try:
        chat_response = client.chat.complete(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        resposta_bruta = chat_response.choices[0].message.content

        # --- SISTEMA DE LOG ---
        with open("log_debug_ia.txt", "a", encoding="utf-8") as log:
            log.write(f"\n{'='*60}\nPASTA: {pasta_atual}\nRESPOSTA:\n{resposta_bruta}\n{'='*60}\n")

        # Limpeza para pegar apenas o JSON (caso a IA fale algo)
        match = re.search(r'\{.*\}', resposta_bruta, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        return None

    except Exception as e:
        print(f"❌ Erro na API Mistral (Pasta {pasta_atual}): {e}")
        return None

def processar_com_ia(base_dir="provas"):
    if not api_key:
        print("❌ Erro: Variável MISTRAL_API_KEY não encontrada no ambiente.")
        return

    with open("log_debug_ia.txt", "w", encoding="utf-8") as log:
        log.write("INICIANDO PROCESSAMENTO COM MISTRAL SDK\n")

    pastas = sorted(glob.glob(f"{base_dir}/*/"))
    
    for pasta in pastas:
        nome_prova = os.path.basename(pasta.rstrip("/"))
        questoes_path = os.path.join(pasta, "questoes.json")
        
        if not os.path.exists(questoes_path): continue
            
        with open(questoes_path, 'r', encoding='utf-8') as f:
            questoes_atuais = json.load(f)

        # Só processa se houver questões sem o campo 'correta'
        if all("correta" in q for q in questoes_atuais):
            print(f"⏩ {nome_prova} já preenchido.")
            continue

        pdf_gabarito = next((os.path.join(pasta, f) for f in os.listdir(pasta) 
                             if "gabarito" in f.lower() and f.endswith(".pdf")), None)
        
        if pdf_gabarito:
            print(f"🚀 Mistral (Cloud) analisando: {nome_prova}...")
            try:
                with pdfplumber.open(pdf_gabarito) as pdf:
                    # Enviamos as 3 primeiras páginas para garantir contexto
                    texto = "\n".join(p.extract_text() or "" for p in pdf.pages[:3])
                
                gabarito_map = pedir_gabarito_ia(texto, nome_prova, pasta)
                
                if gabarito_map:
                    count = 0
                    for q in questoes_atuais:
                        num = str(q.get("numero"))
                        if num in gabarito_map:
                            q["correta"] = str(gabarito_map[num]).upper()
                            count += 1
                    
                    with open(questoes_path, 'w', encoding='utf-8') as f:
                        json.dump(questoes_atuais, f, ensure_ascii=False, indent=2)
                    print(f"✅ {nome_prova}: {count} questões salvas.")
                else:
                    print(f"⚠️ Falha na extração. Olhe o log_debug_ia.txt")
            
            except Exception as e:
                print(f"💥 Erro no PDF {nome_prova}: {e}")

if __name__ == "__main__":
    processar_com_ia()