# -*- coding: utf-8 -*-
import scrapy


class DoubanMovieItem(scrapy.Item):
    """豆瓣 Top250 电影条目。"""
    rank = scrapy.Field()
    title = scrapy.Field()
    director = scrapy.Field()
    stars = scrapy.Field()
    year = scrapy.Field()
    quote = scrapy.Field()
    score = scrapy.Field()
    votes = scrapy.Field()
