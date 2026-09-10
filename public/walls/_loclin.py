# -*- coding: utf-8 -*-
import sys; sys.stdout.reconfigure(encoding='utf-8', errors='replace')
from pathlib import Path
import numpy as np
from PIL import Image
base=Path(r'C:\Users\su289\python\my-accounting-app\public\walls')
files=['junhiyo/junhiyo_buddy.jpg','junhiyo/junhiyo_rock.jpg','junhiyo/junhiyo_surprise.jpg','leosou/leosou_chivalrous.jpg','leosou/leosou_surprise.jpg']
for f in files:
    a=np.asarray(Image.open(str(base/f)).convert('RGB'),dtype=np.float32)
    W=a.shape[1]
    d=np.abs(a[:,1:,:]-a[:,:-1,:]).mean(axis=(0,2))  # boundaries x=1..W-1 => array len W-1 index i means boundary between i and i+1
    # local median over +/- 60 neighbours (exclude self)
    dm=[]
    for i in range(1,W):
        lo=max(1,i-60); hi=min(len(d),i+60)
        dm.append(np.median(np.concatenate([d[lo:i],d[i+1:hi]])))
    dm=np.array(dm)  # len W-1 index i -> median around boundary i+1 (aligned with d)
    ratio=d/np.maximum(dm,0.5)
    # find local maxima of ratio that are also d>6
    cand=[]
    for i in range(2,len(ratio)-2):
        if ratio[i]==ratio[max(0,i-1):min(len(ratio),i+2)].max() and d[i]>6 and ratio[i]>2.2:
            cand.append((ratio[i], i+1, d[i]))
    cand.sort(reverse=True)
    print('='*70); print(f)
    print('  strongest line-candidates (ratio,d,x):', ', '.join(f'r={r:.1f} x={x}({x/W*100:.0f}%) d={di:.0f}' for r,x,di in cand[:6]))
