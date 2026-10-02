# 梦宠数智官网 R08.5
当前版本：2026.10.02-r08.5-responsive-layout-contract

本版本以最新企业宣传长图作为内容基准，完成导航系统与品牌 Logo 收口，并统一官网英文术语。

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
