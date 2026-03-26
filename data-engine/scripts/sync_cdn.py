import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def sync_provas():
    # Caminhos relativos
    origem = os.path.abspath(os.path.join(BASE_DIR, '../../data-engine/raw-provas'))
    destino = os.path.abspath(os.path.join(BASE_DIR, '../../gcm-simulator-provas-cdn'))

    if not os.path.exists(origem):
        print(f"❌ Erro: Origem não encontrada: {origem}")
        return

    if not os.path.exists(destino):
        os.makedirs(destino)

    print("🚀 Sincronizando PDFs usando o nome da PASTA como ID...")
    
    contador = 0
    for root, dirs, files in os.walk(origem):
        for file in files:
            # Filtro: PDF e que NÃO seja gabarito
            if file.lower().endswith('.pdf') and "gabarito" not in file.lower():
                
                # PEGANDO O NOME DA PASTA PAI (O seu ID)
                # Ex: "001_guarda_civil_pref_paratysp_2025_avança_sp"
                nome_id_prova = os.path.basename(root)
                
                novo_nome = f"{nome_id_prova}.pdf"
                
                caminho_origem = os.path.join(root, file)
                caminho_destino = os.path.join(destino, novo_nome)
                
                # Copia mantendo o nome ID idêntico à pasta
                shutil.copy2(caminho_origem, caminho_destino)
                print(f"✅ Mapeado: {nome_id_prova} -> {novo_nome}")
                contador += 1

    print(f"\n✨ Sincronização concluída! {contador} arquivos prontos com IDs exatos.")

if __name__ == "__main__":
    sync_provas()