'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// 留言数据接口定义
interface Comment {
  id: string | number;
  name: string;
  content: string;
  time: string;
}

// ===== 四套皮肤 · 每套内再随机抽壁纸 =====
interface Wall {
  src: string;
  name: string; // 该壁纸对应的中文卡名
  label?: string; // 该壁纸所属角色名（eyebrow 前缀）
}
// 角色 key 列表：单人=1 个，双人=2 个（数组顺序=从左到右）
interface Theme {
  key: string;
  pill: string;
  brandA: string;
  brandB: string;
  brandC: string;
  eyebrow: string;
  badge: string;
  chars: string[];
  online: string;
  foot: string;
}

// WorkChibi 池子读不到时的兜底立绘（按角色 key）
const CHIBI_FALLBACK: Record<string, string> = {
  leo: '/images/work_leo.png',
  sou: '/images/work_sou.png',
  hiyori: '/images/work_hiyori.png',
  jun: '/images/work_jun.png',
};

const THEMES: Theme[] = [
  {
    key: 'leo',
    pill: 'レオ',
    brandA: 'OBO',
    brandB: 'RO',
    brandC: '. × LEO',
    eyebrow: 'Tsukinaga Leo · 纯粹的音色之束',
    badge: '',
    chars: ['leo'],
    online: '呜啾～☆',
    foot: '',
  },
  {
    key: 'hiyori',
    pill: '日和',
    brandA: 'OBO',
    brandB: 'RO',
    brandC: '. × HIYORI',
    eyebrow: 'Tomoe Hiyori · Eden 若草色',
    badge: '',
    chars: ['hiyori'],
    online: '好日和♪',
    foot: '',
  },
  {
    key: 'leosou',
    pill: 'レオ司',
    brandA: 'OBO',
    brandB: 'RO',
    brandC: '. × KNIGHTS',
    eyebrow: '月永レオ × 朱樱司 · Knights',
    badge: '',
    chars: ['leo', 'sou'], // レオ左 · 司右
    online: '',
    foot: '',
  },
  {
    key: 'junhiyo',
    pill: '純日和',
    brandA: 'OBO',
    brandB: 'RO',
    brandC: '. × EDEN',
    eyebrow: '漣純 × 巴日和 · Eden',
    badge: '',
    chars: ['jun', 'hiyori'], // Jun左 · 日和右
    online: '',
    foot: '',
  },
];

// 去掉卡名里的 (CG2)/(CG1) 等档位标记，让 eyebrow 更干净
const stripCG = (s?: string) => (s || '').replace(/\(CG\d*\)/gi, '').trim();

// 背景音乐已搬到 app/music.tsx（挂在 layout 上，站内切页不断歌），
// 首页这里只负责把「当前皮肤」广播出去，好让那个全局悬浮件取到主题色。

// 首帧「朧」占位停留时长(ms)：让主题色淡入后再淡入主体
const SPLASH_HOLD = 1200;
// 主体淡入 / 启动屏淡出时长(ms)：需与 globals.css 里 .hl-splash.hl-out 的时长一致
const SPLASH_OUT = 700;

