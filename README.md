# 梦宠数智官网 R10.0
当前版本：2026.10.06-r10.1-footer-wechat

本版本以当前 main 的既有品牌资产与完整官网文案为唯一内容基准，在 R09.1 Human Responsive UI System 上完成 Landing Page 构图重构；不改 Logo、不改品牌色、不改既有营销文案。

## 页面结构

- Hero：宠物全生命周期大数据认证平台
- 01 企业简介
- 02 平台定位
- 03 客户价值
- 04 平台能力
- 05 生态合作
- 合作 CTA / Footer

历史版本中独立的“一个平台 · 打通全链”“核心业务场景”不再作为独立长章节；相关内容归入平台能力，减少导航和内容重复。

## 品牌资产

assets/brand/brand.svg 与 assets/brand/logo-mark.svg 均由用户提供的原始 Logo 截图进行路径化描摹，不依赖字体实时渲染，也不再使用此前推测性的旧 Logo。

## English Terminology\n\n统一官网英文栏目与平台名称表达：`PET FULL-LIFECYCLE BIG DATA CERTIFICATION PLATFORM`、`COMPANY PROFILE`、`PLATFORM POSITIONING`、`CUSTOMER VALUE`、`PLATFORM CAPABILITIES`、`ECOSYSTEM PARTNERSHIPS`、`PARTNERSHIPS`。\n\n## Navigation Architecture

导航按 viewport 宽度切换，不按 UA 或 pointer 类型猜设备：

- >1100px：Desktop 横向导航
- <=1100px：统一 Menu
- Android Chrome / Alook / iPad / Tablet / Mobile：统一 root-level fixed dialog
- 横屏手机仍保持 Menu

导航模型分别定义：

- id：URL/业务入口
- targetId：精准滚动锚点
- sectionId：当前章节观察目标

点击、Hash、Back/Forward、Android 系统 Back、Esc、遮罩关闭均由同一个 Navigation Controller 协调，避免多个入口各自维护 offset。

## Cloudflare

继续使用 Workers Static Assets + 404-page；root/www custom domains 保持不变。

## CSS Integrity

CSS 文件在 CI 中执行结构完整性检查，校验注释、字符串以及 {} / () / [] 平衡，并对核心章节和响应式断点执行 selector contract。响应式规则按基础、Tablet、Mobile、<=420px、Mobile Landscape 顺序维护，避免后置补丁覆盖主规则。

## Responsive Layout Contract

Eco 使用完整的命名网格区域契约：Tablet 为“中心平台 + 两列伙伴”，Mobile 为“中心平台 + 单列伙伴”，Mobile Landscape 为“中心平台 + 两列伙伴”。禁止通过 `grid-template-areas:none` 取消核心布局后依赖子项 `grid-area` 侥幸自动布局。

## R10.0 Human Landing Redesign

- Hero、企业简介、平台定位、客户价值、平台能力、生态合作与合作 CTA 重新组织视觉节奏。
- Hero 数据标签从图片周围的浮动覆盖改为图片下方的受控元信息栅格，避免多终端遮挡。
- 企业简介区将现有生命周期模块提升为前置证明层，同时保留现有公司建筑图片。
- 使用新的组合样式层 `css/r10-landing.css`，不引入框架、依赖或新的运行时。
- 所有显示文案直接沿用 `index.html` 现有内容；Logo 继续使用 `assets/brand/brand.svg`。
- 保留导航 Controller、精确锚点、safe-area、Android/Alook Menu、Cloudflare Workers Static Assets 与 404 路由。

## R10.1 Footer WeChat

- Footer 新增微信公众号入口，使用本地 `assets/images/social/wechat-official.svg`，不依赖第三方二维码服务。
- 桌面端二维码独立位于 Footer 右侧；移动端按可读、可点击、可扫描原则重新组合。
- 二维码目标为用户提供的官方入口：`http://weixin.qq.com/r/mp/CSDF3RDEkE3vrVS_93Ub`。
- QR 中心复用现有 canonical `assets/brand/logo-mark.svg`，不新增品牌图形。
