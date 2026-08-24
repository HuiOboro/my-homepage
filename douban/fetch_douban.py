# -*- coding: utf-8 -*-
"""抓取豆瓣电影榜单(Top250 + 分类榜) → movies.json。

用法(Windows):
  python fetch_douban.py
"""
import json
import os
import re
import sys
import time
import urllib.request

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "movies.json")

UA = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/126.0 Safari/537.36",
    "Referer": "https://movie.douban.com/",
}
SLEEP = 1.5  # 秒,请求间隔,防封

# 分类榜类型 (type_id, 名称)
CHART_TYPES = [
    (11, "剧情"), (24, "喜剧"), (5, "动作"),
    (13, "爱情"), (17, "科幻"), (25, "动画"),
]


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=30).read().decode("utf-8")


def clean(text):
    return re.sub(r"\s+", " ", text.replace("&nbsp;", " ").replace("\xa0", " ")).strip()


def parse_top250_page(html):
    """解析 Top250 一页(25条)的 HTML。"""
    items = re.findall(r'<li>.*?<div class="item">(.*?)</div>\s*</li>', html, re.S)
    out = []
    for raw in items:
        def g(pat, group=1):
            m = re.search(pat, raw, re.S)
            return m.group(group) if m else None
        rank = g(r"<em>(\d+)</em>")
        title = g(r'<span class="title">([^<]+)</span>')
        poster = g(r'<img[^>]*src="([^"]+)"')
        ptext = clean(g(r"<p>\s*(.*?)</p>") or "")
        quote = g(r'<p class="quote">\s*<span>([^<]+)</span>')
        score = g(r'<span class="rating_num"[^>]*>([^<]+)</span>')
        votes = g(r"<span>([\d,]+)人评价</span>")

        director, stars, meta = "", "", ""
        parts = re.split(r"导演:|主演:", ptext)
        if len(parts) > 1:
            director = parts[1].strip()
        if len(parts) > 2:
            tail = parts[2].strip()
            m = re.match(r"^(.*?)\s+(\d{4})\s*/\s*(.+)$", tail, re.S)
            if m:
                stars = m.group(1).strip()
                meta = f"{m.group(2)} / {m.group(3)}".strip()
            else:
                stars = tail

        year, region, genres = "", "", []
        mmeta = re.match(r"^(\d{4})\s*/\s*(.*?)(?:\s*/\s*(.*))?$", meta, re.S)
        if mmeta:
            year = mmeta.group(1)
            region = (mmeta.group(2) or "").strip()
            if mmeta.group(3):
                genres = [x.strip() for x in re.split(r"\s+", mmeta.group(3)) if x.strip()]

        out.append({
            "rank": rank, "title": title, "poster": poster,
            "director": director, "stars": stars, "year": year,
            "region": region, "genres": genres, "quote": quote,
            "score": score, "votes": votes,
        })
    return out


def fetch_top250():
    movies = []
    for page in range(10):
        url = f"https://movie.douban.com/top250?start={page * 25}"
        try:
            html = fetch(url)
        except Exception as e:
            print(f"  [fail] top250 page {page}: {e}")
            continue
        movies.extend(parse_top250_page(html))
        print(f"  top250 page {page}: 累计 {len(movies)}")
        time.sleep(SLEEP)
    return movies


def fetch_charts():
    movies = []
    for tid, tname in CHART_TYPES:
        url = (f"https://movie.douban.com/j/chart/top_list?type={tid}"
               f"&interval_id=100:90&start=0&limit=50")
        try:
            data = json.loads(fetch(url))
        except Exception as e:
            print(f"  [fail] {tname}: {e}")
            continue
        for it in data:
            movies.append({
                "rank": it.get("rank"), "title": it.get("title", ""),
                "poster": it.get("cover_url"), "director": "",
                "stars": "/".join((it.get("actors") or [])[:4]),
                "year": (it.get("release_date") or "")[:4],
                "region": "/".join(it.get("regions") or []),
                "genres": it.get("types") or [], "quote": "",
                "score": it.get("score"), "votes": it.get("vote_count"),
            })
        print(f"  chart {tname}: +{len(data)}")
        time.sleep(SLEEP)
    return movies


def main():
    print("== Top250 ==")
    top = fetch_top250()
    print("== 分类榜 ==")
    charts = fetch_charts()

    # 合并去重: (title, year) 唯一, Top250 优先(字段全)
    merged = {}
    for m in top:
        merged[(m["title"], m["year"])] = m
    added = 0
    for m in charts:
        key = (m["title"], m["year"])
        if key not in merged:
            merged[key] = m
            added += 1

    movies = sorted(merged.values(),
                    key=lambda m: float(m["score"] or 0), reverse=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=1)

    with_score = sum(1 for m in movies if m["score"])
    with_poster = sum(1 for m in movies if m["poster"])
    with_quote = sum(1 for m in movies if m["quote"])
    print(f"\nTop250: {len(top)} | 分类榜新增: {added} | 合计去重: {len(movies)}")
    print(f"有评分: {with_score} | 有海报: {with_poster} | 有简介: {with_quote}")
    print(f"保存 {OUT}")


if __name__ == "__main__":
    main()
