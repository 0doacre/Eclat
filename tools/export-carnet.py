#!/usr/bin/env python3
"""
Exporte les variantes WebP optimisées des illustrations du Carnet du Semeur
(Âge du Bois et Âge de l'Os) pour l'intégration dans Éclat (Mode Vivant).
Peut lire directement depuis les archives docs/art-direction/ ou des dossiers extraits.
"""
import io
import os
import sys
import zipfile
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_ITEMS = os.path.join(ROOT, "assets", "carnet", "items")
OUT_SOURCES = os.path.join(ROOT, "assets", "carnet", "sources")

os.makedirs(OUT_ITEMS, exist_ok=True)
os.makedirs(OUT_SOURCES, exist_ok=True)

# Définition des lots d'illustrations par âge
LOTS = {
    "bois": {
        "name": "Âge du Bois",
        "archives": [
            os.path.join(ROOT, "docs", "art-direction", "age-bois-v1", "da-age-bois-v1-part1.zip"),
            os.path.join(ROOT, "docs", "art-direction", "age-bois-v1", "da-age-bois-v1-part2.zip"),
        ],
        "prefix": "da-age-bois-v1/assets/",
        "items": [
            "bois", "fibre", "caillou", "manche", "corde", "panier", "archet",
            "feu", "charbon", "epieu", "cabane", "torche", "fibre_1", "caillou_1",
            "percuteur_pierre", "etabli_amenage"
        ],
        "sources": [
            ("source_bois", "source_bois"),
            ("source_fibre", "source_fibre"),
            ("source_caillou", "source_caillou"),
        ]
    },
    "os": {
        "name": "Âge de l'Os",
        "archives": [
            os.path.join(ROOT, "docs", "art-direction", "age-os-v1", "da-age-os-v1-part1.zip"),
            os.path.join(ROOT, "docs", "art-direction", "age-os-v1", "da-age-os-v1-part2.zip"),
        ],
        "prefix": "da-age-os-v1/assets/",
        "items": [
            "os", "cuir", "aiguille", "laniere", "colle_os", "arc", "fronde",
            "outre", "pic_os", "collets", "tunique", "encre", "cuir_1", "racloir_os"
        ],
        "sources": [
            ("source_os", "source_os"),
            ("source_cuir", "source_cuir"),
        ]
    }
}

def load_image_from_archives(archives, internal_path):
    for arch in archives:
        if os.path.exists(arch):
            with zipfile.ZipFile(arch, 'r') as z:
                if internal_path in z.namelist():
                    data = z.read(internal_path)
                    return Image.open(io.BytesIO(data)).convert("RGBA")
    return None

def export_lot(key, lot):
    print(f"\n=== {lot['name']} ===")
    total_lot_bytes = 0

    print("  Objets (128x128 WebP alpha) :")
    for item in lot["items"]:
        internal_file = f"{lot['prefix']}{item}.png"
        im = load_image_from_archives(lot["archives"], internal_file)
        if im is None:
            # Essai dossier extrait local si présent
            alt_path = os.path.join(ROOT, f"extracted-age-{key}-v1", f"da-age-{key}-v1", "assets", f"{item}.png")
            if os.path.exists(alt_path):
                im = Image.open(alt_path).convert("RGBA")
            else:
                print(f"  ERREUR: {internal_file} introuvable dans les archives !")
                sys.exit(1)

        out_path = os.path.join(OUT_ITEMS, f"{item}.webp")
        resized = im.resize((128, 128), Image.Resampling.LANCZOS)
        resized.save(out_path, "WEBP", quality=88, method=6)
        sz = os.path.getsize(out_path)
        total_lot_bytes += sz
        print(f"    {item:20} -> {sz} octets")

    print("  Sources de récolte (256x256 WebP alpha) :")
    for src_id, filename in lot["sources"]:
        internal_file = f"{lot['prefix']}{filename}.png"
        im = load_image_from_archives(lot["archives"], internal_file)
        if im is None:
            alt_path = os.path.join(ROOT, f"extracted-age-{key}-v1", f"da-age-{key}-v1", "assets", f"{filename}.png")
            if os.path.exists(alt_path):
                im = Image.open(alt_path).convert("RGBA")
            else:
                print(f"  ERREUR: {internal_file} introuvable dans les archives !")
                sys.exit(1)

        out_path = os.path.join(OUT_SOURCES, f"{filename}.webp")
        resized = im.resize((256, 256), Image.Resampling.LANCZOS)
        resized.save(out_path, "WEBP", quality=88, method=6)
        sz = os.path.getsize(out_path)
        total_lot_bytes += sz
        print(f"    {src_id:20} -> {sz} octets")

    print(f"  Sous-total {lot['name']} : {total_lot_bytes} octets ({total_lot_bytes / 1024:.1f} Ko)")
    return total_lot_bytes

def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "all"
    grand_total = 0

    if target in LOTS:
        grand_total += export_lot(target, LOTS[target])
    elif target == "all":
        for k, lot in LOTS.items():
            grand_total += export_lot(k, lot)
    else:
        print(f"Usage: {sys.argv[0]} [bois|os|all]")
        sys.exit(1)

    print(f"\n==================================================")
    print(f"Total général exporté : {grand_total} octets ({grand_total / 1024:.1f} Ko)")

if __name__ == "__main__":
    main()
