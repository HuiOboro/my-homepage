# -*- coding: utf-8 -*-
"""读取 SQLite 生成自包含静态 HTML（SVG 手绘价格曲线，零 CDN 依赖）。

用法(Windows):
  python generate_html.py         # 读库生成 steam-prices.html
"""
import os
import sys
from datetime import date, timedelta

from steam_monitor import config, db

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "steam-prices.html")

# 配色沿用网站 lime/深色风格
LIME = "#65a30d"
LIME_DARK = "#365314"
LIME_BG = "#eff6d0"
RED = "#dc2626"
TEXT = "#1e293b"
MUTED = "#64748b"


def format_price(cents):
    """29800 -> '298'；19850 -> '198.5'。单位分转元，去多余零。"""
    if cents is None:
        return "?"
    yuan = cents / 100
    if yuan == int(yuan):
        return str(int(yuan))
    return f"{yuan:g}"


def build_svg(points, width=620, height=150):
    """根据 [(date, price_cn), ...] 生成内联 SVG 折线图。

    无数据返回空串。标注最低点价格，画最大/最小两条水平虚线。
    """
    if not points:
        return ""
    n = len(points)
    pad_l, pad_r, pad_t, pad_b = 46, 12, 12, 26
    plot_w = width - pad_l - pad_r
    plot_h = height - pad_t - pad_b
    prices = [p for _, p in points]
    lo, hi = min(prices), max(prices)
    span = hi - lo if hi != lo else 1

    def xs(i):
        return pad_l + (plot_w * i / (n - 1) if n > 1 else plot_w / 2)

    def ys(p):
        return pad_t + plot_h * (1 - (p - lo) / span)

    parts = [f'<svg viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg" '
             f'style="width:100%;height:auto;">']
    # 最大/最小网格虚线 + 价格标签
    for label, p in (("¥" + format_price(hi), hi), ("¥" + format_price(lo), lo)):
        y = ys(p)
        parts.append(
            f'<line x1="{pad_l}" y1="{y:.1f}" x2="{width-pad_r}" y2="{y:.1f}" '
            f'stroke="#e2e8f0" stroke-dasharray="3,3"/>'
        )
        parts.append(
            f'<text x="{pad_l-4}" y="{y+4:.1f}" text-anchor="end" '
            f'font-size="10" fill="{MUTED}">{label}</text>'
        )
    # 折线
    pts = " ".join(f"{xs(i):.1f},{ys(p):.1f}" for i, (_, p) in enumerate(points))
    parts.append(f'<polyline points="{pts}" fill="none" stroke="{LIME}" '
                 f'stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>')
    # 最低点高亮
    min_idx = prices.index(lo)
    mx, my = xs(min_idx), ys(lo)
    parts.append(f'<circle cx="{mx:.1f}" cy="{my:.1f}" r="4" fill="{RED}"/>')
    # 首末日期
    parts.append(f'<text x="{pad_l}" y="{height-6}" font-size="10" fill="{MUTED}">{points[0][0]}</text>')
    parts.append(f'<text x="{width-pad_r}" y="{height-6}" text-anchor="end" '
                 f'font-size="10" fill="{MUTED}">{points[-1][0]}</text>')
    parts.append("</svg>")
    return "".join(parts)


def build_cards(conn, games, days=30):
    """为每款游戏生成一张卡片 HTML。返回卡片 HTML 列表。"""
    cutoff = (date.today() - timedelta(days=days - 1)).isoformat()
    cards = []
    for g in games:
        rows = db.get_history(conn, g["appid"])  # 全量，算历史最低
        if not rows:
            continue
        recent = [r for r in rows if r["date"] >= cutoff]
        if not recent:
            recent = rows[-1:]  # 兜底：至少显示最新一条
        latest = rows[-1]
        prices = [r["price_cn"] for r in rows]
        lo = min(prices)
        lo_date = next(r["date"] for r in rows if r["price_cn"] == lo)
        current = latest["price_cn"]
        discount = latest["discount"]
        is_new_low = current <= lo and len(rows) > 1

        img = f'<img class="card-img" src="{latest["image_url"]}" alt="{g["name"]}" loading="lazy"/>' \
            if latest["image_url"] else f'<div class="card-img card-img-empty">{g["name"]}</div>'
        orig_html = f'<span class="orig">¥{format_price(latest["original_cn"])}</span>' if discount > 0 else ""
        disc_html = f'<span class="disc">-{discount}%</span>' if discount > 0 else ""
        low_html = '<span class="low-badge">历史新低</span>' if is_new_low else ""
        points = [(r["date"], r["price_cn"]) for r in recent]

        cards.append(f"""
        <div class="card">
          {img}
          <div class="card-body">
            <h2>{g["name"]}</h2>
            <div class="price-row">
              <span class="now">¥{format_price(current)}</span>
              {orig_html}
              {disc_html}
            </div>
            <div class="meta">历史最低 <span class="low">¥{format_price(lo)}</span>（{lo_date}）{low_html}</div>
            <div class="chart">{build_svg(points)}</div>
            <div class="updated">最近更新：{latest["date"]}</div>
          </div>
        </div>""")
    return cards


