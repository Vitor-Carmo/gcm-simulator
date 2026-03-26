import json
import os

def minify():
    origem = 'gcm_data.json'
    destino = 'frontend/public/gcm_data.min.json'    
    
    if not os.path.exists('frontend/src/data'):
        os.makedirs('frontend/src/data')

    with open(origem, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    with open(destino, 'w', encoding='utf-8') as f:
        # separators=(',', ':') remove todos os espaços em branco
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)
    
    size_orig = os.path.getsize(origem) / (1024*1024)
    size_dest = os.path.getsize(destino) / (1024*1024)
    print(f"✅ Minificação concluída: {size_orig:.2f}MB -> {size_dest:.2f}MB")

if __name__ == "__main__":
    minify()