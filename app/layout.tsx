import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ⚙️ 修改此处的元数据对象
export const metadata: Metadata = {
  title: "朧|个人空间", // 👈 浏览器标签页显示的网页标题
  description: "朧的个人空间与作品展示", // 👈 网站的简介描述
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN" // 👈 将网页语言设置为中文
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          声明本页是浅色主题：避免夸克/vivo 等浏览器的“深色模式/夜间模式”
          把浅色页面整页反色（启动屏变黑、背景变深、透明小人生灰底等）
        */}
        <meta name="color-scheme" content="light" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}