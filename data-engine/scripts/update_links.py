import json
import os
from urllib.parse import quote

# Configurações do seu CDN
USER = "Vitor-Carmo"
REPO = "gcm-simulator-provas-cdn"
BRANCH = "main"
BASE_CDN_URL = f"https://cdn.jsdelivr.net/gh/{USER}/{REPO}@{BRANCH}"

def update_json_links():
    # Caminho para o seu arquivo de dados principal
    json_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../gcm_data.json'))
    
    if not os.path.exists(json_path):
        print(f"❌ Arquivo não encontrado: {json_path}")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    print(f"🔄 Atualizando links para {len(data)} provas...")

    for prova in data:
        prova_id = prova.get("id")
        if prova_id:
            # O quote() garante que caracteres como 'ç' e 'ã' virem '%C3%A7', etc.
            # Mas o jsDelivr aceita o link direto se o navegador codificar. 
            # Vamos salvar o link limpo e deixar o browser lidar com o encode.
            pdf_filename = f"{prova_id}.pdf"
            cdn_link = f"{BASE_CDN_URL}/{pdf_filename}"
            
            # Atualiza ou cria a estrutura de links
            if "metadata" not in prova:
                prova["metadata"] = {}
            
            if "links" not in prova["metadata"]:
                prova["metadata"]["links"] = {}

            # Sobrescreve o link antigo do PCI pelo seu novo CDN
            prova["metadata"]["links"]["pdf_cdn"] = cdn_link
            print(f"✅ Link gerado para: {prova_id}")

    # Salva o arquivo atualizado
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"\n✨ Sucesso! O arquivo gcm_data.json foi atualizado.")

if __name__ == "__main__":
    update_json_links()