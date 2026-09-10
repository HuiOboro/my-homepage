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
    cand={}
    for i in range(1,len(ratio)-1):
        if d[i]>6 and ratio[i]>2.3:
            cand[i+1]=(ratio[i],d[i])
    return W,cand
for f in files:
    W,cand=find_lines(f)
    im=Image.open(str(base/f)).convert('RGB')
    H=im.height
    scale=max(1,int(np.ceil(im.width/1800)))  # downscale large to ~1800w for easy viewing
    sim=im.resize((im.width//scale,im.height//scale))
    dr=ImageDraw.Draw(sim)
    sx=sim.width/W
    n=1
    legend=[]
    for x in sorted(cand):
        r,d=cand[x]
        dr.line([(x*sx,0),(x*sx,H//scale)],fill=(255,40,40),width=max(1,scale))
        ty=(10+((n-1)%10)*26)
        dr.text((x*sx+3,ty),f'{n}',fill=(255,255,0),stroke_width=1,stroke_fill=(0,0,0))
        legend.append(f'{n}:x={x}({x/W*100:.0f}%)')
        n+=1
    out=str(outdir/(f.replace('/','_')+'_anno.png'))
    sim.save(out)
    print(out, 'scale',scale)
    print('   lines:', ' | '.join(legend))
print('done')
