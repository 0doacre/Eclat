#!/usr/bin/env python3
"""Variantes WebP de diffusion ; les maîtres validés restent intacts.
Usage : python tools/export-interface-peinte.py [--source dossier-de-la-page-temoin]
"""
from pathlib import Path
import argparse, json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,default=ROOT/'docs/art-direction/interface-peinte-v2')
source=parser.parse_args().source/'assets'
specs=[('ui/button-pigment.png','ui/paint-button.webp',960,86),('ui/button-paper.png','ui/paper-button.webp',960,86),('ui/frame-ink.png','ui/page-frame.webp',720,90),('ui/paper-day.png','ui/paper.webp',1024,76),('art/lisiere-landscape.png','lands/lisiere.webp',1280,84),('art/riviere-vapeur-landscape.png','lands/riviere-vapeur.webp',1280,84),('art/mercure-landscape.png','lands/mercure.webp',1280,84),('art/metal-mercurien.png','items/metal_mercure.webp',256,86),('art/pompe-etude.png','sources/source_eau.webp',320,86)]
report=[]
for src,dst,size,quality in specs:
    target=ROOT/'assets/carnet'/dst
    target.parent.mkdir(parents=True,exist_ok=True)
    with Image.open(source/src) as image:
        image.thumbnail((size,size),Image.Resampling.LANCZOS)
        image.save(target,'WEBP',quality=quality,method=6)
        report.append(dict(file=target.relative_to(ROOT).as_posix(),width=image.width,height=image.height,bytes=target.stat().st_size))
print(json.dumps(dict(files=report,bytes=sum(i['bytes'] for i in report)),indent=2))
