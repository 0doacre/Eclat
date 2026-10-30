"""Planche publique de revue ; les curiosités/reliques restent dans la galerie repliée."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json, math
root=Path(__file__).resolve().parent
items=[x for x in json.loads((root/'prompts.json').read_text(encoding='utf-8')) if not x['secret']]
canvas=Image.new('RGB',(1200,math.ceil(len(items)/4)*300),'#efe6d0')
draw=ImageDraw.Draw(canvas)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
for i,x in enumerate(items):
    ox=(i%4)*300; oy=(i//4)*300
    im=Image.open(root/x['src']).convert('RGBA'); im.thumbnail((245,205))
    canvas.paste(im,(ox+(300-im.width)//2,oy+10+(205-im.height)//2),im)
    draw.text((ox+12,oy+222),x['name'],fill='#35291e',font=font)
    for size,pos in [(48,ox+12),(32,ox+100)]:
        tiny=im.copy(); tiny.thumbnail((size,size)); canvas.paste(tiny,(pos,oy+247),tiny)
canvas.save(root/'planche-publique.jpg',quality=90)
