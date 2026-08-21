# -*- coding: utf-8 -*-
import json
import unittest
from unittest import mock

from steam_monitor import fetch_prices


def payload(appid=1091500, price=29800, discount=0, has_price=True,
            name="赛博朋克 2077", header="http://img/header.jpg"):
    po = {"currency": "CNY", "initial": price, "final": price,
          "discount_percent": discount, "initial_formatted": "¥298",
          "final_formatted": "¥298"} if has_price else None
    return {
        str(appid): {
            "success": True,
            "data": {"name": name, "header_image": header,
                     "price_overview": po},
        }
    }


class ParseTest(unittest.TestCase):
    def test_parses_normal(self):
        rec = fetch_prices.parse_price_payload(payload(), 1091500)
        self.assertEqual(rec["name"], "赛博朋克 2077")
        self.assertEqual(rec["price_cn"], 29800)
        self.assertEqual(rec["original_cn"], 29800)
        self.assertEqual(rec["discount"], 0)
        self.assertEqual(rec["image_url"], "http://img/header.jpg")

    def test_discount_parsed(self):
        rec = fetch_prices.parse_price_payload(
            payload(price=19800, discount=34), 1091500)
        self.assertEqual(rec["price_cn"], 19800)
        self.assertEqual(rec["discount"], 34)

    def test_no_price_returns_none(self):
        self.assertIsNone(
            fetch_prices.parse_price_payload(payload(has_price=False), 1091500))

    def test_success_false_returns_none(self):
        p = {str(1091500): {"success": False}}
        self.assertIsNone(fetch_prices.parse_price_payload(p, 1091500))


def _ctx(data_bytes):
    """构造一个 mock 上下文管理器，with 解包后 read() 返回给定 bytes。"""
    cm = mock.MagicMock()
    cm.__enter__.return_value = mock.MagicMock(read=lambda: data_bytes)
    cm.__exit__.return_value = False
    return cm


class FetchTest(unittest.TestCase):
    @mock.patch("steam_monitor.fetch_prices.urllib.request.urlopen")
    def test_retries_then_succeeds(self, mock_open):
        # 前两次抛异常，第三次成功
        mock_open.side_effect = [
            OSError("timeout"), OSError("timeout"),
            _ctx(json.dumps(payload()).encode()),
        ]
        with mock.patch("time.sleep"):
            data = fetch_prices.fetch_appid(1091500, retries=3)
        self.assertEqual(mock_open.call_count, 3)
        self.assertEqual(data["1091500"]["success"], True)

    @mock.patch("steam_monitor.fetch_prices.urllib.request.urlopen")
    def test_all_fail_returns_none(self, mock_open):
        mock_open.side_effect = OSError("down")
        with mock.patch("time.sleep"):
            data = fetch_prices.fetch_appid(1091500, retries=2)
        self.assertIsNone(data)

    @mock.patch("steam_monitor.fetch_prices.urllib.request.urlopen")
    def test_success_parses_json(self, mock_open):
        mock_open.return_value = _ctx(json.dumps(payload()).encode())
        data = fetch_prices.fetch_appid(1091500, retries=1)
        self.assertEqual(data["1091500"]["success"], True)


if __name__ == "__main__":
    unittest.main()
