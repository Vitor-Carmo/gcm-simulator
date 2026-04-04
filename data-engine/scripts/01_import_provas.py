"""
01 - Importar Provas
Scrapes PCI Concursos e baixa os PDFs das provas.
Uso: python 01_import_provas.py [page_count]
     python 01_import_provas.py --single "url_da_prova"
"""
import requests
from bs4 import BeautifulSoup
import os
import json
import time
import sys
import re
from common import RAW_PROVAS_DIR

BASE_URL = "https://www.pciconcursos.com.br"
LIST_URL = "/provas/guarda-civil-sp"
OUTPUT_DIR = RAW_PROVAS_DIR

os.makedirs(OUTPUT_DIR, exist_ok=True)

headers = {"User-Agent": "Mozilla/5.0"}


def limpar_nome(texto):
    texto = texto.lower()
    texto = re.sub(r'[^\w\s-]', '', texto)
    texto = texto.replace(" ", "_")
    return texto


def gerar_nome_base(data):
    partes = [data.get("cargo", ""), data.get("orgao", ""),
              data.get("ano", ""), data.get("banca", "")]
    return "_".join([limpar_nome(p) for p in partes if p])


def get_lista_provas(page_limit=None):
    provas = []
    page = 0

    while True:
        if page_limit and page >= page_limit:
            break

        url = f"{BASE_URL}{LIST_URL}/{page}" if page > 0 else f"{BASE_URL}{LIST_URL}"
        print(f"🔍 Busca: {url}")

        res = requests.get(url, headers=headers)
        soup = BeautifulSoup(res.text, "html.parser")
        rows = soup.select("#lista_provas tr.lk_link")

        if not rows:
            print("   Fim das páginas.")
            break

        for row in rows:
            link = row.get("data-url")
            if link:
                provas.append(link)

        page += 1

    return provas


def parse_pagina_prova(url):
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")
    data = {}

    for li in soup.select(".card-body li"):
        text = li.get_text(strip=True)
        if "Cargo:" in text: data["cargo"] = text.replace("Cargo:", "").strip()
        elif "Ano:" in text: data["ano"] = text.replace("Ano:", "").strip()
        elif "Órgão:" in text: data["orgao"] = text.replace("Órgão:", "").strip()
        elif "Organizadora:" in text: data["banca"] = text.replace("Organizadora:", "").strip()

    # PDFs (visualizar - ordem: 1°=prova, 2°=gabarito)
    pdf_items = soup.select(".pdf-item a.item-link")

    if len(pdf_items) >= 1:
        data["prova_pdf"] = pdf_items[0].get("data-pdf-share") or pdf_items[0].get("href")
    if len(pdf_items) >= 2:
        data["gabarito_pdf"] = pdf_items[1].get("data-pdf-share") or pdf_items[1].get("href")

    data["source_url"] = url
    return data


def download_file(url, path):
    if not url:
        return False
    if os.path.exists(path):
        print(f"   Já existe: {os.path.basename(path)}")
        return True

    try:
        res = requests.get(url, headers=headers, timeout=15)
        with open(path, "wb") as f:
            f.write(res.content)
        print(f"   ✅ Baixado: {os.path.basename(path)}")
        return True
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return False


def processar_prova(url, index):
    print(f"\n📥 {url}")
    data = parse_pagina_prova(url)
    nome_base = gerar_nome_base(data)

    if not nome_base:
        print("   Pulando (nome inválido)...")
        return

    prefixo = str(index).zfill(3)
    nome_final = f"{prefixo}_{nome_base}"
    pasta = os.path.join(OUTPUT_DIR, nome_final)
    os.makedirs(pasta, exist_ok=True)

    prova_path = os.path.join(pasta, f"{nome_final}_prova.pdf")
    gabarito_path = os.path.join(pasta, f"{nome_final}_gabarito.pdf")

    download_file(data.get("prova_pdf"), prova_path)
    download_file(data.get("gabarito_pdf"), gabarito_path)

    data["nome_base"] = nome_final
    json_path = os.path.join(pasta, f"{nome_final}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    time.sleep(1)


def main():
    if "--single" in sys.argv:
        idx = sys.argv.index("--single")
        url = sys.argv[idx + 1] if idx + 1 < len(sys.argv) else None
        if url:
            processar_prova(url, 999)
        return

    page_limit = None
    if len(sys.argv) > 1:
        try:
            page_limit = int(sys.argv[1])
        except:
            pass

    provas = get_lista_provas(page_limit)
    print(f"\n📦 {len(provas)} provas encontradas.\n")

    for i, url in enumerate(provas, start=1):
        try:
            processar_prova(url, i)
        except Exception as e:
            print(f"❌ Erro em {url}: {e}")


if __name__ == "__main__":
    main()
