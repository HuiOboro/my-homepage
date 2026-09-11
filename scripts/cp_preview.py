#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CP 手机版：生成桌面预览图（不参与部署）。

1) CP手机版_改后预览.jpg     —— 10 张 _m.jpg 的手机 hero 模拟缩略图（390x354）
2) CP手机版_留白对比.jpg     —— 改前(42/56/42) vs 改后(46/46/46) 的等比示意图
用法：python scripts/cp_preview.py
"""
import glob
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DESK = Path.home() / "Desktop"
FONTPATH = "C:/Windows/Fonts/msyh.ttc"

BG = "#1b1b1b"
CARD_COL = "#8c4553"
GAP_COL = "#3a3a3a"
LINE = "#ffd479"


def font(sz):
    try:
        return ImageFont.truetype(FONTPATH, sz)
    except OSError:
        return ImageFont.load_default()


def cover(im, bw, bh, pos=(0.5, 0.08)):
    """模拟 hero 的 object-fit: cover。"""
    s = max(bw / im.width, bh / im.height)
    dw, dh = round(im.width * s), round(im.height * s)
    im = im.resize((dw, dh), Image.LANCZOS)
    ox, oy = round(pos[0] * (dw - bw)), round(pos[1] * (dh - bh))
    return im.crop((ox, oy, ox + bw, oy + bh))


def files():
    fs = sorted(glob.glob(str(ROOT / "public/walls/leosou/*_m.jpg")))
    fs += sorted(glob.glob(str(ROOT / "public/walls/junhiyo/*_m.jpg")))
    return fs


def sheet_tiles():
    fs = files()
    bw, bh = 390, 354
    F = font(20)
    sh = Image.new("RGB", (5 * (bw + 10) + 10, 2 * (bh + 28) + 10), BG)
    d = ImageDraw.Draw(sh)
    for i, fp in enumerate(fs):
        x = 10 + (i % 5) * (bw + 10)
        y = 10 + (i // 5) * (bh + 28)
        sh.paste(cover(Image.open(fp).convert("RGB"), bw, bh), (x, y + 6))
        name = Path(fp).parent.name + "/" + Path(fp).stem.replace("_m", "")
        d.text((x, y + bh + 8), name, fill="#ccc", font=F)
    sh.save(DESK / "CP手机版_改后预览.jpg", quality=88)
    print("tiles", sh.size)


def diagram(d, x, y, w, m, c, g, title):
    """按 1104 等比例画一列：留白 / 卡 / 间距 / 卡 / 留白。"""
    F, FS = font(22), font(17)
    sc = 480 / 1104
    d.text((x, y - 34), title, fill="#fff", font=F)

    bands = [("上留白", m, GAP_COL), ("卡片1", c, CARD_COL), ("间距", g, GAP_COL),
             ("卡片2", c, CARD_COL), ("下留白", m, GAP_COL)]
    yy = y
    card_x = x + (w - 1006 * sc) / 2
    for name, val, col in bands:
        h = val * sc
        if col == CARD_COL:
            d.rounded_rectangle([card_x, yy, card_x + 1006 * sc, yy + h],
                                radius=8, fill=col, outline="#d4909b", width=2)
            d.text((card_x + 14, yy + h / 2 - 10), f"{name}  1006×{val}", fill="#ffe9ec", font=FS)
        else:
            d.rectangle([x, yy, x + w, yy + h], fill=col)
            d.text((x + 10, yy + h / 2 - 10), f"{name}  {val}px", fill="#ffd479" if h > 14 else "#e8c37a", font=FS)
        yy += h

    mid = y + 480 / 2
    for xx in range(int(x), int(x + w), 12):
        d.line([xx, mid, xx + 6, mid], fill=LINE, width=2)
    d.text((x + w + 6, mid - 11), "H/2", fill=LINE, font=FS)


def sheet_schematic():
    sc_w = 509
    sh = Image.new("RGB", (40 + sc_w + 80 + sc_w + 40, 640), BG)
    d = ImageDraw.Draw(sh)
    d.text((40, 18), "CP 手机版：上下留白比例 —— 改前(42 / 56 / 42)  vs  改后(46 / 46 / 46)", fill="#fff", font=font(26))
    diagram(d, 40, 110, sc_w, 42, 482, 56, "改前：中间挤、上下宽")
    d.text((40, 640 - 60), "切分线本来就落在 H/2，只是三条留白比例不同。", fill="#aaa", font=font(18))
    diagram(d, 40 + sc_w + 80, 110, sc_w, 46, 483, 46, "改后：上 = 中 = 下，比例完全相同")
    d.text((40 + sc_w + 80, 640 - 60), "卡片大小几乎不变（482→483），只是间距 56→46、边距 42→46。", fill="#aaa", font=font(18))
    sh.save(DESK / "CP手机版_留白对比.jpg", quality=88)
    print("schematic", sh.size)


if __name__ == "__main__":
    sheet_tiles()
    sheet_schematic()
