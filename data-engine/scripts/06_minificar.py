"""
06 - Minificar
Minifica o gcm_data.json para gcm_data.min.json (frontend).
Uso: python 06_minificar.py
"""
import os
import json

DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIGEM = os.path.join(os.path.dirname(DATA_DIR), 'gcm_data.json')
DESTINO = os.path.join(DATA_DIR, '../../frontend/public/', 'gcm_data.min.json')


def minificar():
    if not os.path.exists(ORIGEM):
        print(f"❌ Arquivo não encontrado: {ORIGEM}")
        return

    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)

    with open(ORIGEM, 'r', encoding='utf-8') as f:
        data = json.load(f)

    with open(DESTINO, 'w', encoding='utf-8') as f:
        json.dump(data, f, separators=(',', ':'), ensure_ascii=False)

    size_orig = os.path.getsize(ORIGEM) / (1024 * 1024)
    size_dest = os.path.getsize(DESTINO) / (1024 * 1024)
    print(f"✅ Minificação: {size_orig:.2f}MB -> {size_dest:.2f}MB")


if __name__ == "__main__":
    minificar()
