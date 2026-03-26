import json
import os
import glob

def limpar_gabaritos_errados(base_dir="provas"):
    # Busca todas as pastas dentro de 'provas'
    pastas = sorted(glob.glob(os.path.join(base_dir, "*", "")))
    
    for pasta in pastas:
        questoes_path = os.path.join(pasta, "questoes.json")
        if os.path.exists(questoes_path):
            with open(questoes_path, 'r', encoding='utf-8') as f:
                try:
                    questoes = json.load(f)
                except json.JSONDecodeError:
                    print(f"⚠️ Erro ao ler JSON em: {pasta}")
                    continue
            
            # Remove o campo 'correta' se ele existir
            for q in questoes:
                q.pop("correta", None)
            
            with open(questoes_path, 'w', encoding='utf-8') as f:
                json.dump(questoes, f, ensure_ascii=False, indent=2)
            
            print(f"🧹 Limpo: {os.path.basename(os.path.normpath(pasta))}")

if __name__ == "__main__":
    limpar_gabaritos_errados()