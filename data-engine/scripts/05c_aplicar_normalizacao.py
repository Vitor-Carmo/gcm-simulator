"""
05c - Aplicar Normalização
Renomeia gcm_data_normalizado.json -> gcm_data.json
Uso: python 05c_aplicar_normalizacao.py
"""
import os
import shutil

DATA_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NORMALIZADO = os.path.join(DATA_DIR, 'gcm_data_normalizado.json')
ORIGINAL = os.path.join(DATA_DIR, 'gcm_data.json')
BACKUP = os.path.join(DATA_DIR, 'gcm_data_backup.json')


def aplicar():
    if not os.path.exists(NORMALIZADO):
        print(f"❌ Arquivo normalizado não encontrado: {NORMALIZADO}")
        return

    # Backup do original
    if os.path.exists(ORIGINAL):
        shutil.copy2(ORIGINAL, BACKUP)
        print(f"   📦 Backup feito: gcm_data_backup.json")

    # Renomeia
    os.rename(NORMALIZADO, ORIGINAL)
    print(f"   ✅ gcm_data_normalizado.json -> gcm_data.json")


if __name__ == "__main__":
    aplicar()
