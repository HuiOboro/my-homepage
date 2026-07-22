'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 留言数据接口定义
interface Comment {
  id: string | number;
  name: string;
  content: string;
  time: string;
}

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // 个人资料配置
  const config = {
    name: "朧",
    bio: "记录代码、生活与每一个精彩瞬间 ✨",
    bannerImage: "/images/1.jpg", 
    avatarImage: "/images/1111.jpg", 

    details: [
      { icon: "🎂", label: "18 岁" },
      { icon: "📍", label: "四川 · 成都" },
      { icon: "🧩", label: "ENFP" },
      { icon: "💤", label: "拖延症晚期" },
    ]
  };

  // 应用卡片配置
  const cards = [
    {
      title: "随手记账",
      subtitle: "云端实时同步 · 轻量个人账本",
      gradient: "from-emerald-400 via-teal-500 to-emerald-600",
      icon: "💰",
      link: "/accounting",
      active: true,
      tag: "应用",
    },
    {
      title: "灵感画廊",
      subtitle: "记录日常随手拍与生活风景",
      gradient: "from-blue-400 via-indigo-500 to-blue-600",
      icon: "📷",
      link: "#",
      active: false,
      tag: "筹备中",
    },
    {
      title: "个人博客",
      subtitle: "技术笔记与学习思考随笔",
      gradient: "from-purple-400 via-pink-500 to-purple-600",
      icon: "📖",
      link: "#",
      active: false,
      tag: "筹备中",
    },
  ];

  // 留言相关状态
  const [nameInput, setNameInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const ADMIN_PASSWORD = '123'; // 管理员删除密码

  // 从 Supabase 拉取留言数据
  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .order('id', { ascending: false });

    if (!error && data) {
      setComments(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // 发表留言到 Supabase 云端
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentInput.trim()) return;

    const newComment = {
      name: nameInput.trim() || '热心网友',
      content: contentInput.trim(),
      time: new Date().toLocaleString('zh-CN', {
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const { data, error } = await supabase
      .from('comments')
      .insert([newComment])
      .select();

    if (error) {
      console.error('Supabase 报错详情：', error);
      alert(`留言发送失败！原因：${error.message} (错误代码: ${error.code})`);
    } else if (data) {
      setComments([data[0], ...comments]);
      setContentInput('');
    }
  };

  // 删除留言
  const handleDeleteComment = async (id: string | number) => {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);

    if (!error) {
      setComments(comments.filter(c => c.id !== id));
    } else {
      alert('删除失败');
    }
  };

  // 管理员认证
  const handleAdminAuth = () => {
    if (isAdmin) {
      setIsAdmin(false);
      alert('已退出管理员模式');
      return;
    }
    const input = prompt('请输入管理员密码开启删除权限：');
    if (input === ADMIN_PASSWORD) {
      setIsAdmin(true);
      alert('密码正确！已开启权限。');
    } else if (input !== null) {
      alert('密码错误！');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20 select-none relative">
      
      {/* 顶部 Banner */}
      <div className="w-full h-36 sm:h-52 relative overflow-hidden bg-slate-900">
        <img src={config.bannerImage} alt="Banner" className="w-full h-full object-cover object-top opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>
      </div>

      {/* 个人名片卡片 */}
      <div className="max-w-4xl mx-auto px-6 relative -mt-10 mb-8 z-20">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 sm:p-7 border border-white/80 shadow-xl shadow-slate-200/50">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <div onClick={() => setIsModalOpen(true)} className="relative group shrink-0 cursor-pointer">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white ring-4 ring-slate-100/80 shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center group-hover:scale-105 transition-all duration-300">
                    <img src={config.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-teal-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                    🔍 点击名片
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-3">
                    <h1 onClick={() => setIsModalOpen(true)} className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight hover:text-teal-600 transition-colors cursor-pointer">
                      {config.name}
                    </h1>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200/60">
                      PRO
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1 leading-relaxed">{config.bio}</p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end gap-2.5 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-inner flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
                  huioboro.xyz
                </span>

                <button
                  onClick={() => setIsCommentModalOpen(true)}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>💬 互动留言板</span>
                  <span suppressHydrationWarning className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                    {comments.length}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-3.5 border-t border-slate-100 flex flex-wrap gap-2.5">
              {config.details.map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200/50">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 应用展示区 */}
      <div className="max-w-4xl mx-auto px-6 mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
          我的应用与空间
        </h2>
        
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

      {/* 悬浮常驻留言按钮 */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsCommentModalOpen(true)}
          className="bg-slate-900/90 hover:bg-slate-900 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 text-xs font-bold active:scale-90 transition-all hover:scale-105"
        >
          <span className="text-base">💬</span>
          <span>留言板</span>
          <span suppressHydrationWarning className="bg-teal-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
            {comments.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* 1. 详细名片 Modal (原汁原味集成你提供的完整 UI)            */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)}></div>

          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 z-10 overflow-hidden max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* 顶部 Header */}
            <div className="relative p-6 bg-gradient-to-br from-slate-50 to-teal-50/30 border-b border-slate-100 flex items-center gap-4">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white hover:bg-slate-100 shadow-sm flex items-center justify-center text-slate-500 font-bold transition-colors z-10"
              >
                ✕
              </button>

              <div className="w-16 h-16 rounded-full border-2 border-white ring-2 ring-teal-500/30 shadow-md overflow-hidden bg-slate-100 shrink-0">
                <img src={config.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900">{config.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-200/60">
                    PRO
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{config.bio}</p>
              </div>
            </div>

            {/* 弹窗主体：完美复现你提供的 HTML 结构 */}
            <div className="p-6 overflow-y-auto space-y-6 text-left">
              {/* 关于我 */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  💡 关于我
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl text-slate-600 text-sm leading-relaxed border border-slate-100">
                  👋 嗨！我是朧。这里是我的个人空间预览区域。
                </div>
              </div>

              {/* 状态与喜好 */}
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

              {/* 如何联系我 */}
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

            {/* 底部提示语 */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
              💡 提示：以上内容为详细主页框架预览！
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. 云端同步留言板 Modal                                    */}
      {/* ======================================================== */}
      {isCommentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsCommentModalOpen(false)}></div>

          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className="text-lg">💬</span>
                <h2 className="text-base font-extrabold text-slate-900">全端同步留言板</h2>
                <span suppressHydrationWarning className="text-xs font-normal text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded-full ml-1">
                  {comments.length} 条留言
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAdminAuth}
                  className={`text-[11px] px-2.5 py-1 rounded-xl transition-all font-medium ${
                    isAdmin ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {isAdmin ? '🔓 已开启删除' : '🔒 管理员'}
                </button>
                <button 
                  onClick={() => setIsCommentModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition-colors ml-1"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <form onSubmit={handleAddComment} className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                <input 
                  type="text" 
                  placeholder="你的昵称（可选，默认：热心网友）" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all select-text"
                />
                <textarea 
                  rows={3}
                  placeholder="给 朧 留个言吧..." 
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none select-text"
                  required
                />
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    className="bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs px-5 py-2 rounded-xl shadow-md shadow-teal-600/20 active:scale-95 transition-all"
                  >
                    发送云端留言 ✨
                  </button>
                </div>
              </form>

              {/* 留言列表 */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-10 text-slate-400 text-xs">正在连接 Supabase 云数据库...</div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    还没云端留言哦，快来抢沙发吧~
                  </div>
                ) : (
                  comments.map((item) => (
                    <div key={item.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{item.name}</span>
                          <span className="text-[10px] text-slate-400">{item.time}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed select-text">{item.content}</p>
                      </div>
                      
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteComment(item.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-medium px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 transition-colors ml-2 shrink-0"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50/80 border-t border-slate-100 text-center text-[11px] text-slate-400">
              🌐 已连接 Supabase 云端数据库 · 多端实时同步
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
