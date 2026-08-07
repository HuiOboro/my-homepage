# 博客板块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 huioboro.xyz（Next.js 16 项目 my-accounting-app）上实现博客板块：文章以本地 markdown 文件存放，提供列表页 `/blog` 与详情页 `/blog/[slug]`，并激活首页"个人博客"卡片入口。

**Architecture:** 文章存放于 `content/posts/*.md`（文件名即 slug，开头为 YAML frontmatter：title/date/excerpt）。`lib/posts.ts`（服务端模块，使用 Node fs）负责读取与解析，用 `gray-matter` 解析 frontmatter、`marked` 将 markdown 渲染为 HTML。两个页面均为服务端组件，详情页通过 `generateStaticParams` 在构建时预生成所有文章页。

**Tech Stack:** Next.js 16（App Router）、TypeScript、Tailwind CSS v4、`gray-matter`、`marked`。

参考设计文档：`docs/superpowers/specs/2026-08-07-blog-module-design.md`。

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`（由 npm 自动更新）

- [ ] **Step 1: 安装 gray-matter 和 marked**

```bash
cd "C:\Users\su289\python\my-accounting-app"
npm install gray-matter marked
```

Expected: 命令成功结束，`package.json` 的 `dependencies` 中出现 `gray-matter` 和 `marked`。

- [ ] **Step 2: 确认版本**

```bash
npm ls gray-matter marked
```

Expected: 两者都列出，无 UNMET 依赖错误。

---

### Task 2: 创建第一篇博文

**Files:**
- Create: `content/posts/my-first-ai-website.md`

- [ ] **Step 1: 创建文章文件**

```markdown
---
title: 从“想记账”到“做出网站”：会点 Python 的我，靠 AI 做到了
date: "2026-08-07"
excerpt: 会点 Python 基础的大二学生，从一句“帮我做个记账页面”开始，用 AI 做出了自己的网站。
---

## 我为什么突然想做这个

我是大二学生，会一点 Python 基础，但写网站是真不会——前端后端这些词到现在也分不太清。以前觉得“做网站”是程序员的事，跟我没什么关系。

但有一阵子我老觉得钱花得莫名其妙，生活费没过多久就见底了，却一笔都想不起来花在哪。想着要是能记个账就好了。正好那阵子到处都在说 AI 能帮人写代码，我就想：要不让 AI 帮我做一个记账的？就当试试。

## 为什么不用现成的记账软件

也想过直接下个记账 App，结果好用的基本都要收费，功能还一大堆。我就是想简简单单记个账，凭什么要花这个钱。既然 AI 能写，那不如自己做一个。

## 过程：跟 Gemini 从零“对话”出来的

我用的是 Gemini。第一次跟它说“帮我做个记账页面，能记收入和支出”，它真的就给我写出来了，那一刻还挺惊喜的。

不过我也看不懂它写的代码。想改点东西全靠描述：“这个按钮能不能往右挪点”“字能不能大一点”。有时候它改完发现更乱了，还得让它改回去。就像请了个很厉害的人帮我盖房子，我自己看不懂图纸，只能指着说“这块感觉不太对”。

## 最头疼的一个问题：数据不互通

网站刚做好的时候，我发给朋友们让他们留言。结果第二天我换个设备打开——那些留言全都没了。电脑上能看到的内容，手机上一个都看不到。一开始以为是我操作不对，反复试了几次才明白：原来数据只存在当前这台设备的浏览器里，换个设备就什么都没了。

那会儿挺崩溃的，感觉这网站就是个“单机版”。

后来跟 Gemini 磨了好久，终于把数据改成存到网上（放在 Vercel 上）。从那以后，我在手机记一笔，电脑上打开也能看到。这一步改通的时候，我高兴了好一阵。

## 做出来的那一刻

当我的网站真的在网上能被别人打开访问的时候，那个感觉挺奇妙的。网址是 huioboro.xyz——不是什么大网站，但它是我从一句“帮我做个记账页面”开始，一点点磨出来的。

## 乱七八糟的感想

1. AI 真的把做网站的门槛拉低了。以前是想都不敢想，现在是居然真的做出来了。
2. 但也没那么神——你得学会把需求说清楚，学会怎么追问、让它改。不会的地方反而磨出了耐心。
3. 遇到“换个设备就没了”这种问题别慌，多半是数据存错了地方，是可以改的。
4. 下一步想把灵感画廊也做出来，慢慢把这个小网站填满。

