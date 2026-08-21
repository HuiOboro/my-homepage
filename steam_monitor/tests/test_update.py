# -*- coding: utf-8 -*-
import os
import tempfile
import unittest

from steam_monitor import update_steam


class SyncTest(unittest.TestCase):
    def test_sync_output_to_public(self):
        tmp = tempfile.mkdtemp()
        src = os.path.join(tmp, "steam-prices.html")
        with open(src, "w", encoding="utf-8") as f:
            f.write("<html>ok</html>")
        public_dir = os.path.join(tmp, "public", "steam")
        update_steam.sync_to_public(src, public_dir)
        self.assertTrue(os.path.exists(os.path.join(public_dir, "steam-prices.html")))


if __name__ == "__main__":
    unittest.main()
