'use client';

// 背景音乐：全局播放器（挂在 app/layout.tsx 里）。
//
// 为什么放 layout 不放首页：首页是「一个页面组件」，从首页跳到 /blog 时它会被卸载，
// 挂在它里面的 <audio> 跟着销毁、歌就断了。挂在 layout 上则站内客户端跳转（软导航）
// 全程不卸载，歌一路放着。
//
// 静态页（public/timetable.html）救不了 —— 那是整页跳转，React 树整个重建。
// 那种情况靠 sessionStorage 兜：离开时把「哪首 / 播到几秒 / 是否在放 / 音量」存下来，
// 下次任意页面加载时接着播。

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface Track {
  src: string;
  title: string;
  artist: string;
  dur: string;
}

const TRACKS: Track[] = [
  { src: '/music/01_ai_no_mae.mp3', title: '大いなる愛の前に全ては巡り来る', artist: 'Eden · あんさんぶるスターズ！！', dur: '3:29' },
  { src: '/music/02_ai_no_mae_inst.mp3', title: '大いなる愛の前に全ては巡り来る (Instrumental)', artist: 'Eden · あんさんぶるスターズ！！', dur: '3:29' },
  { src: '/music/03_bible.mp3', title: 'The Bible of The “Eden”', artist: 'Eden · あんさんぶるスターズ！！', dur: '6:00' },
];

const SKEY = 'hl.music'; // sessionStorage：{i 曲目, t 秒数, on 是否在放, vol 音量}
const TKEY = 'hl.theme'; // localStorage：当前皮肤 key（给悬浮件取主题色用）
const THEME_EVT = 'hl:theme';

interface Saved {
  i?: number;
  t?: number;
  on?: boolean;
  vol?: number;
}

interface MusicCtxValue {
  tracks: Track[];
  musicOn: boolean;
  trackIdx: number;
  volume: number;
  play: (i: number) => void;
  toggle: () => void;
  setVol: (v: number) => void;
}

const MusicCtx = createContext<MusicCtxValue | null>(null);

export function useMusic() {
  const v = useContext(MusicCtx);
  if (!v) throw new Error('useMusic 必须在 <MusicProvider> 里用');
  return v;
}

