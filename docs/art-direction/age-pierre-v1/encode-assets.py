"""Encode les PNG ImageGen pour le jeu ; aucune retouche de dessin ni détourage."""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
total = 0
for folder in ["age-pierre-v1", "riviere-decouvertes-v1"]:
    directory = ROOT / "docs/art-direction" / folder
    manifest = directory / "prompts.json"
    records = json.loads(manifest.read_text(encoding="utf-8"))
    for asset in records:
        source = directory / asset["master"]
        destination = (directory / asset["src"]).resolve()
        assert destination.is_relative_to(ROOT / "assets/carnet")
        with Image.open(source) as original:
            image = original.convert("RGBA")
            low, high = image.getchannel("A").getextrema()
            assert low == 0 and high > 128, (asset["id"], "alpha invalide")
            edge = 1280 if asset["type"] == "plate" else 384 if asset["type"] == "source" else 256
            image.thumbnail((edge, edge), Image.Resampling.LANCZOS)
            destination.parent.mkdir(parents=True, exist_ok=True)
            image.save(destination, "WEBP", quality=90, method=6)
            asset.update(width=image.width, height=image.height, bytes=destination.stat().st_size, alpha=True)
            total += asset["bytes"]
    manifest.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"27 WebP RGBA encodés : {total:,} octets")
