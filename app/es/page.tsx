import Link from 'next/link';

export const metadata = {
  title: '偶像梦幻祭 工具箱 | 朧的个人空间',
};

const tools = [
  {
    title: '卡面一览',
    desc: 'ES!Music 全卡面(2☆~5☆) · SPP(特殊演出)筛选',
    icon: '🎤',
    link: '/es/cards.html',
    tag: '已上线',
    gradient: 'from-lime-400 via-lime-500 to-lime-600',
  },
];

export default function EsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <Link
          href="/"
          className="text-xs text-slate-500 hover:text-lime-600 transition-colors"
        >
          ← 返回首页
        </Link>

        {/* Bright me up Eden 主视觉背景 hero */}
        <div className="relative rounded-3xl overflow-hidden border border-lime-200/70 shadow-sm mt-6 h-[240px] sm:h-[340px]">
          {/* 用 <img> 铺底(object-cover)而非 CSS 背景: 浏览器原生处理缩放,不拉伸变形发虚;移动端自动加载小图 cover-mobile.jpg 加快首屏 */}
          <picture>
            <source media="(max-width:760px)" srcSet="/es/cover-mobile.jpg" />
            <img
              src="/es/cover.jpg"
              alt="Bright me up Eden 主视觉"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: '50% 25%' }}
            />
          </picture>
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(100deg, rgba(255,255,255,.92) 0%, rgba(255,255,255,.6) 38%, rgba(255,255,255,.18) 72%, rgba(255,255,255,0) 100%)',
            }}
          ></div>
          <div className="relative p-6 sm:p-8 z-10">
            <span className="inline-block bg-white/60 border border-lime-600/25 text-lime-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-3 tracking-wide">
              Ensemble Stars!!
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-lime-900 tracking-tight">
              偶像梦幻祭 工具箱
            </h1>
            <p className="text-lime-800/80 text-sm mt-2">
              全偶像卡面、SPP 特殊演出与资料合集
            </p>
          </div>
        </div>

        {/* ES 工具 */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ES 工具
            </span>
          </div>

          <div className="space-y-4">
            {tools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.link}
                className="block bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-xl shrink-0`}
                  >
                    {tool.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-lg text-slate-900 hover:text-lime-600 transition-colors">
                        {tool.title}
                      </h2>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-50 text-lime-700 border border-lime-200/70">
                        {tool.tag}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </div>
              </Link>
            ))}

            {/* 预留后续工具 */}
            <div className="bg-white/50 rounded-2xl p-6 border border-dashed border-slate-200 text-center text-slate-400 text-sm">
              更多 ES 工具制作中，敬请期待~
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
