#!/usr/bin/env python3
"""Exporter le lot de paysages sans modifier ses PNG maîtres.
Usage : python tools/export-paysages-carnet.py [--source dossier-du-lot]
"""
from pathlib import Path
from PIL import Image
import argparse, json, hashlib
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,default=ROOT/'docs/art-direction/paysages-carnet-v1')
parser.add_argument('--partial',action='store_true',help='Prévisualiser les fichiers déjà générés ; livraison finale sans cette option')
args=parser.parse_args()
source=args.source
specs=json.loads((source/'prompts.json').read_text(encoding='utf-8'))['assets']
report=[]
for spec in specs:
    p=source/'masters'/(spec['id']+'.png')
    if args.partial and not p.exists():
        continue
    with Image.open(p) as original:
        assert original.mode=='RGBA', f"Canal alpha manquant : {p.name}"
        alpha=original.getchannel('A')
        lo,hi=alpha.getextrema()
        assert lo==0 and hi>=240, f"Transparence insuffisante : {p.name}"
        assert 1.35<=original.width/original.height<=1.85, f"Format non horizontal : {p.name}"
        a=dict(id=spec['id'],name=spec['name'],master='masters/'+p.name,width=original.width,height=original.height,alphaRange=[lo,hi],sha256=hashlib.sha256(p.read_bytes()).hexdigest(),masterBytes=p.stat().st_size)
        image=original.copy()
        image.thumbnail((1280,1280),Image.Resampling.LANCZOS)
        target=ROOT/'assets/carnet/lands'/(spec['id']+'.webp')
        target.parent.mkdir(parents=True,exist_ok=True)
        image.save(target,'WEBP',quality=84,method=6)
        a.update(runtime=target.relative_to(ROOT).as_posix(),runtimeBytes=target.stat().st_size,runtimeSHA256=hashlib.sha256(target.read_bytes()).hexdigest())
        report.append(a)
manifest=dict(generator='imagegen intégré',masters='Sorties PNG intactes',assets=report,webBytes=sum(a['runtimeBytes'] for a in report))
(source/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(assets=len(report),webBytes=manifest['webBytes'])))
