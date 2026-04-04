"""
05 - Gerar Banco de Dados
Consolida todas as provas processadas em gcm_data.json.
Uso: python 05_gerar_banco.py
"""
import os
import sys
import json
from common import RAW_PROVAS_DIR, list_provas

OUTPUT_FILE = os.path.join(os.path.dirname(RAW_PROVAS_DIR), 'gcm_data.json')


def gerar_banco():
    pastas = list_provas()
    banco = []

    print(f"📦 Consolidação de {len(pastas)} provas...\n")

    for pasta in pastas:
        caminho_pasta = os.path.join(RAW_PROVAS_DIR, pasta)
        f_questoes = os.path.join(caminho_pasta, "questoes.json")
        f_contextos = os.path.join(caminho_pasta, "contextos.json")
        f_meta = os.path.join(caminho_pasta, f"{pasta}.json")

        if not os.path.exists(f_questoes):
            print(f"⚠️ Pulando {pasta}: sem questoes.json")
            continue

        try:
            with open(f_questoes, 'r', encoding='utf-8') as f:
                lista_questoes = json.load(f)
            with open(f_meta, 'r', encoding='utf-8') as f:
                meta = json.load(f)

            contextos = []
            if os.path.exists(f_contextos):
                with open(f_contextos, 'r', encoding='utf-8') as f:
                    contextos = json.load(f)

            # Monta CDN URL
            cdn_url = f"https://cdn.jsdelivr.net/gh/Vitor-Carmo/gcm-simulator-provas-cdn@main/{pasta}.pdf"

            prova_obj = {
                "id": pasta,
                "metadata": {
                    "cargo": meta.get("cargo"),
                    "orgao": meta.get("orgao"),
                    "ano": meta.get("ano"),
                    "banca": meta.get("banca"),
                    "links": {
                        "pdf": meta.get("prova_pdf"),
                        "gabarito": meta.get("gabarito_pdf"),
                        "pdf_cdn": cdn_url
                    }
                },
                "contextos": contextos,
                "questoes": []
            }

            # Vincular contextos às questões
            for q in lista_questoes:
                num = q.get("numero")
                ctx_id = None
                for ctx in contextos:
                    rng = ctx.get("range_questoes", [])
                    if rng and len(rng) == 2 and rng[0] <= num <= rng[1]:
                        ctx_id = ctx.get("id_contexto")
                        break

                q_data = {
                    "n": num,
                    "ctx_id": ctx_id,
                    "txt": q.get("pergunta"),
                    "opts": q.get("alternativas"),
                    "res": q.get("correta"),
                    "cat": q.get("categoria", "Geral")
                }
                prova_obj["questoes"].append(q_data)

            banco.append(prova_obj)
            print(f"   ✅ {pasta}: {len(lista_questoes)} questões")

        except Exception as e:
            print(f"   ❌ Erro em {pasta}: {e}")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(banco, f, ensure_ascii=False, indent=2)

    print(f"\n✨ Banco gerado: {OUTPUT_FILE} ({len(banco)} provas)")


if __name__ == "__main__":
    gerar_banco()
