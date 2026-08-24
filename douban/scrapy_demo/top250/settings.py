# -*- coding: utf-8 -*-
BOT_NAME = "top250"
SPIDER_MODULES = ["top250.spiders"]
NEWSPIDER_MODULE = "top250.spiders"

# 豆瓣反爬: 放慢速度, 串行请求
CONCURRENT_REQUESTS = 1
DOWNLOAD_DELAY = 1.5
ROBOTSTXT_OBEY = False  # demo 用, 实际生产应遵守 robots.txt 并控制频率

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)

# 输出到 JSON(UTF-8, 不转义中文)
FEEDS = {
    "top250.json": {
        "format": "json",
        "encoding": "utf-8",
        "ensure_ascii": False,
    }
}

LOG_LEVEL = "INFO"
