# 首页皮肤修复 · 任务挂起备忘(2026-09-04)

完整恢复依据在 Claude 记忆 `homepage-skin-fix.md`(本会话会自动加载)。这行摘要防止项目目录打开时找不到上下文。

## 待办
- P1 去掉 q版贴纸 `hl-stuck` 滚出吸附右上角(突兀)
- P2 PC 端 q版小人恢复自然错落/旋转;移动端保留同底线(为修手机错位)
- P3 去掉 `.hl-chibi` 外层 20px 阴影与 img 4px 深阴影(PC 灰底);白模切圈先留
- P4 **CP(leosou/junhiyo)壁纸接缝 → 中间无缝融合**:重生成 `public/walls/leosou/*.jpg` + `public/walls/junhiyo/*.jpg`(用户已确认此方案)
- P5 深色模式「朧」启动屏仍变暗(迅雷/手机 auto-dark)→ head 加 color-scheme meta 等

## 涉及文件
`app/page.tsx` `app/globals.css` `app/layout.tsx` `public/walls/{leosou,junhiyo}/*.jpg`
工具:`C:\Users\su289\_seamdetect.py`(列跳变找接缝)
改完:`npx next build`(TS) → `npx next start -p 3123` 本地验证
