# -*- coding: utf-8 -*-
import sys; sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw
base=Path(r'C:\Users\su289\python\my-accounting-app\public\walls')
files=['junhiyo/junhiyo_buddy.jpg','junhiyo/junhiyo_rock.jpg','junhiyo/junhiyo_surprise.jpg',
       'leosou/leosou_chivalrous.jpg','leosou/leosou_surprise.jpg']
outdir=Path(r'C:\Users\su289\_seamcheck'); outdir.mkdir(exist_ok=True)
def find_lines(f):
    a=np.asarray(Image.open(str(base/f)).convert('RGB'),dtype=np.float32)
    W=a.shape[1]
    d=np.abs(a[:,1:,:]-a[:,:-1,:]).mean(axis=(0,2))
    dm=[]
    for i in range(1,W):
        lo=max(1,i-60); hi=min(len(d),i+60)
        dm.append(np.median(np.concatenate([d[lo:i],d[i+1:hi]])))
    dm=np.array(dm)
    ratio=d/np.maximum(dm,0.5)
    # merge adjacent flagged columns into bands
    flags=[i+1 for i in range(1,len(ratio)-1) if d[i]>6 and ratio[i]>2.3]
    bands=[]
    for x in flags:
        if bands and x-bands[-1][-1]<=3: bands[-1].append(x)
        else: bands.append([x])
    return W,bands
for f in files:
    W,bands=find_lines(f)
    im=Image.open(str(base/f)).convert('RGB'); H=im.height
    scale=max(1,int(np.ceil(im.width/1500)))
    sim=im.resize((im.width//scale,im.height//scale)); dr=ImageDraw.Draw(sim)
    sx=sim.width/W
    n=1; legend=[]
    for b in bands:
        cx=b[len(b)//2]; rng=f'{b[0]}–{b[-1]}'
        dr.line([(cx*sx,0),(cx*sx,H//scale)],fill=(255,40,40),width=2)
        ty=14+((n-1)%12)*24
        dr.text((min(cx*sx+4,sim.width-40),ty),f'#{n}',fill=(255,255,0),stroke_width=1,stroke_fill=(0,0,0))
        legend.append(f'#{n} x={rng} ({cx/W*100:.0f}%)')
        n+=1
    # center seam marker cyan thick
    dr.line([(W//2*sx,0),(W//2*sx,H//scale)],fill=(0,255,255),width=3)
    dr.text((W//2*sx+4,14),'CENTER SEAM x1560',fill=(0,255,255),stroke_width=1,stroke_fill=(0,0,0))
    out=str(outdir/(f.replace('/','_')+'_anno2.png'))
    sim.save(out)
    print(out)
    print('  '+ ' | '.join(legend))
print('done')
