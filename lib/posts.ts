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
