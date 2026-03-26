import fitz  # PyMuPDF
import json
import os
import re

# --- CAMINHOS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Ajuste se o JSON estiver na raiz ou em frontend/public
JSON_PATH = os.path.abspath(os.path.join(BASE_DIR, '../../gcm_data.json'))
RAW_PROVAS_DIR = os.path.abspath(os.path.join(BASE_DIR, '../raw-provas'))

def limpar_texto_busca(texto):
    if not texto: return ""
    # Remove o número da questão se vier no início do texto (ex: "1. ", "01 -")
    texto = re.sub(r'^\d+[\.\s\-–]+', '', texto)
    # Remove quebras de linha e espaços extras
    texto = " ".join(texto.split())
    # Pega os primeiros 50 caracteres (mais chance de match sem quebrar)
    return texto[:50].strip()

def main():
    if not os.path.exists(JSON_PATH):
        print(f"❌ JSON não encontrado: {JSON_PATH}")
        return

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"🚀 Iniciando mapeamento em {len(data)} provas...")

    alteracoes = 0
    for prova in data:
        id_prova = prova.get("id")
        # Caminho da pasta: raw-provas/001_...
        caminho_pasta = os.path.join(RAW_PROVAS_DIR, id_prova)
        
        if not os.path.exists(caminho_pasta):
            print(f"⚠️ Pasta não encontrada para ID: {id_prova}")
            continue

        # Localiza o PDF da prova (ignora gabarito)
        pdf_file = next((f for f in os.listdir(caminho_pasta) if f.lower().endswith('.pdf') and 'gabarito' not in f.lower()), None)
        
        if not pdf_file:
            print(f"⚠️ PDF não encontrado em: {id_prova}")
            continue

        pdf_path = os.path.join(caminho_pasta, pdf_file)
        print(f"📄 Abrindo: {pdf_file}")

        try:
            doc = fitz.open(pdf_path)
            
            # Mapear contextos (Textos de Apoio)
            for ctx in prova.get("contextos", []):
                busca_ctx = limpar_texto_busca(ctx.get("titulo", "")) or limpar_texto_busca(ctx.get("conteudo", ""))[:40]
                if busca_ctx:
                    for page in doc:
                        if page.search_for(busca_ctx):
                            ctx["pagina"] = page.number + 1
                            break

            # Mapear questões
            for q in prova.get("questoes", []):
                # IMPORTANTE: No seu JSON o campo é 'txt'
                texto_busca = limpar_texto_busca(q.get("txt", ""))
                
                if not texto_busca: continue

                found = False
                for page in doc:
                    if page.search_for(texto_busca):
                        q["pagina"] = page.number + 1
                        alteracoes += 1
                        found = True
                        break
                
                # Fallback: busca mais curta se falhar
                if not found:
                    texto_curto = texto_busca[:30]
                    for page in doc:
                        if page.search_for(texto_curto):
                            q["pagina"] = page.number + 1
                            alteracoes += 1
                            break
            
            doc.close()
        except Exception as e:
            print(f"❌ Erro ao processar PDF {pdf_file}: {e}")

    if alteracoes > 0:
        with open(JSON_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"\n✅ Concluído! {alteracoes} posições de páginas injetadas no JSON.")
    else:
        print("\n零 Nada foi alterado. Verifique se o texto do 'txt' bate com o PDF.")

if __name__ == "__main__":
    main()