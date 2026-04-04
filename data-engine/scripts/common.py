# Common configuration and utilities for all pipeline scripts
import os
import json
from dotenv import load_dotenv

# Load .env file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(BASE_DIR)
load_dotenv(os.path.join(DATA_DIR, '.env'))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, '..'))
RAW_PROVAS_DIR = os.path.join(DATA_DIR, '..', 'provas')
CDN_DIR = os.path.join(DATA_DIR, '..', 'gcm-simulator-provas-cdn')

def get_pasta_prova(pasta_path):
    """Retorna info básica de uma pasta de prova"""
    nome = os.path.basename(pasta_path)
    meta_path = os.path.join(pasta_path, f"{nome}.json")

    if os.path.exists(meta_path):
        with open(meta_path, 'r', encoding='utf-8') as f:
            meta = json.load(f)
        return meta

    return None

def list_provas():
    """Lista todas as pastas de prova em raw-provas"""
    if not os.path.exists(RAW_PROVAS_DIR):
        return []
    return sorted([d for d in os.listdir(RAW_PROVAS_DIR)
                   if os.path.isdir(os.path.join(RAW_PROVAS_DIR, d))])

def get_pdf_prova(pasta_path):
    """Retorna o caminho do PDF da prova (não gabarito)"""
    for f in os.listdir(pasta_path):
        if f.lower().endswith('.pdf') and 'gabarito' not in f.lower():
            return os.path.join(pasta_path, f)
    return None

def get_pdf_gabarito(pasta_path):
    """Retorna o caminho do PDF do gabarito"""
    for f in os.listdir(pasta_path):
        if f.lower().endswith('.pdf') and 'gabarito' in f.lower():
            return os.path.join(pasta_path, f)
    return None