export default function HomePage() {
  // 留言相关状态
  const [nameInput, setNameInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // 主题 + 壁纸：先读 /walls/manifest.json 拿各皮肤壁纸池，再随机皮肤、随机该皮肤内一张
  // （ti 为 null = 首帧占位，防止服务端/客户端随机不一致导致 hydration 报错）
  const [pool, setPool] = useState<Record<string, Wall[]> | null>(null);
  const [ti, setTi] = useState<number | null>(null);
  const [wall, setWall] = useState(0);
  const pickWall = (list: Wall[]) => (list.length ? Math.floor(Math.random() * list.length) : 0);

  // WorkChibi 随机贴纸：/qstick 池（qpoolRef，单人用）+ 同服装配对（pairRef，双人用）
  // 双人皮肤 = 从「同服装配套」里随机抽一对，左右角色固定，保证两小人「搭」
  interface QPair { n: string; l: string; r: string; }
  const qpoolRef = useRef<Record<string, string[]> | null>(null);
  const pairRef = useRef<Record<string, QPair[]> | null>(null);
  const [stick, setStick] = useState<string[]>([]);
  const pickStickers = (t: number): string[] => {
    const th = THEMES[t];
    // 双人：优先抽同服装配套（pair 顺序 = 左 l / 右 r）
    if (th.chars.length > 1) {
      const pl = (pairRef.current || {})[th.key];
      if (pl && pl.length) {
        const pr = pl[Math.floor(Math.random() * pl.length)];
        return [pr.l, pr.r];
      }
    }
    // 单人 / 配对池缺失：按角色从整池随机（兜底）
    return th.chars.map((c) => {
      const arr = (qpoolRef.current || {})[c];
      if (arr && arr.length) return arr[Math.floor(Math.random() * arr.length)];
      return CHIBI_FALLBACK[c] || '';
    });
  };

  // 首帧启动屏状态：随机主题定下后「朧」在主题色上停留 SPLASH_HOLD，
  // 再 hl-out 淡出并卸载（hl-gone）。只在整页刷新时出现一次，换皮肤不会重播。
  const [revealed, setRevealed] = useState(false);
  const [gone, setGone] = useState(false);
  const holdTimer = useRef<number | null>(null);
  const outTimer = useRef<number | null>(null);

  // 个人资料配置（四套皮肤共用）
  const config = {
    name: '朧',
    bio: '记录代码、生活与每一个精彩瞬间 ✨',
    avatarImage: '/images/1111.jpg',
    details: [
      { icon: '🎂', label: '18 岁' },
      { icon: '📍', label: '四川 · 成都' },
      { icon: '🧩', label: 'ENFP' },
      { icon: '💤', label: '拖延症晚期' },
    ],
  };

  // 应用卡片配置
  const cards = [
    { title: '随手记账', subtitle: '云端实时同步 · 轻量个人账本', icon: '💰', link: '/accounting', active: true, tag: '应用' },
    { title: '灵感画廊', subtitle: '记录日常随手拍与生活风景', icon: '📷', link: '#', active: false, tag: '筹备中' },
    { title: '个人博客', subtitle: '技术笔记与学习思考随笔', icon: '📖', link: '/blog', active: true, tag: '应用' },
    { title: '偶像梦幻祭 工具箱', subtitle: 'ES 资料合集 · 卡面一览等工具', icon: '🎤', link: '/es', active: true, tag: '应用' },
    { title: '豆瓣电影 Top250', subtitle: '影视榜单筛选 · 个人练习', icon: '🎬', link: '/douban/top250.html', active: true, tag: '个人练习' },
    { title: '我的课表', subtitle: '2026 秋季大二 · Leo/日和 双主题块状课表', icon: '🗓️', link: '/timetable.html', active: true, tag: '应用' },
  ];

  // 课表是 public/timetable.html（静态单页），点进去是整页跳转、React 树重建，
  // 挂在 layout 里的 <audio> 会被销毁导致断歌。所以这张卡单独在新标签打开，
  // 首页原封不动、歌继续放；其余站内页走软导航不卸载 layout，不用新标签。
  const NEW_TAB = new Set(['/timetable.html']);

  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ''; // 管理员删除密码（环境变量）

  // 从 Supabase 拉取留言数据
  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('comments').select('*').order('id', { ascending: false });
    if (!error && data) setComments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // 随机皮肤 + 壁纸/贴纸（仅客户端执行一次）。
  // 关键：主题与启动屏淡出不依赖网络——先定主题、立即开始计时，
  // 壁纸/贴纸清单在后台拉，任何请求卡住/失败都不会让页面永远停在「朧」。
  useEffect(() => {
    let alive = true;
    const t = Math.floor(Math.random() * THEMES.length);
    // 兜底壁纸池：读不到 manifest 时仍有各自皮肤可用（Leo 有主视觉图，其余走主题渐变底）
    const fallback: Record<string, Wall[]> = {
      leo: [{ src: '/images/leo_hero.jpg', name: 'Tsukinaga Leo' }],
      hiyori: [],
      leosou: [],
      junhiyo: [],
    };
    setPool(fallback);
    // 1) 先定随机主题 → 启动屏立刻换主题色，并按时淡出（1200ms 后 hl-out）
    setTi(t);
    setWall(0);
    setStick(pickStickers(t)); // 贴纸池没回来前先用兜底立绘，也能立刻显示
    holdTimer.current = window.setTimeout(() => {
      if (alive) setRevealed(true);
    }, SPLASH_HOLD);
    outTimer.current = window.setTimeout(() => {
      if (alive) setGone(true);
    }, SPLASH_HOLD + SPLASH_OUT);
    // 2) 后台拉壁纸 + 贴纸池 + 配对；整体 6s 内没返回就放弃（不卡启动屏）
    const timeout = (ms: number) => new Promise<null>((resolve) => setTimeout(() => resolve(null), ms));
    (async () => {
      const settled = await Promise.race([
        Promise.all([
          fetch('/walls/manifest.json').catch(() => null),
          fetch('/qstick/index.json').catch(() => null),
          fetch('/qstick/pairs.json').catch(() => null),
        ]),
        timeout(6000),
      ]);
      if (!settled || !alive) return;
      const [mr, qr, pr] = settled;
      const p = { ...fallback };
      if (mr && mr.ok) {
        const j = await mr.json();
        Object.assign(p, j);
      }
      if (qr && qr.ok) qpoolRef.current = await qr.json();
      if (pr && pr.ok) pairRef.current = await pr.json();
      if (!alive) return;
      setPool(p);
      const list = p[THEMES[t].key] || [];
      setWall(pickWall(list));
      setStick(pickStickers(t));
    })();
    return () => {
      alive = false;
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
        holdTimer.current = null;
      }
      if (outTimer.current) {
        clearTimeout(outTimer.current);
        outTimer.current = null;
      }
    };
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
        minute: '2-digit',
      }),
    };

    const { data, error } = await supabase.from('comments').insert([newComment]).select();
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
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) {
      setComments(comments.filter((c) => c.id !== id));
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
    if (!ADMIN_PASSWORD) {
      alert('管理员密码未配置，无法开启删除权限');
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

  // 首帧启动屏：随机主题还没决定（ti===null）或尚未淡出完成（!gone）前，
  // 「朧」固定在视口最上层，主题一旦定下其背景即换为该主题的配色。
  const th = ti === null ? null : THEMES[ti];
  const wallList = (th ? pool?.[th.key] : null) || ([] as Wall[]);
  const wallItem = wallList.length ? wallList[wall % wallList.length] : null;
  const wallUrl = wallItem?.src ?? null;
  // 双人皮肤：手机(≤700px)换用 scripts/build_cp_mobile.py 生成的竖版拼图
  // （上=左立绘 / 下=右立绘）。原图是 3120x720 的横条，竖屏里 cover 只会露出中间一道，
  // 两个人都会被裁。竖版图比率 ~0.9，正好贴合手机 hero，两个人都在且够大。
  const wallUrlM =
    wallUrl && th && th.chars.length > 1 ? wallUrl.replace(/\.jpg$/, '_m.jpg') : null;
  // 把当前皮肤广播给全局音乐悬浮件（app/music.tsx 的 MusicDock），
  // 它挂在 layout 里、不在 .hl-main 层级内，拿不到主题变量，只能靠这个传 key。
  useEffect(() => {
    if (!th) return;
    try {
      localStorage.setItem('hl.theme', th.key);
    } catch {
      /* 忽略 */
    }
    window.dispatchEvent(new CustomEvent('hl:theme', { detail: th.key }));
  }, [th]);
  const switchTheme = () => {
    if (ti === null) return;
    const n = (ti + 1) % THEMES.length;
    const list = pool?.[THEMES[n].key] || ([] as Wall[]);
    setTi(n);
    setWall(pickWall(list));
    setStick(pickStickers(n));
  };

  const showSplash = ti === null || !gone;

  return (
    <div className={`hl-stage${!revealed ? ' hl-lock' : ''}`}>
      {th && (
    <main className="hl-main" data-theme={th.key}>
      {/* 首屏：皮肤内随机壁纸；没壁纸时用贴纸卡占位 */}
      <div className="hl-hero">
        {wallUrl ? (
          /* 桌面用原横图整张铺满；双人皮肤手机(≤700px)切到竖版拼图 */
          <div className="hl-bgframe">
            {wallUrlM ? (
              <picture>
                <source media="(max-width: 700px)" srcSet={wallUrlM} />
                <img className="hl-bg" src={wallUrl} alt="" />
              </picture>
            ) : (
              <img className="hl-bg" src={wallUrl} alt="" />
            )}
          </div>
        ) : (
          <div className="hl-herobg" />
        )}
        {/* WorkChibi 手账贴纸：单人=1张，双人=2张（数组顺序=从左到右），每次刷新随机换款 */}
        <div className="hl-chibi">
          {stick.map((s) => (
            <img key={s} src={s} alt="" />
          ))}
        </div>
        <div className="hl-top">
          <div className="hl-brand">
            {th.brandA}
            <b>{th.brandB}</b>
            {th.brandC}
          </div>
          <div className="hl-nav">
            <button className="hl-chip hl-chipb" onClick={() => setIsCommentModalOpen(true)}>
              💬 留言<b>{comments.length}</b>
            </button>
          </div>
        </div>
        <div className="hl-tagline">
          <div className="hl-eyebrow">
            {wallItem
              ? wallItem.name
                ? `${wallItem.label ?? th.pill} · ${stripCG(wallItem.name)}`
                : (wallItem.label ?? th.pill)
              : th.eyebrow}
          </div>
          <h1 className="hl-title">
            朧<em>.</em>
          </h1>
        </div>
      </div>

      {/* 叠层资料卡 */}
      <div className="hl-body">
        <div className="hl-panel">
          <div className="hl-id">
            <div className="hl-avawrap">
              <div className="hl-ava" onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
                <img src={config.avatarImage} alt="朧" />
              </div>
            </div>

            <div className="hl-who">
              <div className="hl-nm">
                <h2 onClick={() => setIsModalOpen(true)} style={{ cursor: 'pointer' }}>
                  {config.name}
                </h2>
                {th.badge && <span className="hl-goldtag">{th.badge}</span>}
              </div>
              <p className="hl-bio">{config.bio}</p>
              <div className="hl-domain">
                <i></i> huioboro.xyz
              </div>
            </div>

            <div className="hl-right">
              {th.online && <span className="hl-online">{th.online}</span>}
              <button className="hl-cta" onClick={() => setIsCommentModalOpen(true)}>
                💬 互动留言板 <small>{comments.length}</small>
              </button>
            </div>
          </div>

          <div className="hl-meta">
            {config.details.map((item, index) => (
              <span key={index}>
                {item.icon} {item.label}
              </span>
            ))}
          </div>
        </div>

        {/* 应用区 */}
        <div className="hl-sec">
          <h3>我的应用与空间</h3>
        </div>
        <div className="hl-grid">
          {cards.map((card, index) =>
            card.active ? (
              <Link
                key={index}
                href={card.link}
                className="hl-tile"
                {...(NEW_TAB.has(card.link)
                  // prefetch:false —— 这链接点下去是浏览器原生整页跳转，
                  // 不预取（否则 App Router 会去拉 *.html 的 RSC payload，白费一次请求）
                  ? { target: '_blank', rel: 'noopener noreferrer', prefetch: false }
                  : {})}
              >
                <span className="hl-tag">{card.tag}</span>
                <div className="hl-ico">{card.icon}</div>
                <div className="hl-t">
                  {card.title} <span className="hl-go">→</span>
                </div>
                <div className="hl-s">{card.subtitle}</div>
              </Link>
            ) : (
              <div key={index} className="hl-tile hl-dim">
                <div className="hl-ico">{card.icon}</div>
                <div className="hl-t">{card.title}</div>
                <div className="hl-s">{card.subtitle}</div>
                <span className="hl-stamp">籌備中</span>
              </div>
            )
          )}
        </div>

        <footer className="hl-footer">
          © 2026 huioboro.xyz · Personal Station
        </footer>
      </div>

      {/* 背景音乐的悬浮按钮/面板现在由 app/music.tsx 全局渲染（站内切页不断歌） */}

      {/* 悬浮留言按钮 */}
      <button className="hl-fab" onClick={() => setIsCommentModalOpen(true)}>
        💬 留言 <b>{comments.length}</b>
      </button>

      {/* 主题切换（预览用，可随时去掉） */}
      <button className="hl-themesw" onClick={switchTheme} title="随机换一套">
        🎲 {th.pill}
      </button>

      {/* ===== 详细名片弹窗 ===== */}
      {isModalOpen && (
        <div className="hl-mask">
          <div className="hl-modal" style={{ maxWidth: 520 }}>
            <button className="hl-close" onClick={() => setIsModalOpen(false)}>
              ✕
            </button>
            <div className="hl-mhead">
              <div className="av">
                <img src={config.avatarImage} alt="Avatar" />
              </div>
              <div>
                <h3>{config.name}</h3>
                <p style={{ color: '#9d9077', fontSize: 12, marginTop: 3 }}>{config.bio}</p>
              </div>
            </div>
            <div className="hl-mbody">
              <div className="hl-msec">
                <h4>💡 关于我</h4>
                <div className="hl-box">👋 嗨！我是朧。这里是我的个人空间，随缘更新代码与生活。</div>
              </div>
              <div className="hl-msec">
                <h4>🎯 状态与喜好</h4>
                <div className="hl-duo">
                  <div className="hl-in2">
                    <b>♛ 推し</b>
                    <div>月永レオ · 巴日和</div>
                  </div>
                  <div className="hl-in2">
                    <b>❤️ 応援CP</b>
                    <div>レオ司 / 純日和</div>
                  </div>
                  <div className="hl-in2">
                    <b>🎮 游戏</b>
                    <div>单机 / 休闲 / 开放世界</div>
                  </div>
                  <div className="hl-in2">
                    <b>🎧 音乐</b>
                    <div>流行 / 电子 / 动漫 OST</div>
                  </div>
                </div>
              </div>
              <div className="hl-msec">
                <h4>📬 如何联系我</h4>
                <div className="hl-box" style={{ fontFamily: 'ui-monospace,Consolas,monospace', fontSize: 12 }}>
                  Domain: huioboro.xyz　·　GitHub: @huioboro
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 留言板弹窗 ===== */}
      {isCommentModalOpen && (
        <div className="hl-mask">
          <div className="hl-modal" style={{ maxWidth: 640, width: '100%' }}>
            <button className="hl-close" onClick={() => setIsCommentModalOpen(false)}>
              ✕
            </button>
            <div className="hl-mhead" style={{ justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>💬</span>
                <h3>全端同步留言板</h3>
                <span style={{ fontSize: 11, color: '#b39a4f', background: '#f6efdd', padding: '2px 9px', borderRadius: 999 }}>
                  {comments.length} 条留言
                </span>
              </div>
              <button className={`hl-adminbtn ${isAdmin ? 'on' : ''}`} onClick={handleAdminAuth}>
                {isAdmin ? '🔓 已开启删除' : '🔒 管理员'}
              </button>
            </div>

            <div className="hl-mbody" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <form onSubmit={handleAddComment} className="hl-form">
                <input
                  type="text"
                  placeholder="你的昵称（可选，默认：热心网友）"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="hl-field"
                  style={{ marginTop: 0 }}
                />
                <textarea
                  rows={3}
                  placeholder="给 朧 留个言吧..."
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  className="hl-field"
                  required
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="hl-send">
                    发送云端留言 ✨
                  </button>
                </div>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {loading ? (
                  <div className="hl-empty">正在连接 Supabase 云数据库...</div>
                ) : comments.length === 0 ? (
                  <div className="hl-empty">还没云端留言哦，快来抢沙发吧~</div>
                ) : (
                  comments.map((item) => (
                    <div key={item.id} className="hl-citem" style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <span className="who">{item.name}</span>
                        <span className="time">{item.time}</span>
                        <p>{item.content}</p>
                      </div>
                      {isAdmin && (
                        <button
                          className="hl-del"
                          onClick={() => handleDeleteComment(item.id)}
                          style={{ alignSelf: 'flex-start', flexShrink: 0 }}
                        >
                          删除
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                padding: '10px 28px 14px',
                textAlign: 'center',
                fontSize: 11,
                color: '#c2b48a',
                borderTop: '1px dashed #ece0c6',
              }}
            >
              🌐 已连接 Supabase 云端数据库 · 多端实时同步
            </div>
          </div>
        </div>
      )}
    </main>
      )}

      {/* 首帧「朧」启动屏：主题未定=中性底；主题定下=换主题配色并渐变浮现 */}
      {showSplash && (
        <div
          className={`hl-splash${th ? ' hl-themed' : ''}${revealed ? ' hl-out' : ''}`}
          data-theme={th ? th.key : undefined}
        >
          <span className="hl-wash" aria-hidden />
          <div className="hl-soboro">
            朧<span>.</span>
          </div>
        </div>
      )}
    </div>
  );
}
