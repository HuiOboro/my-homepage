# -*- coding: utf-8 -*-
"""豆瓣 Top250 Scrapy 爬虫 demo。

用法(Windows, 在 scrapy_demo/ 下):
  scrapy crawl top250
  # 输出到 top250.json(settings.py 的 FEEDS 配置)

选择器示例(同样可用 XPath):
  response.css('span.title::text')   ==  response.xpath('//span[@class="title"]/text()')
"""
import re

import scrapy

from ..items import DoubanMovieItem


class Top250Spider(scrapy.Spider):
    name = "top250"
    allowed_domains = ["movie.douban.com"]
    start_urls = [
        f"https://movie.douban.com/top250?start={i * 25}" for i in range(10)
    ]

    def parse(self, response):
        for sel in response.css("ol.grid_view li .item"):
            item = DoubanMovieItem()
            item["rank"] = sel.css("em::text").get()
            item["title"] = sel.css("span.title::text").get()
            item["score"] = sel.css("span.rating_num::text").get()
            item["quote"] = sel.css("p.quote span::text").get()
            votes = re.search(r"([\d,]+)人评价", sel.get())
            item["votes"] = votes.group(1) if votes else None
            director, stars, year = self._parse_bd(sel)
            item["director"] = director
            item["stars"] = stars
            item["year"] = year
            yield item

    def _parse_bd(self, sel):
        """从 '导演: X 主演: Y 1994 / 美国 / 犯罪 剧情' 提取 (导演, 主演, 年份)。"""
        ptext = " ".join(sel.css("div.bd > p::text").getall())
        ptext = re.sub(r"\s+", " ", ptext.replace("\xa0", " ")).strip()
        director, stars, year = "", "", ""
        parts = re.split(r"导演:|主演:", ptext)
        if len(parts) > 1:
            director = parts[1].strip()
        if len(parts) > 2:
            tail = parts[2].strip()
            m = re.match(r"^(.*?)\s+(\d{4})", tail)
            if m:
                stars = m.group(1).strip()
                year = m.group(2)
        return director, stars, year
