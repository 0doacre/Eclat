"""Exports techniques des originaux ImageGen ; aucune retouche artistique."""
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = root / 'docs/art-direction/lisiere-decouvertes-v1/masters'
target = root / 'assets/carnet/discoveries'
target.mkdir(parents=True, exist_ok=True)
for name, size in [('lisiere-esquisse', 1280), ('camp', 720), ('grotte', 1000)]:
    image = Image.open(source / (name + '.png'))
    assert image.mode == 'RGBA' and image.getextrema()[3][0] == 0, name
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    image.save(target / (name + '.webp'), quality=84, method=6)
    print(name, image.size, (target / (name + '.webp')).stat().st_size)
