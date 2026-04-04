"""
RUN PIPELINE - Executa toda a pipeline de uma vez
Uso: python run_pipeline.py [passo_inicial] [passo_final]
     python run_pipeline.py        # executa tudo
     python run_pipeline.py 1 5    # de 01 a 05
     python run_pipeline.py 5 7    # só finalização (banco + minify + cdn)
"""
import subprocess
import sys
import os

SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))

# Definição dos passos da pipeline
STEPS = [
    ("01 - Importar Provas (Scraping)", "01_import_provas.py"),
    ("02 - Extrair Questões (Mistral)", "02_extrair_questoes.py"),
    ("03 - Minerar Gabarito (Mistral)", "03_minerar_gabarito.py"),
    ("04 - Minerar Contextos (Mistral)", "04_minerar_contextos.py"),
    ("05 - Gerar Banco gcm_data.json", "05_gerar_banco.py"),
    ("05b - Normalizar com IA (Mistral)", "05b_normalizar.py"),
    ("05c - Aplicar Normalização", "05c_aplicar_normalizacao.py"),
    ("06 - Minificar para Frontend", "06_minificar.py"),
    ("07 - Sync CDN", "07_sync_cdn.py"),
]


def run_step(step_idx, script_name):
    script_path = os.path.join(SCRIPTS_DIR, script_name)
    print(f"\n{'='*60}")
    print(f"▶ Executando: {step_idx}. {STEPS[step_idx-1][0]}")
    print(f"{'='*60}\n")

    python_path = os.path.join(SCRIPTS_DIR, '..', '..', 'venv', 'bin', 'python')
    result = subprocess.run([python_path, script_path], cwd=SCRIPTS_DIR)
    return result.returncode == 0


def main():
    start = 1
    end = len(STEPS)

    if len(sys.argv) > 1:
        try:
            start = int(sys.argv[1])
        except:
            pass
    if len(sys.argv) > 2:
        try:
            end = int(sys.argv[2])
        except:
            pass

    print(f"🚀 Pipeline: passos {start} a {end}")
    print(f"📦 {STEPS[end-1][0]}\n")

    for i in range(start, end + 1):
        ok = run_step(i, STEPS[i-1][1])
        if not ok:
            print(f"\n❌ Pipeline parou no passo {i}")
            sys.exit(1)

    print(f"\n✨ Pipeline concluído com sucesso!")


if __name__ == "__main__":
    main()
