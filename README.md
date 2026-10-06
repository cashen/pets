# 梦宠数智官网 R13

当前版本：2026.10.06-r14-media-heading-cleanup

本版本基于 R12 Human Copy Audit，继续收口官网的公开信息表达与项目文档一致性。保留现有 Logo、品牌色、核心业务事实、导航架构、响应式体系及 Cloudflare Workers Static Assets 架构。

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
- 横屏手机仍保持 Menu

导航模型分别定义：

- id：URL/业务入口
- targetId：精准滚动锚点
- sectionId：当前章节观察目标

点击、Hash、Back/Forward、Android 系统 Back、Esc、遮罩关闭均由同一个 Navigation Controller 协调。

## Cloudflare

继续使用 Workers Static Assets + 404-page；`montpets.com` 与 `www.montpets.com` custom domains 保持不变。

## CSS Integrity

CSS 文件在 CI 中执行结构完整性检查，校验注释、字符串以及 {} / () / [] 平衡，并对核心章节和响应式断点执行 selector contract。

## Responsive Layout Contract

Eco 使用明确的命名网格区域契约：

- Tablet：中心平台 + 两列伙伴
- Mobile：中心平台 + 单列伙伴
- Mobile Landscape：中心平台 + 两列伙伴

禁止通过 `grid-template-areas:none` 取消核心布局后依赖子项自动排布。

## Human Copy Contract

公开页面面向官网访客，不放置开发流程说明、页面架构说明或版本维护提示。对外表达优先使用具体业务事实、使用场景和可核验的信息；媒体报道明确标注来源并链接原文。

当前 R12/R13 保留的核心品牌与产品术语包括：

- 宠物全生命周期
- 一宠一芯一档一码
- 宠物身份数据
- 宠物数字档案
- 溯源与流转记录
- 五大服务
- 医疗健康
- 数据接口


## R14 Media Coverage

媒体报道区仅保留栏目标题与实际报道内容，不重复解释栏目含义；外部报道继续直接链接原文。
