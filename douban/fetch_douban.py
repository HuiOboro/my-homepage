# -*- coding: utf-8 -*-
"""抓取豆瓣电影榜单(Top250 + 分类榜) → movies.json。

用法(Windows):
  python fetch_douban.py

解析方式:
  - Top250 页面: BeautifulSoup + CSS 选择器(解析器 lxml)
  - 分类榜: JSON 接口
"""
import json
import os
import re
import sys
import time
import urllib.request
from bs4 import BeautifulSoup

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


def split_bd(ptext):
    """把 '导演: XX 主演: YY 1994 / 美国 / 犯罪 剧情' 拆成 (director, stars, meta)。"""
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
    return director, stars, meta


def split_meta(meta):
    """把 '1994 / 美国 / 犯罪 剧情' 拆成 (year, region, genres)。"""
    year, region, genres = "", "", []
    m = re.match(r"^(\d{4})\s*/\s*(.*?)(?:\s*/\s*(.*))?$", meta, re.S)
    if m:
        year = m.group(1)
        region = (m.group(2) or "").strip()
        if m.group(3):
            genres = [x.strip() for x in re.split(r"\s+", m.group(3)) if x.strip()]
    return year, region, genres


def parse_top250_page(html):
    """BeautifulSoup + CSS 选择器解析 Top250 一页(25条)。"""
    soup = BeautifulSoup(html, "lxml")
    out = []
    for item in soup.select("ol.grid_view li .item"):
        rank_el = item.select_one("em")
        title_el = item.select_one("span.title")
        img_el = item.select_one("img")
        p_el = item.select_one("div.bd > p")
        quote_el = item.select_one("p.quote span")
        score_el = item.select_one("span.rating_num")

        rank = rank_el.get_text(strip=True) if rank_el else None
        title = title_el.get_text(strip=True) if title_el else None
        poster = img_el.get("src") if img_el else None
        quote = quote_el.get_text(strip=True) if quote_el else None
        score = score_el.get_text(strip=True) if score_el else None
        votes = None
        m = re.search(r"([\d,]+)人评价", item.get_text())
        if m:
            votes = m.group(1)
        ptext = re.sub(r"\s+", " ", p_el.get_text(" ", strip=True)) if p_el else ""

        director, stars, meta = split_bd(ptext)
        year, region, genres = split_meta(meta)

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
    print("== Top250 (BeautifulSoup) ==")
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
