# -*- coding: utf-8 -*-
"""读 movies.json 生成豆瓣电影筛选站(自包含静态 HTML)。

用法(Windows):
  python generate_html.py
"""
import json
import os
import sys

BASE = os.path.dirname(os.path.abspath(__file__))
JSON = os.path.join(BASE, "movies.json")
OUT = os.path.join(BASE, "top250.html")

LIME = "#65a30d"
LIME_DARK = "#365314"
LIME_BG = "#eff6d0"
RED = "#dc2626"
TEXT = "#1e293b"
MUTED = "#64748b"


def render(movies):
    genres_all = sorted({g for m in movies for g in m.get("genres") or []})
    score_opts = [("9分以上", 9.0), ("8分以上", 8.0)]
    data_json = json.dumps(movies, ensure_ascii=False).replace("</", "<\\/")
    genres_json = json.dumps(genres_all, ensure_ascii=False)

    return f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>豆瓣电影 Top250 | 朧的个人空间</title>
<style>
  * {{ margin:0; padding:0; box-sizing:border-box; }}
  body {{ font-family:"Microsoft YaHei","PingFang SC",system-ui,sans-serif; background:#f8fafc; color:{TEXT}; }}
  .wrap {{ max-width:1200px; margin:0 auto; padding:24px 16px 60px; }}
  .back {{ display:inline-block; font-size:12px; color:{MUTED}; text-decoration:none; margin-bottom:14px; }}
  .back:hover {{ color:{LIME}; }}
  h1 {{ font-size:26px; font-weight:800; }}
  .sub {{ font-size:13px; color:{MUTED}; margin-top:4px; }}
  .filters {{ position:sticky; top:0; z-index:20; background:rgba(248,250,252,.96); backdrop-filter:blur(8px);
             padding:14px 0 12px; border-bottom:1px solid #e2e8f0; margin-top:18px; }}
  .f-row {{ display:flex; flex-wrap:wrap; gap:8px; align-items:center; }}
  .search {{ flex:1 1 200px; min-width:180px; padding:8px 14px; border:1px solid #e2e8f0; border-radius:999px;
            font-size:13px; outline:none; background:#fff; }}
  .search:focus {{ border-color:{LIME}; box-shadow:0 0 0 3px rgba(101,163,13,.12); }}
  .chip {{ padding:6px 14px; border-radius:999px; font-size:12px; cursor:pointer; user-select:none;
          border:1px solid #e2e8f0; background:#fff; color:{MUTED}; transition:all .15s; }}
  .chip:hover {{ border-color:{LIME}; color:{LIME_DARK}; }}
  .chip.on {{ background:{LIME_DARK}; color:#fff; border-color:{LIME_DARK}; font-weight:700; }}
  .f-label {{ font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:.05em; }}
  .count {{ margin:16px 0 8px; font-size:12px; color:{MUTED}; }}
  .count b {{ color:{LIME_DARK}; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr)); gap:16px; }}
  .card {{ background:#fff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;
          box-shadow:0 1px 3px rgba(0,0,0,.04); transition:transform .15s, box-shadow .15s; }}
  .card:hover {{ transform:translateY(-3px); box-shadow:0 8px 20px rgba(0,0,0,.08); }}
  .poster {{ position:relative; aspect-ratio:2/3; background:{LIME_BG}; }}
  .poster img {{ width:100%; height:100%; object-fit:cover; display:block; }}
  .poster .score {{ position:absolute; top:8px; right:8px; background:rgba(0,0,0,.72); color:#fff;
                    font-weight:800; font-size:14px; padding:3px 8px; border-radius:8px; }}
  .poster .score.high {{ background:#dc2626; }}
  .poster .rank {{ position:absolute; top:8px; left:8px; background:rgba(255,255,255,.9); color:{LIME_DARK};
                   font-weight:800; font-size:12px; padding:2px 8px; border-radius:8px; }}
  .pbody {{ padding:10px 12px 14px; }}
  .pbody h3 {{ font-size:14px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }}
  .meta {{ font-size:11px; color:{MUTED}; margin-top:4px; }}
  .tags {{ margin-top:6px; display:flex; flex-wrap:wrap; gap:4px; }}
  .tag {{ font-size:10px; color:{LIME_DARK}; background:{LIME_BG}; padding:1px 7px; border-radius:999px; }}
  .empty {{ text-align:center; padding:60px 0; color:{MUTED}; }}
  @media (max-width:760px) {{ .grid {{ grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px; }} }}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="/">← 返回首页</a>
  <h1>豆瓣电影 Top250</h1>
  <div class="sub">爬取自豆瓣 · 电影榜单信息 · 个人练习</div>

  <div class="filters">
    <div class="f-row">
      <input class="search" id="q" placeholder="🔍 搜索片名 / 导演" oninput="render()"/>
      <span class="f-label">类型</span>
      <span class="chip on" data-g="" onclick="setGenre(this)">全部</span>
      <div id="genreChips" style="display:contents"></div>
      <span class="f-label">评分</span>
      <span class="chip on" data-s="0" onclick="setScore(this)">全部</span>
      <span class="chip" data-s="9" onclick="setScore(this)">9分+</span>
      <span class="chip" data-s="8" onclick="setScore(this)">8分+</span>
    </div>
  </div>
  <div class="count">共 <b id="cnt">0</b> 部电影</div>
  <div class="grid" id="grid"></div>
</div>

<script>
const DATA = {data_json};
const GENRES = {genres_json};
let state = {{ g: "", s: 0, q: "" }};

const chips = document.getElementById('genreChips');
chips.innerHTML = GENRES.map(g => `<span class="chip" data-g="${{g}}" onclick="setGenre(this)">${{g}}</span>`).join('');

function setGenre(el) {{
  document.querySelectorAll('#genreChips .chip, [data-g=""]').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  state.g = el.dataset.g; render();
}}
function setScore(el) {{
  document.querySelectorAll('[data-s]').forEach(c => c.classList.remove('on'));
  el.classList.add('on');
  state.s = parseFloat(el.dataset.s) || 0; render();
}}
function scoreCls(score) {{
  const v = parseFloat(score) || 0;
  return v >= 9 ? 'high' : '';
}}
function render() {{
  state.q = (document.getElementById('q').value || '').trim().toLowerCase();
  let list = DATA.filter(m => {{
    if (state.g && !(m.genres || []).includes(state.g)) return false;
    if (state.s && (parseFloat(m.score) || 0) < state.s) return false;
    if (state.q) {{
      const hay = ((m.title || '') + ' ' + (m.director || '') + ' ' + (m.stars || '')).toLowerCase();
      if (!hay.includes(state.q)) return false;
    }}
    return true;
  }});
  document.getElementById('cnt').textContent = list.length;
  const grid = document.getElementById('grid');
  if (!list.length) {{ grid.innerHTML = '<div class="empty">没有符合条件的电影</div>'; return; }}
  grid.innerHTML = list.map(m => {{
    const img = m.poster
      ? `<img src="${{m.poster}}" alt="${{m.title}}" loading="lazy"/>`
      : `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:{MUTED};font-size:12px;padding:8px">暂无海报</div>`;
    const score = parseFloat(m.score);
    return `<div class="card">
      <div class="poster">${{img}}
        <span class="rank">#${{m.rank || '-'}}</span>
        ${{score ? `<span class="score ${{scoreCls(score)}}">${{score}}</span>` : ''}}
      </div>
      <div class="pbody">
        <h3 title="${{m.title}}">${{m.title}}</h3>
        <div class="meta">${{[m.year, m.region].filter(Boolean).join(' · ')}}</div>
        ${{(m.genres || []).length ? `<div class="tags">${{m.genres.map(g => `<span class="tag">${{g}}</span>`).join('')}}</div>` : ''}}
        <div class="meta" style="margin-top:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${{m.director || ''}}</div>
      </div>
    </div>`;
  }}).join('');
}}
render();
</script>
</body>
</html>"""


def main():
    if not os.path.exists(JSON):
        print(f"!! 缺少 {JSON}, 先运行 fetch_douban.py")
        sys.exit(1)
    movies = json.load(open(JSON, encoding="utf-8"))
    html = render(movies)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"✅ 已生成 {OUT} ({len(movies)} 部电影)")


if __name__ == "__main__":
    main()
