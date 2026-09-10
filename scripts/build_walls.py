#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把用户整理的壁纸同步进 Next public/walls，并生成 manifest.json。

源图目录（C:/Users/su289/Pictures/ 下）：
  leo/        -> leo 皮肤（单人 Leo 壁纸）
  日和/       -> hiyori 皮肤（单人日和壁纸）
  leosou/     -> leosou 皮肤（直接放『Leo+司 同框』的大图，可选）
  junhiyo/    -> junhiyo 皮肤（直接放『純+日和 同框』的大图，可选）
配对拼接（同名两张会拼成一张宽的配对壁纸）：
  leo/ 与 司/  里文件名相同的一对  -> leosou 池的 pair_*.jpg
  日和/ 与 純/ 里文件名相同的一对  -> junhiyo 池的 pair_*.jpg

输出：public/walls/{leo,hiyori,leosou,junhiyo}/*.jpg + public/walls/manifest.json
用法：C:\\Users\\su289\\miniconda3\\python.exe scripts\\build_walls.py
"""
import json
import os
from pathlib import Path
from PIL import Image, ImageOps

SRC = Path(r"C:\Users\su289\Pictures")
OUT = Path(__file__).resolve().parent.parent / "public" / "walls"

SOLO = {"leo": "leo", "hiyori": "日和"}           # 单人皮肤池
DIRECT = {"leosou": "レオ司", "junhiyo": "純日和"}  # 直接放同框图
COMPOSE = {"leosou": ("leo", "司"), "junhiyo": ("日和", "純")}  # 同名拼对

EXTS = ("*.jpg", "*.jpeg", "*.png", "*.webp")
W = 1920          # 横图输出宽度
Q = 84            # jpg 质量


def all_files(d: Path):
    if not d.exists():
        return []
    fs = []
    for e in EXTS:
        fs += list(d.glob(e))
    return fs


def down_scale(im: Image.Image) -> Image.Image:
    """宽图按 1920 宽缩放；竖图限制高度，让 object-fit:cover 负责裁切。"""
    w, h = im.size
    if w / h >= 1.3:
        nh = round(h * W / w)
        return im.resize((W, nh), Image.LANCZOS)
    nh = min(h, 1280)
    nw = round(w * nh / h)
    return im.resize((nw, nh), Image.LANCZOS)


def save(im: Image.Image, path: Path):
    if im.mode not in ("RGB", "L"):
        im = im.convert("RGB")
    im.save(path, "JPEG", quality=Q, optimize=True)


def process_dir(d: Path, prefix: str, out_key: str):
    """导入某文件夹全部图片 -> public/walls/<out_key>，返回 URL 列表。"""
    fs = [f for f in all_files(d)]
    fs.sort(key=lambda p: str(p).lower())
    got = []
    outdir = OUT / out_key
    outdir.mkdir(parents=True, exist_ok=True)
    for i, f in enumerate(fs, 1):
        try:
            im = Image.open(f)
            im = ImageOps.exif_transpose(im)
            im = im.convert("RGB")
            im = down_scale(im)
        except Exception as e:
            print("  skip", f.name, e)
            continue
        name = f"{prefix}_{i:02d}.jpg"
        p = outdir / name
        save(im, p)
        got.append(f"/walls/{out_key}/{name}")
        print(f"  + {name}  {im.size[0]}x{im.size[1]}  ({os.path.getsize(p)//1024}KB)")
    return got


def scale_h(im: Image.Image, h: int) -> Image.Image:
    k = h / im.height
    return im.resize((round(im.width * k), h), Image.LANCZOS)


def compose_pair(ka: str, kb: str, out_key: str, prefix: str):
    """同名两张拼成一张宽的配对壁纸（并排、不足宽时用高斯模糊垫底）。"""
    A = {f.stem: f for f in all_files(SRC / ka)}
    B = {f.stem: f for f in all_files(SRC / kb)}
    common = sorted(set(A) & set(B))
    if not common:
        return []
    outdir = OUT / out_key
    outdir.mkdir(parents=True, exist_ok=True)
    got = []
    for i, stem in enumerate(common, 1):
        try:
            ia = Image.open(A[stem]).convert("RGB")
            ib = Image.open(B[stem]).convert("RGB")
        except Exception as e:
            print("  skip pair", stem, e)
            continue
        H = 900
        ia = scale_h(ia, H)
        ib = scale_h(ib, H)
        w_sum = ia.width + ib.width
        canvas = Image.new("RGB", (w_sum, H), "#f2edda")
        canvas.paste(ia, (0, 0))
        canvas.paste(ib, (ia.width, 0))
        # 拼好后若比 2.15:1 更宽则整体缩小；更窄则高斯模糊铺底居中
        if w_sum / H > 2.15:
            k = (2.15 * H) / w_sum
            canvas = canvas.resize((round(w_sum * k), round(H * k)), Image.LANCZOS)
        name = f"pair_{prefix}_{i:02d}.jpg"
        p = outdir / name
        save(canvas, p)
        got.append(f"/walls/{out_key}/{name}")
        print(f"  +pair {stem} -> {name}  {canvas.size[0]}x{canvas.size[1]}  ({os.path.getsize(p)//1024}KB)")
    return got


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {}

    for key, dname in SOLO.items():
        print(f"[{key}]  <- Pictures/{dname}")
        manifest[key] = process_dir(SRC / dname, key, key)

    for key, dname in DIRECT.items():
        print(f"[{key}]  <- Pictures/{dname} (同框图，可选)")
        manifest[key] = process_dir(SRC / dname, key, key)

    for key, (ka, kb) in COMPOSE.items():
        print(f"[{key}]  拼接 {ka}-{kb} 同名图")
        manifest.setdefault(key, [])
        manifest[key] += compose_pair(ka, kb, key, key.replace("leosou", "ls").replace("junhiyo", "jh"))

    # 每个皮肤至少保底一张现成的 hero（避免某皮肤池空时毫无内容）
    if "leo" not in manifest:
        manifest["leo"] = []
    if not manifest["leo"] and (OUT.parent.parent / "public" / "images" / "leo_hero.jpg").exists():
        manifest["leo"] = ["/images/leo_hero.jpg"]
    for key in ("hiyori", "leosou", "junhiyo"):
        manifest.setdefault(key, [])

    with open(OUT / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
    print("\nmanifest:", {k: len(v) for k, v in manifest.items()})


if __name__ == "__main__":
    main()
