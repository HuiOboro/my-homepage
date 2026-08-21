# -*- coding: utf-8 -*-
"""一键：抓取 → 生成 → 同步到 public/steam/。供 update_and_deploy.bat 调用。

用法(Windows):
  python update_steam.py
"""
import os
import shutil
import subprocess
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
PUBLIC_STEAM = os.path.join(os.path.dirname(BASE), "public", "steam")
REPO_ROOT = os.path.dirname(BASE)

# 中文 Windows 控制台默认 GBK，无法打印 ✅(U+2705) 等字符，强制 UTF-8 输出
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")


def sync_to_public(src, public_dir):
    """把生成的 HTML 复制到网站 public/steam/ 目录。"""
    os.makedirs(public_dir, exist_ok=True)
    shutil.copyfile(src, os.path.join(public_dir, "steam-prices.html"))


def run_script(name):
    """用同一解释器以模块方式运行同目录下的子脚本，失败则退出。

    以 `-m steam_monitor.<模块>` 在仓库根目录运行，确保子脚本能
    `from steam_monitor import ...`（直接按脚本运行会把脚本所在目录
    而非仓库根目录放进 sys.path）。
    """
    module = f"steam_monitor.{os.path.splitext(name)[0]}"
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    r = subprocess.run([sys.executable, "-m", module], cwd=REPO_ROOT, env=env)
    if r.returncode != 0:
        print(f"!! {name} 失败，退出码 {r.returncode}")
        sys.exit(1)


def main():
    print("===== [1/2] fetch prices =====  ")
    run_script("fetch_prices.py")
    print("\n===== [2/2] generate html =====  ")
    run_script("generate_html.py")
    sync_to_public(os.path.join(BASE, "steam-prices.html"), PUBLIC_STEAM)
    print(f"✅ 已同步到 {PUBLIC_STEAM}")
    print("完成! 推送后访问 huioboro.xyz/steam/steam-prices.html")


if __name__ == "__main__":
    main()
