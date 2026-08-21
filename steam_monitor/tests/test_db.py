# -*- coding: utf-8 -*-
import os
import sqlite3
import tempfile
import unittest
from datetime import date, timedelta

from steam_monitor import db


class DbTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.db_path = os.path.join(self.tmp, "test.db")
        self.conn = db.connect(self.db_path)

    def tearDown(self):
        self.conn.close()

    def _record(self, appid=1091500, name="赛博朋克 2077", price=29800,
                original=29800, discount=0, day_offset=0):
        return {
            "appid": appid, "name": name, "image_url": "http://img/x.jpg",
            "price_cn": price, "original_cn": original, "discount": discount,
            "date": (date.today() - timedelta(days=day_offset)).isoformat(),
        }

    def test_upsert_same_day_dedupes(self):
        db.upsert_price(self.conn, self._record(price=29800))
        db.upsert_price(self.conn, self._record(price=26800))  # 同一天降价重抓
        cur = self.conn.execute("SELECT COUNT(*) FROM price_history").fetchone()[0]
        self.assertEqual(cur, 1)
        got = self.conn.execute("SELECT price_cn FROM price_history").fetchone()[0]
        self.assertEqual(got, 26800)  # 后写覆盖先写

    def test_get_history_ascending(self):
        db.upsert_price(self.conn, self._record(price=29800, day_offset=2))
        db.upsert_price(self.conn, self._record(price=19800, day_offset=1))
        db.upsert_price(self.conn, self._record(price=19800, day_offset=0))
        rows = db.get_history(self.conn, 1091500)
        prices = [r["price_cn"] for r in rows]
        self.assertEqual(prices, [29800, 19800, 19800])
        dates = [r["date"] for r in rows]
        self.assertEqual(dates, sorted(dates))

    def test_get_history_only_that_appid(self):
        db.upsert_price(self.conn, self._record(appid=1091500))
        db.upsert_price(self.conn, self._record(appid=1245620))
        rows = db.get_history(self.conn, 1091500)
        self.assertEqual(len(rows), 1)

    def test_get_history_days_filter(self):
        for off in (5, 3, 1, 0):
            db.upsert_price(self.conn, self._record(day_offset=off))
        rows = db.get_history(self.conn, 1091500, days=4)  # 近4天
        # 5天前的应被过滤
        self.assertEqual(len(rows), 3)


if __name__ == "__main__":
    unittest.main()
