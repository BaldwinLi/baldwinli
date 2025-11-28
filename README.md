# BaldwinLi 工具库

这是一个功能丰富的前端工具库，提供了核心功能模块和Vue相关的hooks工具，帮助开发者更高效地构建Web应用。

## 项目结构

项目采用monorepo结构，包含以下主要包：

- `@baldwinli/core`：核心功能库，提供基础服务和工具函数
- `@baldwinli/vue-hooks`：Vue相关的hooks集合，基于core包构建

## 安装

### 安装核心包

```bash
npm install @baldwinli/core
# 或
yarn add @baldwinli/core
# 或
pnpm add @baldwinli/core
```

### 安装Vue Hooks包

```bash
npm install @baldwinli/vue-hooks
# 或
yarn add @baldwinli/vue-hooks
# 或
pnpm add @baldwinli/vue-hooks
```

## 包功能介绍

### @baldwinli/core

核心功能库，提供以下功能：

- **缓存服务**：支持localStorage、sessionStorage和cookie的统一缓存管理
- **HTTP客户端**：封装fetch API，提供便捷的HTTP请求方法
- **事件总线**：实现组件间通信的事件发射器
- **依赖注入**：基于装饰器的依赖注入系统
- **工具函数**：提供各种实用的工具方法

详细文档请查看：[core包文档](./packages/core/core-package-docs.md)

### @baldwinli/vue-hooks

Vue相关的hooks集合，提供以下功能：

- **useDefer**：优化浏览器绘制性能，避免大量元素渲染导致的卡顿
- **useCompRef**：组件引用管理
- **timeout**：定时器相关hooks
- **state-ref**：状态引用管理
- **use-model-props**：Vue模型属性处理

详细文档请查看：[vue-hooks包文档](./packages/vue-hooks/vue-hooks-package-docs.md)

## 开发指南

### 克隆项目

```bash
git clone <repository-url>
cd baldwinli
```

### 安装依赖

```bash
npm install
# 或
pnpm install
```

### 构建项目

```bash
# 构建所有包
npm run build

# 仅构建core包
npm run build:core

# 仅构建vue-hooks包
npm run build:vue-hooks
```

## 技术栈

- TypeScript
- Vue 3
- Vite
- Radash
- QS
- Decimal.js

## 贡献指南

欢迎提交Issue和Pull Request来帮助改进这个项目。

## 许可证

ISC License