export function MusicProvider({ children }: { children: ReactNode }) {
  const [trackIdx, setTrackIdx] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackRef = useRef(0); // 存盘时要拿「当前曲目」，用 ref 免得闭包读到旧 state

  // 播放状态直接由 <audio> 的 play/pause 事件驱动（自动播放成功、手势兜底、
  // 用户点按钮、系统暂停 —— 全都走这两个事件，不用各处手动 setState）
  useEffect(() => {
    trackRef.current = trackIdx;
  }, [trackIdx]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    // 1) 恢复上次的曲目 / 音量 / 进度 / 播放状态
    let s: Saved = {};
    try {
      s = JSON.parse(sessionStorage.getItem(SKEY) || '{}') as Saved;
    } catch {
      /* 脏数据就当没有 */
    }
    const i = typeof s.i === 'number' && s.i >= 0 && s.i < TRACKS.length ? s.i : 0;
    const vol = typeof s.vol === 'number' ? Math.min(1, Math.max(0, s.vol)) : 0.8;
    const wantPlay = s.on !== false; // 没有记录 = 首次来，照旧尝试自动播放
    setTrackIdx(i);
    setVolume(vol);
    a.volume = vol;
    const src = TRACKS[i].src;
    a.setAttribute('src', src);
    a.load();
    if (typeof s.t === 'number' && s.t > 1) {
      const seek = s.t;
      a.addEventListener(
        'loadedmetadata',
        () => {
          a.currentTime = Math.min(seek, Math.max(0, a.duration - 2));
        },
        { once: true },
      );
    }

    // 2) 试着直接播；被自动播放策略拦了就挂一次性手势监听，用户点哪都算
    let ac: AbortController | null = null;
    const disarm = () => {
      ac?.abort();
      ac = null;
    };
    const kick = () => {
      a.play().then(disarm).catch(() => {});
    };
    const arm = () => {
      if (ac) return;
      ac = new AbortController();
      const opt = { capture: true, signal: ac.signal };
      document.addEventListener('pointerdown', kick, opt);
      document.addEventListener('touchstart', kick, opt);
      document.addEventListener('keydown', kick, opt);
    };
    if (wantPlay) a.play().catch(arm);
    else arm();

    // 3) 存盘：整页跳转/关标签前 + 播放中每 5 秒（防崩溃丢进度）。
    //    站内软导航不会触发（<audio> 没卸载，也不需要存）。
    const save = () => {
      try {
        sessionStorage.setItem(
          SKEY,
          JSON.stringify({ i: trackRef.current, t: a.currentTime, on: !a.paused, vol: a.volume }),
        );
      } catch {
        /* 隐私模式写不进去就算了 */
      }
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') save();
    };
    const timer = window.setInterval(() => {
      if (!a.paused) save();
    }, 5000);
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      save(); // 卸载前也存一次（正常不该发生，<audio> 在 layout 里）
      disarm();
      window.clearInterval(timer);
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  // 用户主动切曲 / 播放
  const play = useCallback((i: number) => {
    const a = audioRef.current;
    if (!a) return;
    const src = TRACKS[i].src;
    if (i !== trackRef.current) {
      trackRef.current = i;
      setTrackIdx(i);
    }
    if (a.getAttribute('src') !== src) {
      a.setAttribute('src', src);
      a.load();
    }
    a.play().catch((e: unknown) => {
      // 自动播放策略拒绝是正常的（等用户来点），只有「文件读不到」才提示
      if ((e as DOMException | undefined)?.name !== 'NotAllowedError') {
        alert('音乐文件还没放好：请把 mp3 复制到 public/music/，刷新后就能播了。');
      }
    });
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
    else a.pause();
  }, []);

  const setVol = useCallback((v: number) => {
    setVolume(v);
    const a = audioRef.current;
    if (a) a.volume = v;
  }, []);

  return (
    <MusicCtx.Provider value={{ tracks: TRACKS, musicOn, trackIdx, volume, play, toggle, setVol }}>
      {children}
      <audio
        ref={audioRef}
        preload="auto"
        onPlay={() => setMusicOn(true)}
        onPause={() => setMusicOn(false)}
        onEnded={() => play((trackRef.current + 1) % TRACKS.length)}
      />
      <MusicDock />
    </MusicCtx.Provider>
  );
}

// 左下角悬浮播放器：首页和各子页都在（所以子页也能暂停/切歌）
function MusicDock() {
  const m = useMusic();
  const [open, setOpen] = useState(false);
  // 主题色：首页挑的皮肤会同步到 localStorage + 广播事件。放到 effect 里读，
  // 避免服务端渲染拿不到 localStorage 造成 hydration 不一致。
  const [theme, setTheme] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        setTheme(localStorage.getItem(TKEY));
      } catch {
        /* 忽略 */
      }
    };
    read();
    const onEvt = (e: Event) => setTheme(String((e as CustomEvent).detail || 'leo'));
    window.addEventListener(THEME_EVT, onEvt);
    return () => window.removeEventListener(THEME_EVT, onEvt);
  }, []);

  const t = m.tracks[m.trackIdx];
  return (
    <div className="hl-musicdock" data-theme={theme ?? 'leo'}>
      <div className="hl-muswrap">
        {open && (
          <div className="hl-muspanel">
            <div className="hl-mushead">
              <div className="hl-musnow">
                <span className="hl-muslbl">{m.musicOn ? '播放中' : '已暂停'}</span>
                <b>{t.title}</b>
              </div>
              <button className="hl-musclose" onClick={m.toggle} title={m.musicOn ? '暂停' : '播放'}>
                {m.musicOn ? '⏸' : '▶'}
              </button>
              <button className="hl-musclose" onClick={() => setOpen(false)} title="收起">✕</button>
            </div>
            <div className="hl-muslist">
              {m.tracks.map((x, i) => (
                <button key={i} className={`hl-track${i === m.trackIdx ? ' hl-trackon' : ''}`} onClick={() => m.play(i)}>
                  <span className="hl-trkno">{i + 1}</span>
                  <span className="hl-trkname">{x.title}</span>
                  {i === m.trackIdx && m.musicOn && <span className="hl-trkply">▶</span>}
                </button>
              ))}
            </div>
            <div className="hl-musvol">
              <label htmlFor="hlvol" title="音量">🔊</label>
              <input
                id="hlvol"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={m.volume}
                onChange={(e) => m.setVol(Number(e.target.value))}
              />
              <span className="hl-volpct">{Math.round(m.volume * 100)}%</span>
            </div>
          </div>
        )}
        <button className={`hl-mus ${m.musicOn ? 'playing' : ''}`} onClick={() => setOpen((o) => !o)} title="背景音乐">
          {m.musicOn ? '🎵 音乐播放中' : '🎵 播放音乐'}
          <small className="hl-mustag">{t.dur}</small>
        </button>
      </div>
    </div>
  );
}
