# 博客评论功能 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为博客文章详情页添加评论功能：发表评论、楼中楼回复、点赞（localStorage 防刷）、管理员密码删除。数据存 Supabase `blog_comments` 表（已由用户建好并配置权限）。

**Architecture:** 新建客户端组件 `app/blog/BlogComments.tsx`（'use client'），接收 `postSlug` prop，通过 Supabase anon client 读写 `blog_comments` 表。前端将平铺评论数据构造成两层树（顶层评论 + 归并到其下的回复）渲染楼中楼。详情页 `app/blog/[slug]/page.tsx`（服务端组件）在正文下方嵌入该组件。

**Tech Stack:** Next.js 16（App Router）、TypeScript、Tailwind CSS v4、`@supabase/supabase-js`（已有）。

参考设计文档：`docs/superpowers/specs/2026-08-07-blog-comments-design.md`。
数据表 `blog_comments` 已建好：字段 id / post_slug / parent_id / name / content / time / likes / created_at，已配置 RLS 策略与 anon 权限，可用 `SELECT` 验证（返回 200 空数组）。

---

### Task 1: 创建评论组件 `app/blog/BlogComments.tsx`

**Files:**
- Create: `app/blog/BlogComments.tsx`

- [ ] **Step 1: 写入完整组件代码**

```tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface CommentItem {
  id: number;
  post_slug: string;
  parent_id: number | null;
  name: string;
  content: string;
  time: string;
  likes: number;
}

const ADMIN_PASSWORD = '123';

function formatTime() {
  return new Date().toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BlogComments({ postSlug }: { postSlug: string }) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [likedIds, setLikedIds] = useState<number[]>([]);

  const likedKey = `blog_liked_${postSlug}`;

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('blog_comments')
      .select('*')
      .eq('post_slug', postSlug)
      .order('id', { ascending: true });
    if (!error && data) {
      setComments(data as CommentItem[]);
    }
    setLoading(false);
  }, [postSlug]);

  useEffect(() => {
    fetchComments();
    try {
      const saved = JSON.parse(localStorage.getItem(likedKey) || '[]');
      if (Array.isArray(saved)) setLikedIds(saved);
    } catch (e) {
      // 忽略损坏的本地存储
    }
  }, [fetchComments, likedKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentInput.trim()) return;
    setSubmitting(true);
    const newComment = {
      post_slug: postSlug,
      parent_id: null,
      name: nameInput.trim() || '匿名',
      content: contentInput.trim(),
      time: formatTime(),
      likes: 0,
    };
    const { data, error } = await supabase
      .from('blog_comments')
      .insert([newComment])
      .select();
    if (error) {
      alert(`评论发送失败：${error.message}`);
    } else if (data) {
      setComments([...comments, data[0] as CommentItem]);
      setContentInput('');
    }
    setSubmitting(false);
  };

  const handleReply = async () => {
    if (!replyTo || !replyContent.trim()) return;
    const newComment = {
      post_slug: postSlug,
      parent_id: replyTo.id,
      name: nameInput.trim() || '匿名',
      content: replyContent.trim(),
      time: formatTime(),
      likes: 0,
    };
    const { data, error } = await supabase
      .from('blog_comments')
      .insert([newComment])
      .select();
    if (error) {
      alert(`回复失败：${error.message}`);
    } else if (data) {
      setComments([...comments, data[0] as CommentItem]);
      setReplyContent('');
      setReplyTo(null);
    }
  };

  const handleLike = async (item: CommentItem) => {
    if (likedIds.includes(item.id)) {
      alert('已经赞过啦');
      return;
    }
    const { error } = await supabase
      .from('blog_comments')
      .update({ likes: (item.likes || 0) + 1 })
      .eq('id', item.id);
    if (!error) {
      const nextComments = comments.map((c) =>
        c.id === item.id ? { ...c, likes: (c.likes || 0) + 1 } : c
      );
      setComments(nextComments);
      const nextLiked = [...likedIds, item.id];
      setLikedIds(nextLiked);
      localStorage.setItem(likedKey, JSON.stringify(nextLiked));
    }
  };

  const handleDelete = async (item: CommentItem) => {
    const { error } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', item.id);
    if (!error) {
      setComments(
        comments.filter((c) => c.id !== item.id && c.parent_id !== item.id)
      );
    } else {
      alert('删除失败');
    }
  };

  const handleAdminAuth = () => {
    if (isAdmin) {
      setIsAdmin(false);
      return;
    }
    const input = prompt('请输入管理员密码开启删除权限：');
    if (input === ADMIN_PASSWORD) {
      setIsAdmin(true);
    } else if (input !== null) {
      alert('密码错误！');
    }
  };

  // 把任意回复归并到其顶层评论下，保证"评论 + 回复"两层结构
  const rootIdOf = (item: CommentItem): number => {
    const byId = new Map(comments.map((c) => [c.id, c]));
    let cur = item;
    while (cur.parent_id !== null) {
      const parent = byId.get(cur.parent_id);
      if (!parent) break;
      cur = parent;
    }
    return cur.id;
  };

  const topLevel = comments.filter((c) => c.parent_id === null);
  const repliesOf = (rootId: number) =>
    comments.filter((c) => c.parent_id !== null && rootIdOf(c) === rootId);

  const renderItem = (item: CommentItem, isReply: boolean) => (
    <div
      key={item.id}
      className={`p-4 rounded-2xl border ${
        isReply
          ? 'ml-6 mt-2 bg-slate-50/70 border-slate-100'
          : 'bg-white border-slate-200/80'
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-slate-800">{item.name}</span>
        <span className="text-[10px] text-slate-400">{item.time}</span>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed break-words select-text">
        {item.content}
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => handleLike(item)}
          className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-colors ${
            likedIds.includes(item.id)
              ? 'bg-teal-50 text-teal-600 border-teal-200'
              : 'bg-slate-50 text-slate-500 border-slate-200 hover:text-teal-600 hover:border-teal-200'
          }`}
        >
          👍 {item.likes || 0}
        </button>
        {!isReply && (
          <button
            onClick={() => setReplyTo(item)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:text-teal-600 hover:border-teal-200 transition-colors"
          >
            回复
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => handleDelete(item)}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-colors ml-auto"
          >
            删除
          </button>
        )}
      </div>
      {!isReply && replyTo?.id === item.id && (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="回复内容..."
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 select-text"
          />
          <button
            onClick={handleReply}
            className="text-xs font-medium px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            发送
          </button>
          <button
            onClick={() => {
              setReplyTo(null);
              setReplyContent('');
            }}
            className="text-xs text-slate-400 px-2 hover:text-slate-600"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold text-slate-900">
          💬 评论
          <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
            {comments.length}
          </span>
        </h2>
        <button
          onClick={handleAdminAuth}
          className={`text-[11px] px-2.5 py-1 rounded-xl transition-all font-medium ${
            isAdmin
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-slate-200/70 text-slate-600'
          }`}
        >
          {isAdmin ? '🔓 已开启删除' : '🔒 管理员'}
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mb-6"
      >
        <input
          type="text"
          placeholder="你的昵称（可选，默认：匿名）"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all select-text"
        />
        <textarea
          rows={2}
          placeholder="写下你的评论..."
          value={contentInput}
          onChange={(e) => setContentInput(e.target.value)}
          className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none select-text"
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs px-5 py-2 rounded-xl shadow-md shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {submitting ? '发送中...' : '发表评论 ✨'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            正在加载评论...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            还没有评论，来抢沙发吧~
          </div>
        ) : (
          topLevel.map((item) => (
            <div key={item.id}>
              {renderItem(item, false)}
              <div className="space-y-2 mt-1">
                {repliesOf(item.id).map((r) => renderItem(r, true))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: 类型检查**

```bash
cd "C:\Users\su289\python\my-accounting-app"
npx tsc --noEmit
```

Expected: 无输出（类型检查通过）。

---

### Task 2: 详情页接入评论组件

**Files:**
- Modify: `app/blog/[slug]/page.tsx`

- [ ] **Step 1: 引入并渲染组件**

在 `app/blog/[slug]/page.tsx` 顶部 import 行后追加 import：

```tsx
import BlogComments from '@/app/blog/BlogComments';
```

在正文 `<div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />` 之后、`</article>` 之前追加：

```tsx
        <BlogComments postSlug={post.slug} />
