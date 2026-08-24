# -*- coding: utf-8 -*-
"""一键: 抓取 → 海报 → 生成 → 同步 public/douban/。

用法(Windows):
  python update.py
"""
import os
import shutil
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DOUBAN = os.path.join(os.path.dirname(BASE), "public", "douban")


def run(name):
    print(f"===== {name} =====")
    r = subprocess.run([sys.executable, os.path.join(BASE, name)], cwd=BASE)
    if r.returncode != 0:
        print(f"!! {name} 失败")
        sys.exit(1)


def main():
    run("fetch_douban.py")
    run("download_posters.py")
    run("generate_html.py")
    os.makedirs(PUBLIC_DOUBAN, exist_ok=True)
    shutil.copyfile(os.path.join(BASE, "top250.html"),
                    os.path.join(PUBLIC_DOUBAN, "top250.html"))
    posters_src = os.path.join(BASE, "posters")
    if os.path.isdir(posters_src):
        shutil.copytree(posters_src, os.path.join(PUBLIC_DOUBAN, "posters"),
                        dirs_exist_ok=True)
    print(f"✅ 已同步到 {PUBLIC_DOUBAN} (top250.html + posters/)")


if __name__ == "__main__":
    main()
