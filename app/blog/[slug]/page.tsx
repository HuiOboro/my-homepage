import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAllSlugs, getPostBySlug } from '@/lib/posts';
import BlogComments from '@/app/blog/BlogComments';

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
          className="text-xs text-slate-500 hover:text-lime-600 transition-colors"
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

        <BlogComments postSlug={post.slug} />
      </article>
    </main>
  );
}
