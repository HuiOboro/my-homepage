# -*- coding: utf-8 -*-
import os
import tempfile
import unittest
from datetime import date, timedelta

from steam_monitor import config, db, generate_html


class FormatTest(unittest.TestCase):
    def test_integer_cents(self):
        self.assertEqual(generate_html.format_price(29800), "298")
        self.assertEqual(generate_html.format_price(19800), "198")
        self.assertEqual(generate_html.format_price(68), "0.68")

    def test_half_yuan(self):
        self.assertEqual(generate_html.format_price(19850), "198.5")


class SvgTest(unittest.TestCase):
    def test_svg_contains_polyline_and_low_price(self):
        points = [
            ("2026-08-18", 29800), ("2026-08-19", 25800), ("2026-08-20", 25800),
        ]
        svg = generate_html.build_svg(points)
        self.assertIn("<svg", svg)
        self.assertIn("polyline", svg)
        self.assertIn("258", svg)  # 最低价文字

    def test_single_point_no_crash(self):
        svg = generate_html.build_svg([("2026-08-20", 29800)])
        self.assertIn("<svg", svg)

    def test_empty_points(self):
        svg = generate_html.build_svg([])
        self.assertEqual(svg, "")


class RenderTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp()
        self.conn = db.connect(os.path.join(self.tmp, "test.db"))
        self.appid = config.GAMES[0]["appid"]
        self.name = config.GAMES[0]["name"]
        for off, price in ((2, 29800), (1, 19800), (0, 19800)):
            db.upsert_price(self.conn, {
                "appid": self.appid, "name": self.name,
                "image_url": "http://img/header.jpg",
                "price_cn": price, "original_cn": 29800, "discount": 34,
                "date": (date.today() - timedelta(days=off)).isoformat(),
            })

    def tearDown(self):
        self.conn.close()

    def test_render_contains_card_and_low_badge(self):
        cards = generate_html.build_cards(self.conn, config.GAMES, days=30)
        self.assertEqual(len(cards), 1)
        self.assertIn(self.name, cards[0])
        self.assertIn("历史新低", cards[0])  # 198 是历史最低且当前即最低
        self.assertIn("<svg", cards[0])

    def test_render_page_full(self):
        html = generate_html.render_page(self.conn, config.GAMES, days=30)
        self.assertIn("<!DOCTYPE html>", html)
        self.assertIn("Steam 游戏价格监控", html)
        self.assertIn(self.name, html)
        self.assertIn("每日自动更新", html)


if __name__ == "__main__":
    unittest.main()
