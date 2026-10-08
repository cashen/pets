# 梦宠数智官网 R17

当前版本：2026.10.08-r17.0-content-single-source

本版本在 R14 基础上收敛官网前端架构与多终端行为。保留现有 Logo、品牌色、核心业务事实、PR27/R10 视觉方向及 Cloudflare Workers Static Assets 架构。

## 页面结构

- Hero：宠物全生命周期大数据认证平台
- 01 企业简介
- 02 平台定位
- 03 客户价值
- 04 平台能力
- 05 生态合作
- 媒体报道
- 合作 CTA / Footer

“媒体报道”用于展示来自外部媒体的公开报道。外部来源直接链接原文；官网不会把外部报道重新包装成企业官方新闻。

## 品牌资产

assets/brand/brand.svg 与 assets/brand/logo-mark.svg 均为当前采用的路径化品牌 Logo，不依赖运行时字体渲染。

## English Terminology

统一官网英文栏目与平台名称表达：

- `PET FULL-LIFECYCLE BIG DATA CERTIFICATION PLATFORM`
- `COMPANY PROFILE`
- `PLATFORM POSITIONING`
- `CUSTOMER VALUE`
- `PLATFORM CAPABILITIES`
- `ECOSYSTEM PARTNERSHIPS`
- `PARTNERSHIPS`

## Navigation Architecture

导航按 viewport 宽度切换，不按 UA 或 pointer 类型猜设备：

- >1100px：Desktop 横向导航
- <=1100px：统一 Menu
- Android Chrome / Alook / iPad / Tablet / Mobile：统一 root-level fixed dialog
- 横屏手机仍保持 Menu；平板横屏使用双栏 Hero

导航模型分别定义：

- id：URL/业务入口
- targetId：精准滚动锚点
- sectionId：当前章节观察目标

点击、Hash、Back/Forward、Android 系统 Back、Esc、遮罩关闭均由同一个 Navigation Controller 协调；active section 依据滚动位置与精准锚点计算。

## Cloudflare

继续使用 Workers Static Assets + 404-page；`montpets.com` 与 `www.montpets.com` custom domains 保持不变。

## CSS Architecture

正式样式按 tokens / base / layout / components / sections / responsive 分层；首页原 landing composition 层已收敛到 components/sections，首页所有 breakpoint 规则统一进入 `css/responsive.css`。媒体报道继续由 `css/media.css` 独立负责页面级样式与自身响应式规则；旧的 `news.css` 引用已清除。

## Media Content Source

媒体报道采用单源内容模型：

- `content/news.json` 是唯一事实来源，只保存报道日期、来源、标题、摘要、作者/编辑与原文地址。
- `scripts/generate-news.mjs` 在构建前将同一数据生成到首页、`/news/` 归档页与各报道详情页。
- `node scripts/generate-news.mjs` 用于生成；`node scripts/generate-news.mjs --check` 只检查生成结果是否与内容源一致，不修改文件。
- 报道按日期倒序输出；`slug` 是稳定的详情路由标识，不能随意变更。
- 不在浏览器运行时 fetch JSON；Cloudflare 继续直接提供静态 HTML，保持 SEO、首屏和静态部署特性。
## Validation

CI 分为静态结构/内容契约、Wrangler deployment dry-run 与真实 Chromium 浏览器 smoke matrix。浏览器矩阵覆盖 Desktop、Laptop、Tablet portrait、Tablet landscape、Mobile portrait、Mobile landscape、360px 与 412px 小屏。

## Hero Media Contract

`hero.png` 直接使用本次上传的 1256×471 PNG 原图，不经过 WebP 转码或二次压缩。Hero 容器透明、无边框、无内边距；图片按 100% 宽度与自身自然高度显示，不裁切、不填充。现有 Logo、品牌色与核心文案保持不变。

## Responsive Layout Contract

Eco 使用明确的命名网格区域契约：

- Tablet portrait：中心平台 + 两列伙伴
- Tablet landscape：中心平台 + 两列伙伴，同时 Hero 为双栏
- Mobile portrait：中心平台 + 单列伙伴
- Mobile landscape：中心平台 + 两列伙伴

禁止通过 `grid-template-areas:none` 取消核心布局后依赖子项自动排布。

## Media Coverage Contract

媒体报道只保存来源、日期、标题、摘要与原文地址；首页与 `/news/` 保持同一报道集合并按日期倒序，Footer 提供低频入口；官网记录页不复制外部文章正文，不增加自我解释型导语。

## Human Copy Contract

公开页面面向官网访客，不放置开发流程说明、页面架构说明或版本维护提示。对外表达优先使用具体业务事实、使用场景和可核验的信息；媒体报道明确标注来源并链接原文。

当前 R15 保留的核心品牌与产品术语包括：

- 宠物全生命周期
- 一宠一芯一档一码
- 宠物身份数据
- 宠物数字档案
- 溯源与流转记录
- 五大服务
- 医疗健康
- 数据接口


## Asset Cache Versioning

`ui-version` 表示官网发布版本；资源 URL 的 `?v=` 采用资产组缓存版本，两者不强制相同。CSS 收敛阶段统一更新首页核心样式资源缓存版本，避免旧 stylesheet 与新结构混用。404 页面与当前发布资源版本保持一致。
