"""Exports techniques des couches peintes ; originaux conservés sans retouche."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
for name in ['base','ronces-gauche','ronces-droite','herbes-sentier']:
    image=Image.open(root/'docs/art-direction/sentier-herbes-v1/masters'/f'{name}.png')
    assert image.mode=='RGBA' and image.getextrema()[3][0]==0, name
    image.thumbnail((1100,1100),Image.Resampling.LANCZOS)
    target=root/'assets/carnet/passages'/f'{name}.webp'
    image.save(target,quality=83,method=6)
    print(name,image.size,target.stat().st_size)
