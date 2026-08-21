# -*- coding: utf-8 -*-
"""抓取 Steam 游戏价格并写入 SQLite。

用法(Windows):
  python fetch_prices.py          # 单独抓取入库
"""
import json
import os
import sys
import time
import urllib.request
from datetime import date

from steam_monitor import config, db

API_URL = "https://store.steampowered.com/api/appdetails"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
RETRIES = 3
RETRY_WAIT = 2  # 秒


def parse_price_payload(payload, appid):
    """从 Steam API 响应 JSON 提取价格记录。

    返回 dict（含 name/image_url/price_cn/original_cn/discount），
    无价格或 success=False 时返回 None。
    """
    info = payload.get(str(appid)) or payload.get(appid)
    if not info or not info.get("success"):
        return None
    data = info.get("data") or {}
    po = data.get("price_overview")
    if not po:
        return None  # 免费 / 下架 / 地区限制
    return {
        "name": data.get("name") or "",
        "image_url": data.get("header_image"),
        "price_cn": po.get("final"),
        "original_cn": po.get("initial"),
        "discount": po.get("discount_percent", 0),
    }


def fetch_appid(appid, retries=RETRIES, timeout=30):
    """抓取单个 appid 的 API 响应。重试 retries 次，全失败返回 None。"""
    url = f"{API_URL}?appids={appid}&cc=cn&l=schinese"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            if attempt < retries - 1:
                time.sleep(RETRY_WAIT)
    return None


def main():
    conn = db.connect()
    today = date.today().isoformat()
    ok_count = 0
    fail_list = []
    for g in config.GAMES:
        appid = g["appid"]
        payload = fetch_appid(appid)
        if payload is None:
            fail_list.append(g["name"])
            print(f"[失败] {g['name']}: 抓取超时(重试{RETRIES}次后仍失败)")
            continue
        rec = parse_price_payload(payload, appid)
        if rec is None:
            fail_list.append(g["name"])
            print(f"[跳过] {g['name']}: 无价格数据(免费/下架/地区限制)")
            continue
        rec["appid"] = appid
        rec["name"] = rec["name"] or g["name"]
        rec["date"] = today
        db.upsert_price(conn, rec)
        ok_count += 1
        print(f"[OK] {rec['name']}: ¥{rec['price_cn']/100:.2f} "
              f"(原价¥{rec['original_cn']/100:.2f} 折扣{rec['discount']}%)")
    conn.close()

    print(f"\n成功 {ok_count}/{len(config.GAMES)} 款")
    if fail_list:
        print(f"失败/跳过: {', '.join(fail_list)}")
    if ok_count == 0:
        print("!! 全部抓取失败，本次不生成页面")
        sys.exit(1)


if __name__ == "__main__":
    main()
