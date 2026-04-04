"""
07 - Sync CDN
Sincroniza os PDFs das provas para o diretório CDN.
Uso: python 07_sync_cdn.py
"""
import os
import shutil
from common import RAW_PROVAS_DIR, CDN_DIR


def sync_cdn():
    if not os.path.exists(RAW_PROVAS_DIR):
        print(f"❌ Origem não encontrada: {RAW_PROVAS_DIR}")
        return

    os.makedirs(CDN_DIR, exist_ok=True)

    pastas = [d for d in os.listdir(RAW_PROVAS_DIR)
              if os.path.isdir(os.path.join(RAW_PROVAS_DIR, d))]

    print(f"📦 Sincronizando {len(pastas)} provas para CDN...\n")

    for pasta in pastas:
        pasta_path = os.path.join(RAW_PROVAS_DIR, pasta)

        # Encontra PDF (não gabarito)
        pdf_file = None
        for f in os.listdir(pasta_path):
            if f.lower().endswith('.pdf') and 'gabarito' not in f.lower():
                pdf_file = f
                break

        if not pdf_file:
            print(f"⚠️ PDF não encontrado: {pasta}")
            continue

        origem = os.path.join(pasta_path, pdf_file)
        destino = os.path.join(CDN_DIR, f"{pasta}.pdf")

        shutil.copy2(origem, destino)
        print(f"   ✅ {pasta}.pdf")

    print(f"\n✨ CDN sync concluído!")


if __name__ == "__main__":
    sync_cdn()
