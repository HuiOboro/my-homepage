# -*- coding: utf-8 -*-
"""下载豆瓣海报 → 本地 WEBP。movies.json 的 poster 改为相对路径 posters/xx.webp。

用法(Windows):
  python download_posters.py
"""
import hashlib
import io
import json
import os
import sys
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed

BASE = os.path.dirname(os.path.abspath(__file__))
JSON = os.path.join(BASE, "movies.json")
POSTER_DIR = os.path.join(BASE, "posters")

UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": "https://movie.douban.com/",
}


def poster_path(title, year):
    h = hashlib.md5(f"{title}|{year}".encode("utf-8")).hexdigest()[:16]
    return os.path.join(POSTER_DIR, h + ".webp")


def download_one(m):
    """下载一张海报转 WEBP。返回 (movie, 是否新下载)。"""
    url = m.get("poster")
    if not url or url.startswith("posters/"):
        return m, False
    dst = poster_path(m["title"], m["year"])
    if os.path.exists(dst):
        m["poster"] = os.path.relpath(dst, BASE).replace("\\", "/")
        return m, False
    try:
        req = urllib.request.Request(url, headers=UA)
        data = urllib.request.urlopen(req, timeout=25).read()
        from PIL import Image
        im = Image.open(io.BytesIO(data)).convert("RGB")
        im.save(dst, "WEBP", quality=85, method=4)
        m["poster"] = os.path.relpath(dst, BASE).replace("\\", "/")
        return m, True
    except Exception as e:
        print(f"  [fail] {m['title']}: {e}")
        return m, False


def main():
    if not os.path.exists(JSON):
        print(f"!! 缺少 {JSON}, 先运行 fetch_douban.py")
        sys.exit(1)
    movies = json.load(open(JSON, encoding="utf-8"))
    todo = [m for m in movies if m.get("poster") and not m["poster"].startswith("posters/")]
    print(f"待下载海报: {len(todo)}")
    os.makedirs(POSTER_DIR, exist_ok=True)

    ok = 0
    with ThreadPoolExecutor(max_workers=6) as ex:
        futs = {ex.submit(download_one, m): m for m in todo}
        for i, fut in enumerate(as_completed(futs), 1):
            m, changed = fut.result()
            if changed:
                ok += 1
            if i % 50 == 0 or i == len(todo):
                print(f"  {i}/{len(todo)} (新下载 {ok})")

    with open(JSON, "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=1)
    print(f"完成: 新下载 {ok} 张, 已本地化 {sum(1 for m in movies if m.get('poster') and m['poster'].startswith('posters/'))} 张")


if __name__ == "__main__":
    main()