def render_page(conn, games, days=30):
    """生成完整 HTML 字符串。"""
    cards = build_cards(conn, games, days)
    updated = date.today().isoformat()
    total = len(cards)
    cards_html = "\n".join(cards)
    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Steam 游戏价格监控 | 朧的个人空间</title>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family:"Microsoft YaHei","PingFang SC",system-ui,sans-serif; background:#f8fafc; color:{TEXT}; }}
  .wrap {{ max-width:1080px; margin:0 auto; padding:32px 20px 60px; }}
  .back {{ display:inline-block; font-size:12px; color:{MUTED}; text-decoration:none; margin-bottom:14px; }}
  .back:hover {{ color:{LIME}; }}
  h1 {{ font-size:26px; font-weight:800; }}
  .topbar {{ display:flex; flex-wrap:wrap; gap:10px 22px; align-items:center;
             background:#1f2937; color:#e2e8f0; border-radius:16px; padding:18px 22px; margin-top:18px; }}
  .topbar .num {{ font-size:28px; font-weight:800; color:{LIME}; }}
  .tag {{ background:{LIME_DARK}; color:#fff; font-size:12px; font-weight:700; padding:4px 10px; border-radius:999px; }}
  .src {{ font-size:12px; color:#94a3b8; }}
  .cards {{ display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:24px; }}
  @media (max-width:760px) {{ .cards {{ grid-template-columns:1fr; }} }}
  .card {{ background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden;
           box-shadow:0 1px 3px rgba(0,0,0,.04); }}
  .card-img {{ width:100%; height:150px; object-fit:cover; background:{LIME_BG}; }}
  .card-img-empty {{ display:flex; align-items:center; justify-content:center; color:{MUTED}; font-size:15px; }}
  .card-body {{ padding:16px 18px 18px; }}
  .card-body h2 {{ font-size:17px; font-weight:800; }}
  .price-row {{ display:flex; align-items:baseline; gap:10px; margin-top:8px; flex-wrap:wrap; }}
  .now {{ font-size:26px; font-weight:800; color:{LIME_DARK}; }}
  .orig {{ font-size:13px; color:#94a3b8; text-decoration:line-through; }}
  .disc {{ background:#ef4444; color:#fff; font-size:12px; font-weight:700; padding:2px 8px; border-radius:6px; }}
  .meta {{ margin-top:10px; font-size:13px; color:{MUTED}; }}
  .low {{ color:{RED}; font-weight:700; }}
  .low-badge {{ display:inline-block; background:#fee2e2; color:#b91c1c; font-size:11px; font-weight:700;
               padding:2px 8px; border-radius:6px; margin-left:6px; }}
  .chart {{ margin-top:12px; }}
  .updated {{ margin-top:8px; font-size:11px; color:#94a3b8; }}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="/es">← 返回工具箱</a>
  <h1>Steam 游戏价格监控</h1>
  <div class="topbar">
    <span>监控 <span class="num">{total}</span> 款游戏</span>
    <span class="tag">数据每日自动更新</span>
    <span class="src">数据来源：Steam 官方价格接口</span>
    <span class="src">最近更新：{updated}</span>
  </div>
  <div class="cards">
{cards_html}
  </div>
</div>
</body>
</html>"""


def main():
    if not os.path.exists(db.DB_PATH):
        print(f"!! 数据库不存在: {db.DB_PATH}，请先运行 fetch_prices.py")
        sys.exit(1)
    conn = db.connect()
    try:
        html = render_page(conn, config.GAMES)
    finally:
        conn.close()
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ 已生成 {OUT}")


if __name__ == "__main__":
    main()
