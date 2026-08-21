# -*- coding: utf-8 -*-
"""SQLite 访问层：建表、upsert、查询。数据文件 steam_prices.db 不提交 git。"""
import os
import sqlite3
from datetime import date, timedelta

BASE = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE, "steam_prices.db")


def connect(db_path=DB_PATH):
    """打开连接并确保表存在。返回 sqlite3.Connection。"""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS price_history (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            appid       INTEGER NOT NULL,
            name        TEXT NOT NULL,
            image_url   TEXT,
            price_cn    INTEGER NOT NULL,
            original_cn INTEGER NOT NULL,
            discount    INTEGER NOT NULL DEFAULT 0,
            date        TEXT NOT NULL,
            UNIQUE(appid, date)
        )
        """
    )
    conn.commit()
    return conn


def upsert_price(conn, record):
    """写入一条记录。同 (appid, date) 重复时用新值覆盖。"""
    conn.execute(
        """
        INSERT OR REPLACE INTO price_history
            (appid, name, image_url, price_cn, original_cn, discount, date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            record["appid"], record["name"], record["image_url"],
            record["price_cn"], record["original_cn"], record["discount"],
            record["date"],
        ),
    )
    conn.commit()


def get_history(conn, appid, days=None):
    """返回某 appid 的价格记录（dict 列表），按日期升序。
    days 给定时只取最近 N 天（含今天）。"""
    if days is not None:
        start = (date.today() - timedelta(days=days - 1)).isoformat()
        rows = conn.execute(
            "SELECT * FROM price_history WHERE appid=? AND date >= ? ORDER BY date",
            (appid, start),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM price_history WHERE appid=? ORDER BY date", (appid,)
        ).fetchall()
    return [dict(r) for r in rows]
