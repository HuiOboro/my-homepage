# 朧的个人空间

个人主页全站项目，已上线：[https://huioboro.xyz](https://huioboro.xyz)

一个从「想记账」开始、用 AI 辅助完成的个人空间：集个人名片、云端留言板、博客、记账工具与游戏资料工具箱于一体，多端响应式适配，数据实时同步。

## 功能特性

- **首页个人名片**：简介、标签、头像与 banner，弹窗式详细名片
- **云端留言板**：基于 Supabase 的实时留言/删除功能，多端同步
- **个人博客**：Markdown 写作，构建时静态生成（SSG），文章详情页带评论功能
- **随手记账**：收入/支出记录、预算管理，数据持久化到本地存储
- **偶像梦幻祭工具箱**：自动爬取游戏卡面数据（2849 张），支持按稀有度/SPP 筛选的一览页面，头像/队标本地化

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端框架 | Next.js 16（App Router）+ React 19 |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS v4 |
| 数据存储 | Supabase（PostgreSQL 云数据库） |
| 博客 | Markdown + gray-matter + marked（SSG 静态生成） |
| 数据采集 | Python（增量爬取 + 数据清洗 + 图片本地化） |
| 部署 | GitHub → Vercel 自动部署 |

## 项目结构

```
app/                  # 页面与应用代码
  page.tsx            # 首页（名片 / 应用卡片 / 留言板）
  accounting/         # 随手记账
  blog/               # 博客列表与详情（含评论）
  es/                 # 偶像梦幻祭工具箱
content/posts/        # 博客 Markdown 源文件
lib/                  # posts / supabase 工具
public/es/            # ES 卡面数据静态资源
es_data/              # 爬虫脚本与数据（本地工作目录，不提交）
```

## 本地开发

```bash
npm install
npm run dev
```

访问 http://localhost:3000 。

### 环境变量

创建 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=你的 Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的 Supabase anon key
NEXT_PUBLIC_ADMIN_PASSWORD=留言板管理员删除密码
```

## 部署

推送到 GitHub `main` 分支后，Vercel 通过 Git 集成自动部署。ES 卡面数据更新通过 Windows 任务计划每天定时执行爬虫脚本 → 重新生成 → 提交推送，全自动完成。

## License

仅用于个人展示，未经许可请勿用于商业用途。
