import requests
from bs4 import BeautifulSoup
import os
import json
import re
import time

BASE_URL = "https://www.pciconcursos.com.br"
LIST_URL = "/provas/guarda-civil-sp"

OUTPUT_DIR = "provas"

os.makedirs(OUTPUT_DIR, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0"
}


def limpar_nome(texto):
    texto = texto.lower()
    texto = re.sub(r'[^\w\s-]', '', texto)
    texto = texto.replace(" ", "_")
    return texto


def gerar_nome_base(data):
    partes = [
        data.get("cargo", ""),
        data.get("orgao", ""),
        data.get("ano", ""),
        data.get("banca", "")
    ]

    nome = "_".join([limpar_nome(p) for p in partes if p])
    return nome


def get_lista_provas():
    provas = []
    page = 1

    while True:
        if page == 0:
            url = BASE_URL + LIST_URL
        else:
            url = f"{BASE_URL}{LIST_URL}/{page}"

        print(f"Buscando página: {url}")

        res = requests.get(url, headers=headers)

        soup = BeautifulSoup(res.text, "html.parser")

        rows = soup.select("#lista_provas tr.lk_link")

        # 🔥 condição de parada
        if not rows:
            print("Não há mais páginas. Parando...")
            break

        for row in rows:
            link = row.get("data-url")
            if link:
                provas.append(link)

        page += 1

    return provas


def save_HTML_response(file, content):
    with open(file, "w", encoding="utf-8") as f:
        f.write(str(content))


def parse_pagina_prova(url):
    res = requests.get(url, headers=headers)
    soup = BeautifulSoup(res.text, "html.parser")

    data = {}


    # infos básicas
    for li in soup.select(".card-body li"):
        text = li.get_text(strip=True)

        if "Cargo:" in text:
            data["cargo"] = text.replace("Cargo:", "").strip()

        elif "Ano:" in text:
            data["ano"] = text.replace("Ano:", "").strip()

        elif "Órgão:" in text:
            data["orgao"] = text.replace("Órgão:", "").strip()

        elif "Organizadora:" in text:
            data["banca"] = text.replace("Organizadora:", "").strip()

    # PDFs (download OU visualizar)
    pdfs = soup.select(".pdf-item a.item-link")

    prova_pdf = None
    gabarito_pdf = None

    for pdf in pdfs:
        href = pdf.get("data-pdf-share")
        nome = pdf.get_text().lower()

        if "gabarito" in nome:
            gabarito_pdf = href
        else:
            prova_pdf = href

    data["prova_pdf"] = prova_pdf
    data["gabarito_pdf"] = gabarito_pdf

    return data


def download_file(url, path):
    if not url:
        return

    if os.path.exists(path):
        print(f"Já existe: {path}")
        return

    res = requests.get(url, headers=headers, timeout=15)

    with open(path, "wb") as f:
        f.write(res.content)


def processar_prova(url, index):
    print(f"Processando: {url}")

    data = parse_pagina_prova(url)

    nome_base = gerar_nome_base(data)

    if not nome_base:
        print("Nome inválido, pulando...")
        return

    # 🔥 numeração com zero à esquerda
    prefixo = str(index).zfill(3)

    nome_final = f"{prefixo}_{nome_base}"

    pasta = os.path.join(OUTPUT_DIR, nome_final)
    os.makedirs(pasta, exist_ok=True)

    prova_path = os.path.join(pasta, f"{nome_final}_prova.pdf")
    gabarito_path = os.path.join(pasta, f"{nome_final}_gabarito.pdf")

    download_file(data.get("prova_pdf"), prova_path)
    download_file(data.get("gabarito_pdf"), gabarito_path)

    data["nome_base"] = nome_final
    data["source_url"] = url

    json_path = os.path.join(pasta, f"{nome_final}.json")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    time.sleep(1)


def main():
    provas = get_lista_provas()

    for i, url in enumerate(provas, start=1):
        try:
            processar_prova(url, i)
        except Exception as e:
            print(f"Erro em {url}: {e}")


if __name__ == "__main__":
    main()