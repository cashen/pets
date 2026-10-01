# 梦宠数智官网 R07

当前版本：2026.10.01-r07.0-brochure-rebuild

本阶段以最新企业宣传长图为内容基准，重构官网的信息架构与视觉系统。

## 页面结构

- Hero：宠物全生命周期大数据认证平台
- 01 企业简介
- 02 平台定位
- 03 客户价值
- 04 平台能力
- 05 生态合作
- 合作 CTA / Footer

历史版本中独立的“一个平台 · 打通全链”“核心业务场景”不再作为独立长章节；相关内容已归入平台能力中的“五大服务”和治理/用户服务区，避免页面重复与导航过载。

## 终端策略

页面保持桌面、Tablet、Android Chrome、Alook、iPad 共用语义内容模型；移动端导航使用根层 fixed dialog，不依赖 transform drawer、body overflow 锁定或 UA sniffing。横屏手机保持双栏 Hero，其余正文按单列阅读节奏展开。

## Cloudflare

继续使用 Workers Static Assets + 404-page。生产域名绑定由 wrangler.jsonc 的 root/www custom domains 管理。本次只改变前端内容与视觉架构，不引入 Worker runtime 或额外构建链。
