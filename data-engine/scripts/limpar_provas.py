import os
import shutil
import re

def limpar_provas(diretorio="provas"):
    pastas = os.listdir(diretorio)
    vistas = {} # Para rastrear nomes sem o prefixo numérico
    removidas = 0

    # Padrões de nomes que você NÃO quer
    termos_proibidos = ["patrimonial", "inspetor"]

    for pasta in sorted(pastas):
        caminho_completo = os.path.join(diretorio, pasta)
        
        # 1. Limpeza por nome de cargo (Patrimonial/Inspetor)
        if any(termo in pasta.lower() for termo in termos_proibidos):
            print(f"🗑️ Removendo cargo irrelevante: {pasta}")
            shutil.rmtree(caminho_completo)
            removidas += 1
            continue

        # 2. Limpeza por duplicata (Ignora o 001_, 002_)
        # Pega apenas a parte após o primeiro '_'
        nome_base = "_".join(pasta.split("_")[1:])
        
        if nome_base in vistas:
            print(f"👯 Removendo duplicata: {pasta} (Já existe como {vistas[nome_base]})")
            shutil.rmtree(caminho_completo)
            removidas += 1
        else:
            vistas[nome_base] = pasta

    print(f"\n✨ Limpeza concluída! {removidas} pastas removidas.")

if __name__ == "__main__":
    limpar_provas()