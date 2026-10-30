"""Exports WebP techniques ; les quatre PNG ImageGen restent intacts."""
from pathlib import Path
from PIL import Image
root = Path(__file__).resolve().parents[1]
source = root / 'docs/art-direction/age-os-decouvertes-v1/masters'
for name, folder, size in [('plaine-esquisse', 'discoveries', 1280), ('tumulus', 'discoveries', 1000), ('flute', 'items', 512), ('statuette', 'items', 512)]:
    image = Image.open(source / (name + '.png'))
    assert image.mode == 'RGBA' and image.getextrema()[3][0] == 0, name
    image.thumbnail((size, size), Image.Resampling.LANCZOS)
    target = root / 'assets/carnet' / folder / (name + '.webp')
    image.save(target, quality=84, method=6)
    print(name, image.size, target.stat().st_size)
