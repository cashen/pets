# 梦宠数智官网 R08

当前版本：2026.10.02-r08.1-integrated-landing

R08.1 在 R07.2 已收口的信息架构基础上，完成整合版 Landing Page：企业年鉴式信息排版、数字底座视觉、生命周期数据关系、价值矩阵、平台能力分层，并把 Menu 多终端兼容纳入一级验收。

## Navigation

导航运行架构继续由 js/main.js + js/navigation.js 管理。R08.1 不改变 section ID、Hash、精准滚动与 Navigation Controller 状态模型。Menu 保持 root-level fixed dialog，并强化 body scroll lock、内部滚动、overscroll containment、safe-area 与低高度横屏表现；Desktop / Tablet / iPad / Android Chrome / Alook 使用同一导航逻辑。

## Cloudflare

继续使用 Workers Static Assets + 404-page；root/www custom domains 保持不变。