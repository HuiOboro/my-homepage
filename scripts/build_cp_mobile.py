#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
双人（CP）壁纸 -> 手机竖版变体。

背景：CP 壁纸是 3120x720 (= 两张 1560x720 立绘并排) 的横条。
桌面 hero (min(50vh,400px)，宽约 1440) 比率 3.6~4.3，整张铺得下，两个人都看得见。
手机 hero (42vh，宽约 390) 比率 ~1.08，cover 后只能露出 ~25% 宽，
   就算把两张立绘各自对准一半（左右各 50%），每半也只露出 ~12% 宽 —— 等于
   把两个人都放大 7~8 倍再硬拼在一起，接缝假、人被裁。

做法：给每张 CP 壁纸生成「上=左立绘 / 下=右立绘」的竖版拼图 (1170x1080，比率 1.083)，
   正好塞进手机 hero 那个近正方形的框（cover 几乎零裁切），两个人都完整、够大。
   接缝处做一个渐隐交叉淡入 (cross-fade)，免得出现一条硬线。

输入：public/walls/{leosou,junhiyo}/*.jpg
输出：同目录 <name>_m.jpg（page.tsx 用 <picture> 在 ≤700px 时切过去）
用法：C:\\Users\\su289\\miniconda3\\python.exe scripts\\build_cp_mobile.py
"""
import os
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
WALLS = ROOT / "public" / "walls"
CP_KEYS = ("leosou", "junhiyo")

OUT_W = 1170          # 输出宽（~390 手机宽的 3x，够 3x 屏）
CROP_W = 1300         # 每半张的取景宽（比 1560 窄一点 => 人物居中且放大 ~20%）
BAND = 28             # 接缝交叉淡入高度（够抹掉渐变底色的一点色差，又不会糊出重影）
Q = 82


def char_center(half: np.ndarray) -> int:
    """估一张立绘里人物的水平中心。

    平滑渐变背景在「同一列的相邻行」几乎不变，线稿/人物则变化剧烈，
    所以按列求 |相邻行差| 的均值就能把人物所在的横向区间框出来。
    """
    d = np.abs(np.diff(half, axis=0)).mean(axis=(0, 2))
    thr = max(d.min() + (d.max() - d.min()) * 0.18, 1.2)
    idx = np.where(d > thr)[0]
    if len(idx) == 0:
        return half.shape[1] // 2
    breaks = np.where(np.diff(idx) > 12)[0]
    seg = max(np.split(idx, breaks + 1), key=len)
    return int((seg[0] + seg[-1]) // 2)


def stack(left: Image.Image, right: Image.Image) -> Image.Image:
    """左立绘在上、右立绘在下，中缝按 BAND 高度交叉淡入。"""
    w, h = left.size
    canvas = Image.new("RGB", (w, h * 2), "#000000")
    canvas.paste(left, (0, 0))
    # 右图压在左图底部 BAND 行上，并用一张从 0->255 的竖直 alpha 蒙版淡入；
    # 于是中缝是一段平滑交叉，而不是一条硬边。
    mask = Image.new("L", (w, h), 255)
    mpx = mask.load()
    for y in range(BAND):
        v = round(255 * (y + 1) / BAND)
        for x in range(w):
            mpx[x, y] = v
    canvas.paste(right, (0, h - BAND), mask)
    return canvas


def main():
    total = 0
    for key in CP_KEYS:
        d = WALLS / key
        if not d.exists():
            continue
        for src in sorted(d.glob("*.jpg")):
            if src.stem.endswith("_m"):
                continue
            im = Image.open(src).convert("RGB")
            w, h = im.size
            if w / h < 3:
                # 不是「两张立绘并排」的宽条（万一以后往池子里塞了普通图）：
                # 不拼，只缩一张竖版兜底，保证 <picture> 那个源永远不 404。
                k = OUT_W / w
                out = im.resize((OUT_W, round(h * k)), Image.LANCZOS)
            else:
                half = w // 2
                panes = []
                for x0 in (0, half):
                    p = im.crop((x0, 0, x0 + half, h))
                    c = char_center(np.asarray(p, dtype=np.int16))
                    a = min(max(c - CROP_W // 2, 0), half - CROP_W)   # 取景窗居中于人物
                    panes.append(p.crop((a, 0, a + CROP_W, h)))
                out = stack(*panes)
            k = OUT_W / out.width
            out = out.resize((OUT_W, round(out.height * k)), Image.LANCZOS)
            dst = src.with_name(src.stem + "_m.jpg")
            out.save(dst, "JPEG", quality=Q, optimize=True)
            total += 1
            print(f"  + {dst.name}  {out.size[0]}x{out.size[1]}  ({os.path.getsize(dst)//1024}KB)")
    print(f"\n共 {total} 张 -> public/walls/*/*_m.jpg")


if __name__ == "__main__":
    main()
