"""Export mécanique WebP ; aucun dessin retouché. Conserve les PNG maîtres.
Usage : python docs/art-direction/papier-partout-0-38/optimiser-webp.py [--write]
À utiliser sur les exports de la base, pas pour recomprimer les fichiers déjà réduits.
"""
from pathlib import Path
from PIL import Image
from io import BytesIO
import json, sys
root = Path(__file__).resolve().parents[3]
changes = []
for file in sorted((root / 'assets').rglob('*.webp')):
    original = file.read_bytes()
    if len(original) <= 35000:
        continue
    image = Image.open(file).convert('RGBA')
    best = original
    size = image.size
    edges = (512,) if file.parent.name == 'passages' else (640, 512, 448)
    for edge in edges:
        trial = image.copy()
        trial.thumbnail((edge, edge), Image.Resampling.LANCZOS)
        for quality in (60,):
            buf = BytesIO()
            trial.save(buf, format='WEBP', quality=quality, method=4)
            if len(buf.getvalue()) < len(best):
                best, size = buf.getvalue(), trial.size
            if len(best) <= 35000:
                break
        if len(best) <= 35000:
            break
    changes.append({'file': file.relative_to(root).as_posix(), 'before': len(original), 'after': len(best), 'size': size})
    if '--write' in sys.argv:
        file.write_bytes(best)
report = Path(__file__).parent / 'optimisation.json'
report.write_text(json.dumps(changes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(len(changes), 'images ;', sum(x['before'] for x in changes), '->', sum(x['after'] for x in changes), 'octets')
