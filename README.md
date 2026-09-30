# Pets 官网 R06

当前版本：2026.09.30-r06.0-architecture-foundation

本阶段把页面从单体 HTML/CSS/JS 结构迁移到职责分离的前端基础架构，目标是让 Android Chrome、Alook、Tablet、Desktop 共用内容模型，同时允许不同终端采用不同的信息呈现策略。

## 目录

- `index.html`：页面语义与内容
- `css/tokens.css`：设计变量
- `css/base.css`：基础元素与可访问性基线
- `css/layout.css`：通用布局
- `css/components.css`：Header、Navigation、Button、Kicker 等基础组件
- `css/sections.css`：各业务区域的结构样式
- `css/responsive.css`：Desktop / Tablet / Android 响应式策略
- `js/navigation.js`：唯一导航模型
- `js/main.js`：导航运行时、锚点滚动、历史状态、章节高亮
- `scripts/validate-site.mjs`：静态结构校验

后续 UI 改造应优先修改对应职责文件，不再把新的响应式补丁堆回 `index.html`。
