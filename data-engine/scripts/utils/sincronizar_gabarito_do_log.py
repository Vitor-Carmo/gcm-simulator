import os
import json
import re

def sincronizar_do_log(caminho_log="log_debug_ia.txt"):
    if not os.path.exists(caminho_log):
        print(f"❌ Arquivo {caminho_log} não encontrado!")
        return

    with open(caminho_log, "r", encoding="utf-8") as f:
        conteudo_log = f.read()

    # 1. Separar as entradas pelos divisores de '='
    # A regex busca os blocos entre as linhas de '='
    blocos = re.split(r'={10,}', conteudo_log)
    
    sucessos = 0
    erros = 0

    for bloco in blocos:
        if "PASTA:" not in bloco or "RESPOSTA:" not in bloco:
            continue

        try:
            # 2. Extrair o caminho da pasta
            # Pega o que está entre 'PASTA: ' e a quebra de linha
            match_pasta = re.search(r'PASTA:\s*(.*)', bloco)
            if not match_pasta: continue
            
            caminho_pasta = match_pasta.group(1).strip()
            
            # 3. Extrair o JSON da resposta
            # Pega o que está entre as tags de código ```json e ``` ou entre chaves { }
            match_json = re.search(r'(\{.*?\})', bloco, re.DOTALL)
            if not match_json:
                print(f"⚠️ JSON não encontrado no bloco da pasta: {caminho_pasta}")
                continue
            
            gabarito_map = json.loads(match_json.group(1))
            
            # 4. Localizar o arquivo questoes.json naquela pasta
            questoes_path = os.path.join(caminho_pasta, "questoes.json")
            
            if os.path.exists(questoes_path):
                with open(questoes_path, 'r', encoding='utf-8') as f_q:
                    questoes_atuais = json.load(f_q)

                # 5. Injetar a resposta correta
                count_atualizado = 0
                for questao in questoes_atuais:
                    num = str(questao.get("numero"))
                    if num in gabarito_map:
                        questao["correta"] = str(gabarito_map[num]).upper()
                        count_atualizado += 1
                
                # Salvar de volta
                with open(questoes_path, 'w', encoding='utf-8') as f_w:
                    json.dump(questoes_atuais, f_w, ensure_ascii=False, indent=2)
                
                print(f"✅ {caminho_pasta}: {count_atualizado} questões atualizadas.")
                sucessos += 1
            else:
                print(f"❌ Arquivo não encontrado: {questoes_path}")
                erros += 1

        except Exception as e:
            print(f"💥 Erro ao processar bloco: {e}")
            erros += 1

    print(f"\n--- RELATÓRIO FINAL ---")
    print(f"Provas sincronizadas: {sucessos}")
    print(f"Falhas: {erros}")

if __name__ == "__main__":
    sincronizar_do_log()