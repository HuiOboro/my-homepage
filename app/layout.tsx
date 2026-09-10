import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MusicProvider } from "./music";

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
          声明本页是浅色主题：避免夸克/vivo/迅雷 等浏览器的“深色模式/夜间模式”
          把浅色页面整页反色（启动屏变脏绿、背景变深、透明小人生灰底等）
          only light = 明确「本页不做深色适配」，比 light 更强的退出信号
        */}
        <meta name="color-scheme" content="only light" />
      </head>
      <body className="min-h-full flex flex-col">
        {/* 音乐挂在这里而不是首页里：站内客户端跳转时 layout 不会卸载，
            <audio> 一直活着，从首页点到 /blog 歌也不会断 */}
        <MusicProvider>{children}</MusicProvider>
      </body>
    </html>
  );
}