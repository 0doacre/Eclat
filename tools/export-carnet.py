#!/usr/bin/env python3
"""
Exporte les variantes WebP optimisées des illustrations du Carnet du Semeur (Âge du Bois)
pour l'intégration dans Éclat (Mode Vivant).
"""
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "..", "extracted-da", "da-age-bois-v1", "assets")
OUT_ITEMS = os.path.join(ROOT, "assets", "carnet", "items")
OUT_SOURCES = os.path.join(ROOT, "assets", "carnet", "sources")

os.makedirs(OUT_ITEMS, exist_ok=True)
os.makedirs(OUT_SOURCES, exist_ok=True)

ITEMS = [
    "bois", "fibre", "caillou", "manche", "corde", "panier", "archet",
    "feu", "charbon", "epieu", "cabane", "torche", "fibre_1", "caillou_1",
    "percuteur_pierre", "etabli_amenage"
]

SOURCES = [
    ("source_bois", "source_bois"),
    ("source_fibre", "source_fibre"),
    ("source_caillou", "source_caillou"),
]

total_bytes = 0

print("=== Exportation des objets (128x128 WebP alpha) ===")
for item in ITEMS:
    src_path = os.path.join(SRC_DIR, f"{item}.png")
    out_path = os.path.join(OUT_ITEMS, f"{item}.webp")
    if not os.path.exists(src_path):
        print(f"ERREUR: {src_path} introuvable !")
        sys.exit(1)
    im = Image.open(src_path).convert("RGBA")
    # Resize with high quality Lanczos filter
    resized = im.resize((128, 128), Image.Resampling.LANCZOS)
    resized.save(out_path, "WEBP", quality=88, method=6)
    sz = os.path.getsize(out_path)
    total_bytes += sz
    print(f"  {item:20} -> {out_path} ({sz} octets)")

print("\n=== Exportation des sources de récolte (256x256 WebP alpha) ===")
for src_id, filename in SOURCES:
    src_path = os.path.join(SRC_DIR, f"{filename}.png")
    out_path = os.path.join(OUT_SOURCES, f"{filename}.webp")
    if not os.path.exists(src_path):
        print(f"ERREUR: {src_path} introuvable !")
        sys.exit(1)
    im = Image.open(src_path).convert("RGBA")
    resized = im.resize((256, 256), Image.Resampling.LANCZOS)
    resized.save(out_path, "WEBP", quality=88, method=6)
    sz = os.path.getsize(out_path)
    total_bytes += sz
    print(f"  {src_id:20} -> {out_path} ({sz} octets)")

print(f"\nTotal des 19 variantes WebP : {total_bytes} octets ({total_bytes / 1024:.1f} Ko)")
