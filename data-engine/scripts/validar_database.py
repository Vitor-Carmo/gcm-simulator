import json

def validar_database(arquivo="gcm_data.json"):
    try:
        with open(arquivo, 'r', encoding='utf-8') as f:
            db = json.load(f)
        
        print(f"📊 Relatório de Integridade - {arquivo}")
        print(f"Total de Provas: {len(db)}")
        
        erros = []
        for i, prova in enumerate(db):
            p_id = prova.get("id", f"Sem ID (Index {i})")
            
            # 1. Verifica chaves principais
            for chave in ["metadata", "questoes", "contextos"]:
                if chave not in prova:
                    erros.append(f"❌ {p_id}: Chave '{chave}' ausente.")
            
            # 2. Verifica questões
            questoes = prova.get("questoes", [])
            if not questoes:
                erros.append(f"⚠️ {p_id}: Lista de questões vazia.")
            else:
                # Teste amostral na primeira questão
                q1 = questoes[0]
                chaves_q = ["n", "txt", "opts", "res"]
                for cq in chaves_q:
                    if cq not in q1:
                        erros.append(f"❌ {p_id} (Q1): Chave '{cq}' faltando na questão.")

        if not erros:
            print("✅ Tudo limpo! A estrutura está 100% correta.")
        else:
            print(f"\n🔍 Foram encontrados {len(erros)} alertas:")
            for e in erros[:10]: # Mostra os 10 primeiros
                print(e)

    except Exception as e:
        print(f"💥 Erro crítico ao ler o JSON: {e}")

if __name__ == "__main__":
    validar_database()