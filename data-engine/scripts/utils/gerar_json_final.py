import os
import json

def gerar_banco_unico(diretorio_base="provas", arquivo_saida="db_simulado.json"):
    pastas = sorted([d for d in os.listdir(diretorio_base) if os.path.isdir(os.path.join(diretorio_base, d))])
    
    banco_global = []
    
    print(f"📦 Iniciando consolidação de {len(pastas)} provas...")

    for pasta in pastas:
        caminho_pasta = os.path.join(diretorio_base, pasta)
        
        # Arquivos necessários
        f_questoes = os.path.join(caminho_pasta, "questoes.json")
        f_contextos = os.path.join(caminho_pasta, "context.json")
        f_meta = os.path.join(caminho_pasta, f"{pasta}.json")

        # Verifica se os arquivos básicos existem
        if not (os.path.exists(f_questoes) and os.path.exists(f_meta)):
            print(f"⚠️ Pulando {pasta}: faltando arquivos essenciais.")
            continue

        try:
            # 1. Carregar Dados
            with open(f_questoes, 'r', encoding='utf-8') as f:
                lista_questoes = json.load(f)
            
            with open(f_meta, 'r', encoding='utf-8') as f:
                meta = json.load(f)

            lista_contextos = []
            if os.path.exists(f_contextos):
                with open(f_contextos, 'r', encoding='utf-8') as f:
                    lista_contextos = json.load(f)

            # 2. Montar Objeto da Prova
            prova_obj = {
                "id": pasta,
                "metadata": {
                    "cargo": meta.get("cargo"),
                    "orgao": meta.get("orgao"),
                    "ano": meta.get("ano"),
                    "banca": meta.get("banca"),
                    "links": {
                        "pdf": meta.get("prova_pdf"),
                        "gabarito": meta.get("gabarito_pdf")
                    }
                },
                "contextos": lista_contextos,
                "questoes": []
            }

            # 3. Vincular Contextos e Questões
            for q in lista_questoes:
                num = q.get("numero")
                
                # Procura vínculo com texto de apoio
                id_vinc = None
                for ctx in lista_contextos:
                    rng = ctx.get("range_questoes", [])
                    if rng and len(rng) == 2 and rng[0] <= num <= rng[1]:
                        id_vinc = ctx.get("id_contexto")
                        break
                
                # Limpa a questão para o banco global
                q_data = {
                    "n": num,
                    "ctx_id": id_vinc,
                    "txt": q.get("pergunta"),
                    "opts": q.get("alternativas"),
                    "res": q.get("correta"),
                    "cat": q.get("categoria", "Geral")
                }
                prova_obj["questoes"].append(q_data)

            # 4. Adiciona ao Array Global
            banco_global.append(prova_obj)
            print(f"  ✅ {pasta} adicionada.")

        except Exception as e:
            print(f"  ❌ Erro em {pasta}: {e}")

    # 5. Salva o Arquivão Final
    with open(arquivo_saida, 'w', encoding='utf-8') as f:
        json.dump(banco_global, f, ensure_ascii=False, indent=2)

    print(f"\n✨ Pronto! Banco de dados gerado com {len(banco_global)} provas em '{arquivo_saida}'.")

if __name__ == "__main__":
    gerar_banco_unico()