```

即 `article` 内结构变为：返回链接 → 标题区 → 正文 div → 评论组件 → `</article>`。

- [ ] **Step 2: 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无输出。

---

### Task 3: 构建验证

**Files:**
- 无（验证步骤）

- [ ] **Step 1: 运行生产构建**

```bash
cd "C:\Users\su289\python\my-accounting-app"
npm run build
```

Expected: 构建成功，`/blog` 与 `/blog/[slug]` 路由正常预渲染。若失败，根据报错定位到 Task 1/2 的对应文件修复。

---

### Task 4: 本地预览验证

**Files:**
- 无（验证步骤）

- [ ] **Step 1: 启动本地 dev 服务器（后台运行）**

```bash
cd "C:\Users\su289\python\my-accounting-app"
npm run dev
```

Expected: 终端显示 `Ready in ...`，本地地址 `http://localhost:3000`。

- [ ] **Step 2: 逐项验证（浏览器操作）**

打开 `http://localhost:3000/blog/my-first-ai-website` 并逐项确认：

1. 文章正文下方出现「💬 评论」区块，显示"还没有评论，来抢沙发吧~"
2. 发表一条评论（昵称留空）→ 出现在列表，昵称显示"匿名"，时间显示正常
3. 点该评论的【回复】，输入内容发送 → 楼中楼缩进显示在该评论下方
4. 点【👍 赞】→ 计数 +1，再点 → 提示"已经赞过啦"
5. 点【🔒 管理员】输密码 `123` → 评论和回复旁出现【删除】，点删除 → 该评论连同回复一起消失
6. 刷新页面 → 评论仍在（数据落库）
7. 打开 `/blog/not-exist`（404 页，无评论区，不报错）与首页 `/`（留言板功能正常）确认无回归

验证完毕后停止 dev 进程。

- [ ] **Step 3: 提交所有改动**

```bash
cd "C:\Users\su289\python\my-accounting-app"
git add app/blog/BlogComments.tsx app/blog/[slug]/page.tsx
git commit -m "feat: 博客详情页新增评论功能（发表/楼中楼回复/点赞/密码删除）"
```

注意：**只**添加上述两个文件，不要 `git add -A`。