如果你也跟我一样不太懂编程，但心里有个想做的网站，真的可以试试。反正不试，更待何时。
```

> 注意：`date: "2026-08-07"` 的引号必须保留，否则 gray-matter/js-yaml 会把 `2026-08-07` 解析成 Date 对象，导致列表页显示成英文长日期。

- [ ] **Step 2: 确认文件创建**

```bash
ls "C:\Users\su289\python\my-accounting-app\content\posts\my-first-ai-website.md"
```

Expected: 文件存在，非空。

---

### Task 3: 实现文章读取工具 `lib/posts.ts`

**Files:**
- Create: `lib/posts.ts`

- [ ] **Step 1: 写入完整实现**

```ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const postsDirectory = path.join(process.cwd(), 'content', 'posts');

export interface PostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

export interface Post extends PostMeta {
  contentHtml: string;
}

function getSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.md'));
}

export function getAllPosts(): PostMeta[] {
  return getSlugs()
    .map((file) => {
      const fullPath = path.join(postsDirectory, file);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);
      return {
        slug: file.replace(/\.md$/, ''),
        title: typeof data.title === 'string' ? data.title : '无标题',
        date: typeof data.date === 'string' ? data.date : '',
        excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(postsDirectory, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(fileContents);
  const contentHtml = marked.parse(content) as string;

  return {
    slug,
    title: typeof data.title === 'string' ? data.title : '无标题',
    date: typeof data.date === 'string' ? data.date : '',
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    contentHtml,
  };
}

export function getAllSlugs(): string[] {
  return getSlugs().map((file) => file.replace(/\.md$/, ''));
}
```

- [ ] **Step 2: 类型检查**

```bash
cd "C:\Users\su289\python\my-accounting-app"
npx tsc --noEmit
```

Expected: 无输出（类型检查通过）。若报 `gray-matter` / `marked` 缺类型，说明 Task 1 依赖未正确安装，先回头检查。

---

### Task 4: 添加博客正文排版样式

**Files:**
- Modify: `app/globals.css`（追加到文件末尾）

- [ ] **Step 1: 追加 `.prose-blog` 样式**

在 `app/globals.css` 末尾追加以下内容：

```css
/* ===== 博客正文排版 ===== */
.prose-blog h2 {
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
}
.prose-blog p {
  font-size: 1rem;
  line-height: 1.9;
  color: #334155;
  margin-bottom: 1.25rem;
}
.prose-blog ul {
  list-style: disc;
  padding-left: 1.5rem;
  margin-bottom: 1.25rem;
}
.prose-blog li {
  margin-bottom: 0.4rem;
  line-height: 1.8;
  color: #334155;
}
.prose-blog strong {
  color: #0f172a;
  font-weight: 600;
}
.prose-blog pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  overflow-x: auto;
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}
.prose-blog code {
  background: #f1f5f9;
  padding: 0.15rem 0.4rem;
  border-radius: 0.375rem;
  font-size: 0.85em;
}
.prose-blog pre code {
  background: transparent;
  padding: 0;
}
.prose-blog blockquote {
  border-left: 3px solid #14b8a6;
  padding-left: 1rem;
  color: #64748b;
  font-style: italic;
  margin-bottom: 1.25rem;
}
.prose-blog a {
  color: #0d9488;
  text-decoration: underline;
}
```

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无输出（CSS 不参与类型检查，此步确认项目未因改动引入 TS 错误）。

---

### Task 5: 实现博客列表页 `app/blog/page.tsx`

**Files:**
- Create: `app/blog/page.tsx`

- [ ] **Step 1: 写入列表页**

```tsx
import Link from 'next/link';
import { getAllPosts } from '@/lib/posts';

export const metadata = {
  title: '博客 | 朧的个人空间',
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-teal-600 transition-colors"
        >
          ← 返回首页
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 mt-6 mb-2">
          📖 博客
        </h1>
        <p className="text-slate-500 text-sm mb-8">技术笔记与学习思考随笔</p>

        {posts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-2xl border border-dashed border-slate-200">
            还没有文章，敬请期待~
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <h2 className="font-bold text-lg text-slate-900 hover:text-teal-600 transition-colors">
                  {post.title}
                </h2>
                <p className="text-xs text-slate-400 mt-1">{post.date}</p>
                {post.excerpt && (
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无输出。

---

### Task 6: 实现博客详情页 `app/blog/[slug]/page.tsx`

**Files:**
- Create: `app/blog/[slug]/page.tsx`

- [ ] **Step 1: 写入详情页**

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllSlugs, getPostBySlug } from '@/lib/posts';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  return {
    title: post ? `${post.title} | 朧的个人空间` : '文章不存在',
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      <article className="max-w-3xl mx-auto px-6 pt-12">
        <Link
          href="/blog"
          className="text-xs text-slate-500 hover:text-teal-600 transition-colors"
        >
          ← 返回博客列表
        </Link>

        <header className="mt-6 mb-8 border-b border-slate-200 pb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {post.title}
          </h1>
          <p className="text-xs text-slate-400 mt-3">{post.date}</p>
        </header>

        <div
          className="prose-blog"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </main>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无输出。

---

### Task 7: 激活首页"个人博客"卡片入口

**Files:**
- Modify: `app/page.tsx`（cards 数组中的"个人博客"项）

- [ ] **Step 1: 修改卡片配置**

在 `app/page.tsx` 中找到 cards 数组（约第 34-63 行），将"个人博客"项的 `link: "#"` 改为 `link: "/blog"`、`active: false` 改为 `active: true`：

```tsx
    {
      title: "个人博客",
      subtitle: "技术笔记与学习思考随笔",
      gradient: "from-purple-400 via-pink-500 to-purple-600",
      icon: "📖",
      link: "/blog",
      active: true,
      tag: "应用",
    },
```

注意：`tag` 保持/改为 `"应用"`，与"随手记账"卡片一致（active 卡片显示 tag 徽章）。不要改动其他卡片。

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无输出。

---

### Task 8: 构建验证

**Files:**
- 无（验证步骤）

- [ ] **Step 1: 运行生产构建**

```bash
cd "C:\Users\su289\python\my-accounting-app"
npm run build
```

Expected: 构建成功。输出中应包含预渲染的静态页面 `/blog` 与 `/blog/my-first-ai-website`（Next.js 16 会列出 `● /blog`、`● /blog/[slug]` 等路由）。若失败，根据报错定位到 Task 3/5/6 的对应文件修复。

---

### Task 9: 本地预览验证并提交

**Files:**
- 无（验证步骤）

- [ ] **Step 1: 启动本地开发服务器（后台运行）**

```bash
cd "C:\Users\su289\python\my-accounting-app"
npm run dev
```

Expected: 终端显示 `Ready in ...`，本地地址通常为 `http://localhost:3000`。

- [ ] **Step 2: 逐项检查**

用浏览器打开以下地址并确认：
1. `http://localhost:3000/blog` — 列表页显示文章《从"想记账"到"做出网站"：会点 Python 的我，靠 AI 做到了》，含日期和一句话简介
2. 点击文章卡片 — 进入详情页，标题、段落、列表、加粗排版正确
3. `http://localhost:3000/` — 首页"个人博客"卡片彩色可点击，点击进入 `/blog`
4. `http://localhost:3000/blog/not-exist` — 显示 404 页面，不报错
5. `http://localhost:3000/accounting` — 原有记账功能仍正常

检查完毕后停止 dev 进程。

- [ ] **Step 3: 检查 `app/page.tsx` 的既有改动**

本项目 `app/page.tsx` 在开始前已有一个未提交的修改（`git status` 显示 `M app/page.tsx`）。提交前先确认：

```bash
cd "C:\Users\su289\python\my-accounting-app"
git diff app/page.tsx
```

Expected: diff 中应只包含"个人博客"卡片的那几行改动（link 和 active）。若其中混有与博客无关的改动，先与用户确认是否一并提交；未确认前不提交 app/page.tsx。

- [ ] **Step 4: 提交所有改动**

```bash
cd "C:\Users\su289\python\my-accounting-app"
git add content/posts/my-first-ai-website.md lib/posts.ts app/blog/page.tsx app/blog/[slug]/page.tsx app/page.tsx app/globals.css package.json package-lock.json
git commit -m "feat: 新增博客板块（列表页、详情页、首页入口）"
```

注意：**只**添加上述文件，不要 `git add -A`（避免带上其他未提交的无关改动）。
