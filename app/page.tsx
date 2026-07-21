'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PhotoGalleryHomePage() {
  // 控制“详细个人主页弹窗”的状态
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. 基础配置
  const config = {
    name: "Huioboro",
    bio: "记录代码、生活与每一个精彩瞬间 ✨",
    // 顶部背景图（位于 public 目录）
    bannerImage: "/images/1.jpg", 
    
    // 个人头像（位于 public 目录）
    avatarImage: "/images/1111.jpg", 

    details: [
      { icon: "🎂", label: "18 岁" },
      { icon: "📍", label: "四川 · 成都" },
      { icon: "🧩", label: "ENFP" },
      { icon: "💤", label: "拖延症晚期" },
    ]
  };

  // 2. 导航卡片列表
  const cards = [
    {
      title: "随手记账",
      subtitle: "云端实时同步 · 轻量个人账本",
      image: null, 
      gradient: "from-emerald-400 via-teal-500 to-emerald-600",
      icon: "💰",
      link: "/accounting",
      active: true,
      tag: "应用",
    },
    {
      title: "灵感画廊",
      subtitle: "记录日常随手拍与生活风景",
      image: null,
      gradient: "from-blue-400 via-indigo-500 to-blue-600",
      icon: "📷",
      link: "#",
      active: false,
      tag: "筹备中",
    },
    {
      title: "个人博客",
      subtitle: "技术笔记与学习思考随笔",
      image: null,
      gradient: "from-purple-400 via-pink-500 to-purple-600",
      icon: "📖",
      link: "#",
      active: false,
      tag: "筹备中",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 select-none relative">
      
      {/* 💡 1. 精简紧凑型顶部横幅（高度缩小为 h-36 sm:h-52，不占空间） */}
      <div className="w-full h-36 sm:h-52 relative overflow-hidden bg-slate-900">
        <img 
          src={config.bannerImage} 
          alt="Banner" 
          className="w-full h-full object-cover object-top opacity-90"
        />
        {/* 底部暗色渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>
      </div>

      {/* 💡 2. 个人信息主卡片（负边距微调为 -mt-10，紧凑贴合） */}
      <div className="max-w-4xl mx-auto px-6 relative -mt-10 mb-10 z-20">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/80 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col gap-5">
            
            {/* 头部：头像 + 用户名 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                
                {/* 可点击头像 */}
                <div 
                  onClick={() => setIsModalOpen(true)}
                  className="relative group shrink-0 cursor-pointer"
                  title="点击查看详细个人主页"
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white ring-4 ring-slate-100/80 shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                    <img 
                      src={config.avatarImage} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md group-hover:scale-110 transition-transform">
                    点击名片 🔍
                  </span>
                </div>

                {/* 名字与标语 */}
                <div>
                  <div className="flex items-center gap-3">
                    <h1 
                      onClick={() => setIsModalOpen(true)}
                      className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight hover:text-teal-600 transition-colors cursor-pointer"
                    >
                      {config.name}
                    </h1>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200/60">
                      PRO
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">
                    {config.bio}
                  </p>
                </div>
              </div>

              {/* 专属域名卡片 */}
              <div className="self-start sm:self-center">
                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100/80 px-4 py-2 rounded-2xl border border-slate-200/80 shadow-inner flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                  huioboro.xyz
                </span>
              </div>
            </div>

            {/* 个人档案属性标签列表 */}
            <div className="pt-3.5 border-t border-slate-100 flex flex-wrap gap-2.5">
              {config.details.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200/50"
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* 3. 我的应用与空间展区 */}
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
            我的应用与空间
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div key={index} className="group">
              {card.active ? (
                <Link href={card.link} className="block h-full">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-slate-200/80 transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col justify-between">
                    <div className="h-44 overflow-hidden relative bg-slate-100">
                      <div className={`w-full h-full bg-gradient-to-br ${card.gradient} flex items-center justify-center text-4xl shadow-inner text-white`}>
                        {card.icon}
                      </div>
                      <span className="absolute top-3 right-3 bg-black/40 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/20">
                        {card.tag}
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="font-bold text-slate-900 text-lg group-hover:text-teal-600 transition-colors flex items-center justify-between">
                        {card.title}
                        <span className="text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-teal-600">→</span>
                      </h3>
                      <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">{card.subtitle}</p>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="bg-white/60 rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 opacity-60 h-full flex flex-col justify-between">
                  <div className="h-44 overflow-hidden relative bg-slate-100">
                    <div className="w-full h-full bg-slate-200/70 flex items-center justify-center text-4xl grayscale">
                      {card.icon}
                    </div>
                    <span className="absolute top-3 right-3 bg-slate-200 text-slate-600 text-[10px] font-medium px-2.5 py-1 rounded-full">
                      {card.tag}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-700 text-lg">{card.title}</h3>
                    <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">{card.subtitle}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 详细个人主页弹窗 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                About Huioboro · 详细主页预览
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-8 overflow-y-auto space-y-8">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-md">
                  <img src={config.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Huioboro</h2>
                  <p className="text-slate-500 text-xs mt-1">独立开发者 / ENFP 快乐小狗 / 拖延症患者</p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-[10px] bg-teal-50 text-teal-600 px-2.5 py-1 rounded-md font-semibold">📍 四川 成都</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-md font-semibold">🎂 10月29日</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  💡 关于我
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-600 text-sm leading-relaxed border border-slate-100">
                  👋 嗨！我是 Huioboro。这里是我的个人空间预览区域。
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  🎯 状态与喜好
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs">
                    <div className="font-bold text-teal-800 mb-1">🎮 游戏</div>
                    <div className="text-teal-600">单机 / 休闲 / 开放世界</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-xs">
                    <div className="font-bold text-blue-800 mb-1">🎧 音乐</div>
                    <div className="text-blue-600">流行 / 电子 / 动漫 OST</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  📬 如何联系我
                </h3>
                <div className="flex flex-wrap gap-3 text-xs font-mono">
                  <span className="px-3 py-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                    Domain: huioboro.xyz
                  </span>
                  <span className="px-3 py-2 bg-slate-100 rounded-xl text-slate-600 border border-slate-200">
                    GitHub: @huioboro
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
              💡 提示：以上内容为详细主页框架预览！
            </div>
          </div>
        </div>
      )}

      {/* 页脚 */}
      <footer className="mt-20 text-center text-xs text-slate-400">
        © 2026 huioboro.xyz · Personal Station
      </footer>
    </main>
  );
}