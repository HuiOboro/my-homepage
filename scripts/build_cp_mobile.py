#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
双人（CP）壁纸 -> 手机版 hero 变体。

背景：CP 壁纸是 3120x720 (= 两张 1560x720 立绘并排) 的横条，而且两位角色是
   「齐腰裁断」的卡面。桌面 hero 宽、整张铺得下；手机 hero 是 42vh 的近方形框，
   竖着硬拼两个半张 => 露出被切的身体 + 接缝 + 而且 hero 框比例和图片对不上时
   object-fit:cover 会把竖版图上下裁掉（只剩上面那位，下面那位在渐隐处透出鬼影）。

做法（方案 C）：整张原图放大高斯模糊压暗当底，上面叠两张「独立卡片」
   —— 各取一位角色（按人物水平中心取景）、圆角 + 投影 + 间距。
   看起来是刻意的两张卡叠放，而不是一张被拼坏的连续图。

输出比例刻意做成 ~1.06:1 —— 手机 hero 是 42vh，对绝大多数手机（W/H≈2.2）
   ≈ 1.06:1，这样 hero 不用改 CSS 也不会被 cover 裁。

输入：public/walls/{leosou,junhiyo}/*.jpg
输出：同目录 <name>_m.jpg（page.tsx 用 <picture> 在 ≤700px 时切过去）
用法：python scripts/build_cp_mobile.py
"""
import os
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
WALLS = ROOT / "public" / "walls"
CP_KEYS = ("leosou", "junhiyo")

W, H = 1170, 1104     # 目标尺寸，比例 1.06:1（≈ 手机 42vh hero，不裁）
MARGIN = GAP = 46     # 上边距 = 两卡间距 = 下边距 → 三条留白比例完全相同，
                      # 切分线正好落在 H/2（46 + 483 + 23 = 552）
CROP_W = 1500         # 每半张的取景宽（1500 < 1560，人物居中且放大一点）
RADIUS = 30           # 卡片圆角
Q = 84


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


def face_crop(pane: Image.Image, crop_w: int) -> Image.Image:
    """按人物水平中心裁一条 crop_w 宽；不居中的话人物在卡里会偏一侧。"""
    c = char_center(np.asarray(pane, dtype=np.int16))
    a = min(max(c - crop_w // 2, 0), pane.size[0] - crop_w)
    return pane.crop((a, 0, a + crop_w, pane.size[1]))


def backdrop(im: Image.Image) -> Image.Image:
    """整张原图放大铺满 + 高斯模糊 + 压暗，当卡片后面的底。"""
    s = max(W / im.size[0], H / im.size[1])
    r = im.resize((int(im.size[0] * s + 1), int(im.size[1] * s + 1)), Image.LANCZOS)
    x = (r.size[0] - W) // 2
    y = (r.size[1] - H) // 2
    r = r.crop((x, y, x + W, y + H)).filter(ImageFilter.GaussianBlur(46))
    return ImageEnhance.Brightness(r).enhance(0.34)


def build(im: Image.Image) -> Image.Image:
    w, h = im.size
    if w / h < 3:
        # 不是「两张立绘并排」的宽条（拼贴卡之类，如 junhiyo_buddy 自带侧边条+黑边）：
        # 横竖怎么切都是密拼贴感 -> 只缩一张兜底，保证 <picture> 那个源永不 404。
        return im.resize((W, H), Image.LANCZOS)

    half = w // 2
    ch = (H - 2 * MARGIN - GAP) // 2           # 单张卡的高
    cw = round(ch * CROP_W / h)                # 单张卡的宽（保持取景窗比例，不额外裁）
    canvas = backdrop(im)

    mask = Image.new("L", (cw, ch), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, cw - 1, ch - 1], radius=RADIUS, fill=255)

    y0 = (H - (ch * 2 + GAP)) // 2
    for i, x0 in enumerate((0, half)):
        pane = im.crop((x0, 0, x0 + half, h))
        card = face_crop(pane, CROP_W).resize((cw, ch), Image.LANCZOS)
        yy = y0 + i * (ch + GAP)
        # 投影：比卡片大的圆角黑块，模糊后垫在下面
        sh = Image.new("RGBA", (cw + 44, ch + 44), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle(
            [22, 22, cw + 22, ch + 22], radius=RADIUS, fill=(0, 0, 0, 165)
        )
        canvas.paste(
            Image.new("RGB", sh.size, (0, 0, 0)),
            ((W - cw) // 2 - 22, yy - 22),
            sh.filter(ImageFilter.GaussianBlur(13)),
        )
        canvas.paste(card, ((W - cw) // 2, yy), mask)
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
            out = build(Image.open(src).convert("RGB"))
            dst = src.with_name(src.stem + "_m.jpg")
            out.save(dst, "JPEG", quality=Q, optimize=True)
            total += 1
            print(f"  + {dst.name}  {out.size[0]}x{out.size[1]}  ({os.path.getsize(dst)//1024}KB)")
    print(f"\n共 {total} 张 -> public/walls/*/*_m.jpg")


if __name__ == "__main__":
    main()
