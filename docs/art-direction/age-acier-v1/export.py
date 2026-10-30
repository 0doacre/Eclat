"""Exports uniquement : taille et encodage, sans retouche des dessins."""
from pathlib import Path
import json, html
from PIL import Image

ROOT = Path(__file__).resolve().parent
records = json.loads((ROOT / 'prompts.json').read_text(encoding='utf-8'))
total = 0
for item in records:
    source = ROOT / item['master']
    if not source.exists():
        continue
    with Image.open(source) as original:
        image = original.convert('RGBA')
        extrema = image.getchannel('A').getextrema()
        assert extrema[0] == 0 and extrema[1] > 128, (item['id'], extrema)
        item['master_size'] = list(image.size)
        image.thumbnail((256, 256), Image.Resampling.LANCZOS)
        dest = ROOT / item['src']
        dest.parent.mkdir(parents=True, exist_ok=True)
        image.save(dest, 'WEBP', quality=88, method=6)
        with Image.open(dest) as check:
            assert check.size == image.size and 'A' in check.getbands()
        item.update(status='produit-a-relire', width=image.width, height=image.height,
                    bytes=dest.stat().st_size, alpha=True, tool='ImageGen intégré')
        total += item['bytes']
(ROOT / 'prompts.json').write_text(json.dumps(records, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def card(item):
    name = html.escape(item['name'])
    if not (ROOT / item['src']).exists():
        return f'<article><h2>{name}</h2><p>À produire</p></article>'
    src = html.escape(item['src'])
    return f'<article><h2>{name}</h2><a href="{item["master"]}"><img class="hero" src="{src}" alt="{name}"></a><div class="samples"><img width="48" height="48" src="{src}" alt="">48 px <img width="32" height="32" src="{src}" alt="">32 px</div><small>{html.escape(item["id"])} · {item["bytes"]:,} octets</small></article>'
public = ''.join(card(i) for i in records if not i['secret'])
secret = ''.join(card(i) for i in records if i['secret'])
page = '''<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Éclat — Âge de l’Acier</title>
<style>body{margin:0;background:#efe6d0;color:#35291e;font:16px/1.5 Georgia,serif}main{max-width:1150px;margin:auto;padding:24px}h1{font-size:2rem;margin-bottom:4px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}article{border:1px solid #b4a081;border-radius:4px;padding:14px;background:#f6edda}h2{font-size:1.05rem;min-height:3em;margin:0}.hero{display:block;width:100%;height:210px;object-fit:contain}.samples{display:flex;align-items:center;gap:12px;margin:12px 0}.samples img{object-fit:contain}small{color:#65533e}details{margin-top:28px}summary{cursor:pointer;padding:12px}a{color:inherit}</style><main><h1>Âge de l’Acier</h1><p>Études de l’Acier à relire — encre et aquarelle. Cliquer sur un dessin pour voir son original.</p><div class="grid">'''+public+'''</div><details hidden><summary>Curiosités et relique</summary><div class="grid">'''+secret+'''</div></details><p>Production individuelle par ImageGen intégré. Prompts exacts : <a href="prompts.json">prompts.json</a>. Lot de revue séparé du jeu.</p></main></html>'''
(ROOT / 'index.html').write_text(page, encoding='utf-8')
print(json.dumps({'produits':sum(i['status']!='a-produire' for i in records),'total':len(records),'webp_bytes':total},ensure_ascii=False))
