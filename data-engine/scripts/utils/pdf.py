import pdfplumber
import os
import json

def extrair_texto_contexto(caminho_pdf, paginas_limite=5):
    """
    Extrai o texto das primeiras páginas do PDF para busca de textos de apoio.
    """
    texto_acumulado = ""
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            # GCM costuma ter textos de apoio nas primeiras 5 páginas
            for i in range(min(paginas_limite, len(pdf.pages))):
                page = pdf.pages[i]
                texto_acumulado += f"\n--- PÁGINA {i+1} ---\n"
                texto_acumulado += page.extract_text()
        return texto_acumulado
    except Exception as e:
        return f"Erro ao ler PDF: {e}"

def preparar_contextos():
    base_dir = "provas"
    # Pega apenas as pastas que você já processou ou está processando
    pastas = sorted([d for d in os.listdir(base_dir) if os.path.isdir(os.path.join(base_dir, d))])

    for pasta in pastas:
        caminho_pasta = os.path.join(base_dir, pasta)
        pdf_files = [f for f in os.listdir(caminho_pasta) if f.endswith('.pdf') and "gabarito" not in f.lower() ]
        
        if not pdf_files:
            continue
            
        pdf_path = os.path.join(caminho_pasta, pdf_files[0])
        print(f"📖 Lendo: {pasta}")
        
        texto = extrair_texto_contexto(pdf_path)
        
        # Salva um arquivo .txt temporário para você copiar e colar na IA
        with open(os.path.join(caminho_pasta, "texto_bruto_para_contexto.txt"), "w", encoding="utf-8") as f:
            f.write(texto)
            
    print("\n✅ Arquivos 'texto_bruto_para_contexto.txt' gerados em cada pasta!")

if __name__ == "__main__":
    preparar_contextos()