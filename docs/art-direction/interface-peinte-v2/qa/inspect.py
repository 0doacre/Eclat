"""Lecture des originaux uniquement : aucune modification ou réécriture des PNG."""
from PIL import Image
from pathlib import Path
import json, hashlib
root=Path(__file__).resolve().parents[1]
assets=[]
for p in sorted((root/'assets').rglob('*.png')):
    im=Image.open(p)
    alpha=im.getchannel('A') if 'A' in im.getbands() else None
    assets.append(dict(file=p.relative_to(root).as_posix(),width=im.width,height=im.height,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),alphaRange=alpha.getextrema() if alpha else None,subjectBounds=alpha.getbbox() if alpha else None))
assert len(assets)==9
for a in assets:
    if 'paper-day' not in a['file'] and 'paper-night' not in a['file']:
        assert a['alphaRange'][0]==0 and a['alphaRange'][1]>=250, a['file']
(root/'manifest.json').write_text(json.dumps(dict(generator='imagegen intégré',masters='PNG originaux intacts',assets=assets),ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(assets=len(assets),bytes=sum(a['bytes'] for a in assets))))
