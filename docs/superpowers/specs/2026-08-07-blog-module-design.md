# 博客板块设计

日期：2026-08-07
状态：已与用户确认

## 背景与目标

用户在 huioboro.xyz 上已有个人网站（Next.js 16 + Supabase + Tailwind CSS v4 + TypeScript）。首页"我的应用与空间"板块中"个人博客"卡片目前是"筹备中"灰色不可点击状态。

目标：实现一个博客板块，让用户能以最简方式发布文章（把文字内容交给 AI，AI 写成 markdown 文件放入项目），并在网站上以列表 + 详情的形式展示。第一篇博文为《不会写代码的大二学生，用 AI 做出了自己的网站》。

## 方案选择

采用 **方案 A：本地 markdown 文件**。
- 每篇文章一个 `.md` 文件，存放于 `content/posts/`
- 不依赖 Supabase，无需建表、无需 RLS 配置
- 发文章 = 新增一个文本文件，与用户"让 AI 帮我发"的使用方式完全匹配
- 备选方案 B（Supabase 文章表）因当前只有一篇文章、且用户无后台写作需求，暂不采用（YAGNI）

## 架构

- **存储**：`content/posts/*.md`，文件名即 slug（URL 后缀）
- **解析层**：`lib/posts.ts`（服务端专用模块）
  - `getAllPosts()`：读取全部文章 → 解析 frontmatter → 按日期倒序返回元信息（title、date、excerpt、slug）
  - `getPostBySlug(slug)`：读取单篇文章 → 返回 frontmatter + HTML 正文
  - `getAllSlugs()`：供 generateStaticParams 使用
- **页面**：
  - `app/blog/page.tsx`（服务端组件）：文章列表，卡片式布局（标题 + 日期 + 一句话简介）
  - `app/blog/[slug]/page.tsx`（服务端组件）：文章详情，正文排版
  - `app/blog/[slug]/page.tsx` 导出 `generateStaticParams`，构建时预生成所有文章页
- **入口修改**：`app/page.tsx` 中"个人博客"卡片由 `active: false` 改为 `active: true`，`link` 指向 `/blog`

## 文章文件格式

每篇文章开头为 YAML frontmatter，正文为 markdown：

```markdown
---
title: 文章标题
date: 2026-08-07
excerpt: 一句话简介，显示在列表页
---

正文内容，支持标题、加粗、列表、引用、代码块等 markdown 语法。
```

## 依赖

新增两个运行时依赖（仅影响博客功能）：
- `gray-matter`：解析 frontmatter
- `marked`：markdown → HTML 渲染

## 样式

沿用现有风格：白卡片、`rounded-2xl`、slate 色系、teal 强调色。
- 列表页：卡片网格，与首页"我的应用与空间"卡片风格一致
- 详情页：正文阅读排版（标题层级、段落间距、列表缩进、代码块底色与圆角）
- 列表页/详情页顶部保留与全站一致的简洁布局（无独立 header，返回链接置于页面左上角）

## 错误处理

- 访问不存在的 slug → 调用 `notFound()`，由 Next.js 渲染 404
- 无文章时列表页显示"还没有文章"占位提示

## 验证

1. `npm run build` 通过
2. `npm run dev` 启动本地预览：
   - `/blog` 列表页显示第一篇博文卡片
   - 点击进入详情页，正文排版正确
   - 首页"个人博客"卡片可点击跳转
   - 访问 `/blog/不存在的slug` 显示 404

## 第一篇博文

《从"想记账"到"做出网站"：会点 Python 的我，靠 AI 做到了》，frontmatter：date=2026-08-07，excerpt 取自正文第一句，slug 使用英文或拼音（如 `my-first-ai-website`）。

正文开头需体现"会一点 Python 基础，但写网站（前端/后端）完全不会"，与标题保持一致，避免自相矛盾。

## 范围外（不做）

- 分类 / 标签 / 搜索 / 分页
- 网页后台写作
- 评论功能（已有独立留言板）
- 文章封面图
