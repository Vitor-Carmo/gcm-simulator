import os
import sys
import json
import logging
import pdfplumber
import ollama
from datetime import datetime
import time

# =========================
# CONFIGURAÇÃO DE LOGS (Estilo Laravel/Clean)
# =========================
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("urllib3").setLevel(logging.WARNING)

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] local.INFO: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler("processamento_gcm.log", encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

# =========================
# CONFIGURAÇÃO MODELO
# =========================
MODEL_NAME = "minimax-m2.7:cloud"

def montar_prompt(texto_bloco):
    return f"""
    Extraia as questões do texto abaixo para uma lista JSON.
    FORMATO: [{{"numero": int, "pergunta": str, "alternativas": {{"A": str, "B": str, "C": str, "D": str, "E": str}}, "categoria": str, "pagina": int}}]
    REGRAS: 
    - Retorne APENAS o JSON puro, sem explicações.
    - Se não houver 5 alternativas, preencha com null.
    - Tente inferir a categoria (Português, Matemática, etc).
    TEXTO:
    {texto_bloco}
    """

def chamar_ollama(chunk):
    """Versão com Espera Inteligente para evitar o 429"""
    while True: # Tenta até conseguir
        try:
            response = ollama.generate(
                model=MODEL_NAME,
                prompt=montar_prompt(chunk),
                format='json',
                options={'temperature': 0.0}
            )
            return json.loads(response['response'])
        except Exception as e:
            if "429" in str(e) or "too many concurrent requests" in str(e).lower():
                logging.warning("   ⏳ Limite atingido (429). Dormindo 15s para recuperar fôlego...")
                time.sleep(15) # Dá um tempo pro servidor respirar
                continue # Tenta a MESMA página de novo
            else:
                logging.error(f"   ⚠️ Erro crítico: {e}")
                return []

def extrair_imagens_da_pagina(page, num_pagina, pasta_path):
    """Salva imagens da página em uma pasta local."""
    img_dir = os.path.join(pasta_path, "images")
    os.makedirs(img_dir, exist_ok=True)
    
    imagens_encontradas = False
    for j, image in enumerate(page.images):
        try:
            img_name = f"pg_{num_pagina}_img_{j+1}.png"
            img_path = os.path.join(img_dir, img_name)
            
            # Recorta e salva a imagem
            bbox = (image["x0"], image["top"], image["x1"], image["bottom"])
            page.within_bbox(bbox).to_image().save(img_path)
            imagens_encontradas = True
        except:
            continue
    return imagens_encontradas

def processar_pasta(pasta_path):
    nome_pasta = os.path.basename(pasta_path)
    logging.info(f"📂 Iniciando: {nome_pasta}")

    arquivos = os.listdir(pasta_path)
    prova_pdf = next((os.path.join(pasta_path, f) for f in arquivos if f.endswith(".pdf") and "gabarito" not in f.lower()), None)
    
    if not prova_pdf:
        logging.warning(f"   ❌ PDF não encontrado em {nome_pasta}")
        return

    # 1. Carregar questões já processadas (State Check)
    output_json = os.path.join(pasta_path, "questoes.json")
    todas_questoes = []
    paginas_concluidas = set()

    if os.path.exists(output_json):
        try:
            with open(output_json, "r", encoding="utf-8") as f:
                todas_questoes = json.load(f)
                paginas_concluidas = {q.get("pagina") for q in todas_questoes}
                logging.info(f"   ✅ {len(todas_questoes)} questões já existem. Retomando...")
        except:
            todas_questoes = []

    # 2. Abrir PDF e processar por página
    with pdfplumber.open(prova_pdf) as pdf:
        total_paginas = len(pdf.pages)
        
        for i, page in enumerate(pdf.pages):
            num_pagina = i + 1
            
            # Pula se a página já estiver no arquivo
            if num_pagina in paginas_concluidas:
                continue

            logging.info(f"   📄 Processando pág {num_pagina}/{total_paginas} de {nome_pasta}...")
            
            # Extrair Imagens (Associação visual posterior)
            tem_img = extrair_imagens_da_pagina(page, num_pagina, pasta_path)
            
            texto_pag = page.extract_text() or ""
            if not texto_pag.strip():
                continue

            # Chama a IA para a página atual
            res = chamar_ollama(texto_pag)
            
            if res:
                for q in res:
                    q['pagina'] = num_pagina
                    if tem_img: q['possui_imagem'] = True
                
                todas_questoes.extend(res)
                
                # Salva incrementalmente (APPEND MODE)
                with open(output_json, "w", encoding="utf-8") as f:
                    json.dump(todas_questoes, f, ensure_ascii=False, indent=2)
                logging.info(f"   ✨ Pág {num_pagina} salva! (+{len(res)} questões)")

    logging.info(f"   🏁 Finalizado: {nome_pasta}")

if __name__ == "__main__":
    BASE = "provas" 
    todas_pastas = sorted([os.path.join(BASE, d) for d in os.listdir(BASE) if os.path.isdir(os.path.join(BASE, d))])
    
    # Lógica de Range para Terminais em Paralelo
    if len(sys.argv) > 2:
        inicio = int(sys.argv[1])
        fim = int(sys.argv[2])
        pastas_para_processar = todas_pastas[inicio:fim]
        logging.info(f"🚀 MODO PARALELO ATIVO: Pastas {inicio} até {fim}")
    else:
        pastas_para_processar = todas_pastas
        logging.info("🌍 MODO GLOBAL: Processando tudo")

    for p in pastas_para_processar:
        processar_pasta(p)