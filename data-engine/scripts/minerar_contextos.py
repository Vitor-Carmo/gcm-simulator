import os
import sys
import json
import time
import re
from mistralai import Mistral

# Configurações do SDK Oficial
api_key = os.environ.get("MISTRAL_API_KEY")
model = "mistral-medium-latest"
client = Mistral(api_key=api_key)

def salvar_log_ia(pasta, resposta):
    """Gera um log textual para conferência humana"""
    with open("log_contextos_ia.txt", "a", encoding="utf-8") as log:
        log.write(f"\n{'='*80}\n")
        log.write(f"PASTA: {pasta}\n")
        log.write(f"DATA/HORA: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        log.write(f"OUTPUT DA IA:\n{resposta}\n")
        log.write(f"{'='*80}\n")

def minerar_contexto_ia(texto_bruto, nome_pasta):
    # O Mistral Medium tem uma janela grande, mas 15k-20k caracteres 
    # costumam cobrir os textos de apoio e enunciados iniciais.
    
    prompt = f"""
    [INST] VOCÊ É UM ESPECIALISTA EM ESTRUTURAÇÃO DE DADOS DE CONCURSOS.
    Analise o texto da prova '{nome_pasta}' e extraia TODOS os textos de apoio.

    CRITÉRIOS:
    1. Identifique textos que servem para múltiplas questões (ex: "Leia para as questões 1 a 5").
    2. Identifique mini-contextos ou enunciados longos que servem para questões específicas.
    3. Extraia o conteúdo INTEGRAL, limpando apenas sujeiras de página (ex: "Página X de Y").
    4. O range_questoes deve ser uma lista de números [inicio, fim].
    
    
    REGRAS DE FORMATO (CRÍTICO):
    1. Retorne uma LISTA de objetos JSON.
    2. O campo "conteudo" DEVE ser uma string única.
    3. JAMAIS use quebras de linha reais (tecla Enter) dentro das strings.
    4. Use '\\n' para representar parágrafos.
    5. Não use aspas duplas dentro do texto, use aspas simples.


    RETORNE APENAS O JSON (LISTA DE OBJETOS):
    [
      {{
        "id_contexto": "{nome_pasta}_T1",
        "titulo": "Título",
        "autor": "Autor",
        "conteudo": "Texto...",
        "range_questoes": [1, 5],
        "referencia": "Fonte"
      }}
    ]

    Se não houver nenhum texto de apoio, retorne []. [/INST]

    TEXTO DA PROVA:
    {texto_bruto}
    """
    def limpar_json_sujo(content):
        # Remove espaços em branco extras nas extremidades
        content = content.strip()
        
        # Esta regex tenta encontrar quebras de linha literais dentro de strings JSON 
        # e as substitui pelo caractere escapado '\n'
        # É um "remendo" comum para saídas de IA
        def substituir_quebra(match):
            return match.group(0).replace('\n', '\\n').replace('\r', '\\r')

        # Procura por tudo que está entre aspas e aplica a substituição
        content = re.sub(r'":\s*"(.*?)"', substituir_quebra, content, flags=re.DOTALL)
        return content
    try:
        chat_response = client.chat.complete(
            model=model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        resposta_bruta = chat_response.choices[0].message.content
        
        # 🔥 GRAVA O LOG PARA VOCÊ VER O OUTPUT DA IA
        salvar_log_ia(nome_pasta, resposta_bruta)

        # Limpeza para garantir o JSON puro
        match = re.search(r'\[.*\]', resposta_bruta, re.DOTALL)
        if match:
            json_sujo = match.group(0)
            try:
                # Tenta carregar direto
                resultado = json.loads(json_sujo)
            except json.JSONDecodeError:
                # Se falhar, tenta limpar as quebras de linha literais
                try:
                    json_limpo = limpar_json_sujo(json_sujo)
                    resultado = json.loads(json_limpo)
                except Exception as e:
                    print(f"Erro fatal ao decodificar JSON: {e}")
                    resultado = []
        return resultado



    except Exception as e:
        if "429" in str(e):
            return "429"
        print(f"   ⚠️ Erro na Mistral em {nome_pasta}: {e}")
        return None

def main():
    if not api_key:
        print("❌ Defina a variável MISTRAL_API_KEY no terminal.")
        return

    BASE = "provas copy 2"
    # Reinicia o arquivo de log no começo da execução
    with open("log_contextos_ia.txt", "w", encoding="utf-8") as log:
        log.write(f"INICIANDO MINERAÇÃO DE CONTEXTOS - MODELO: {model}\n")

    todas_pastas = sorted([d for d in os.listdir(BASE) if os.path.isdir(os.path.join(BASE, d))])
    
    for pasta in todas_pastas:
        caminho_pasta = os.path.join(BASE, pasta)
        txt_input = os.path.join(caminho_pasta, "texto_bruto_para_contexto.txt")
        json_output = os.path.join(caminho_pasta, "context.json")

        if os.path.exists(txt_input):
            print(f"🔍 Analisando: {pasta}")
            
            with open(txt_input, "r", encoding="utf-8") as f:
                conteudo = f.read()

            while True:
                resultado = minerar_contexto_ia(conteudo, pasta)
                
                if resultado == "429":
                    print("   ⏳ Rate limit... esperando 20s")
                    time.sleep(20)
                    continue
                
                if resultado is not None:
                    with open(json_output, "w", encoding="utf-8") as f:
                        json.dump(resultado, f, indent=2, ensure_ascii=False)
                    print(f"   ✅ context.json salvo.")
                break
            
            time.sleep(0.5)

if __name__ == "__main__":
    main()