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
