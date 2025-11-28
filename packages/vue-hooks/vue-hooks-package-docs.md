# @baldwinli/vue-hooks 包文档

## 包概述

`@baldwinli/vue-hooks` 是一个为 Vue 3 应用提供的扩展 Hook 工具集，基于 @baldwinli/core 包构建，提供了丰富的响应式状态管理、组件交互优化和异步操作处理等功能。它旨在简化 Vue 3 应用的开发，提高代码质量和开发效率。

### 主要功能

- **响应式状态管理**：提供同步和异步状态引用的创建和管理
- **组件性能优化**：延迟渲染、类型化引用等优化工具
- **异步操作处理**：便捷的定时器、延迟执行和异步状态管理
- **组件交互增强**：简化 v-model 双向绑定、组件引用等交互模式
- **装饰器支持**：为类组件提供状态管理装饰器

### 包结构

```
├── use-defer/         # 延迟渲染优化Hook
│   └── index.ts
├── use-comp-ref/      # 类型化组件引用Hook
│   └── index.ts
├── timeout/           # 延迟执行和DOM更新工具
│   └── index.ts
├── state-ref/         # 响应式状态引用核心模块
│   ├── index.ts       # 主要Hook实现
│   └── decorators.ts  # 状态管理装饰器
├── use-model-props/   # 组件props双向绑定Hook
│   └── index.ts
├── index.ts           # 包入口文件
└── package.json       # 包配置文件
```

## 核心模块详解

### state-ref 模块

state-ref 是该包的核心模块，提供了全面的响应式状态管理能力，包括同步和异步状态的处理。

#### useStateRef - 基础状态引用

**功能**：创建一个简单的响应式状态引用

**使用示例**：

```typescript
import { useStateRef } from '@baldwinli/vue-hooks';

// 创建基础状态引用
const counter = useStateRef(0);

// 更新状态
counter.value = 1;

// 读取状态
console.log(counter.value); // 1
```

#### writableRef - 可写响应式引用

**功能**：创建可写的响应式引用，支持自定义设置逻辑

**使用示例**：

```typescript
import { writableRef } from '@baldwinli/vue-hooks';

// 创建带验证的可写引用
const ageRef = writableRef(18, {
  set: (value) => {
    // 验证年龄范围
    if (value >= 0 && value <= 150) {
      return value;
    }
    throw new Error('年龄必须在0-150之间');
  }
});

// 正确设置
ageRef.value = 30;

// 错误设置会抛出异常
// ageRef.value = 200;
```

#### readableRef - 只读响应式引用

**功能**：创建只读的响应式引用，适合从外部源获取数据

**使用示例**：

```typescript
import { readableRef } from '@baldwinli/vue-hooks';

// 创建一个每秒更新的时间引用
const timeRef = readableRef(new Date(), {
  start: (update) => {
    const timer = setInterval(() => {
      update(new Date());
    }, 1000);
    
    // 返回清理函数
    return () => clearInterval(timer);
  }
});

// 只能读取，无法修改
console.log(timeRef.value);
```

#### asyncWritableRef - 异步可写引用

**功能**：创建支持异步操作的可写响应式引用，管理异步状态

**使用示例**：

```typescript
import { asyncWritableRef } from '@baldwinli/vue-hooks';

// 创建异步状态引用，用于API调用
const userInfoRef = asyncWritableRef(
  null,
  async (userId: string) => {
    // 模拟API调用
    const response = await fetch(`/api/users/${userId}`);
    return await response.json();
  }
);

// 执行异步操作
async function loadUser(userId: string) {
  // 执行异步操作并自动管理状态
  const userInfo = await userInfoRef.execute(userId);
  console.log('用户信息:', userInfo);
}

// 检查状态
console.log('加载状态:', userInfoRef.loading.value);
console.log('错误信息:', userInfoRef.error.value);
```

#### asyncReadableRef - 异步只读引用

**功能**：创建只读的异步响应式引用，适合从API自动加载数据

**使用示例**：

```typescript
import { asyncReadableRef } from '@baldwinli/vue-hooks';

// 创建自动加载的异步只读引用
const [userList, { loading, error, execute }] = asyncReadableRef(
  async () => {
    const response = await fetch('/api/users');
    return await response.json();
  },
  { initVal: [] }
);

// 手动重新执行
async function refreshUsers() {
  await execute();
}
```

#### asyncReducableRef - 可归约异步引用

**功能**：创建支持状态累积的异步响应式引用，适合分页加载等场景

**使用示例**：

```typescript
import { asyncReducableRef } from '@baldwinli/vue-hooks';

// 创建支持分页加载的归约引用
const [userList, { loading, error, execute, reduce }] = asyncReducableRef(
  async (page = 1) => {
    const response = await fetch(`/api/users?page=${page}`);
    return await response.json();
  },
  { initVal: [] }
);

// 加载第一页
await execute(1);

// 加载第二页并合并结果
await reduce(2, (prev, next) => [...prev, ...next]);
```

### 装饰器支持

state-ref 模块还提供了装饰器，用于在类组件中进行状态管理：

```typescript
import { AsyncWritableRefReturn, FieldRef } from '@baldwinli/vue-hooks';

class UserService {
  @FieldRef('Unknown')
  username: string;
  
  @AsyncWritableRefReturn(
    async (userId: string) => {
      // 异步获取用户详情
      const response = await fetch(`/api/users/${userId}`);
      return await response.json();
    }
  )
  getUserDetail: any;
}

const service = new UserService();
// 使用装饰后的属性和方法
console.log(service.username.value); // 'Unknown'
const user = await service.getUserDetail.execute('123');
```

### use-defer 模块

**功能**：优化大量元素渲染时的浏览器性能，通过控制渲染次数避免卡顿

**使用示例**：

```vue
<template>
  <div v-for="(item, index) in 10000">
    <heavy-component :item="item" v-if="defer(index)" />
  </div>
</template>

<script setup>
import { useDefer } from '@baldwinli/vue-hooks';

// 创建延迟渲染控制函数，默认每次渲染100个元素
const defer = useDefer();

// 或者自定义每次渲染数量
// const defer = useDefer(200);
</script>
```

### use-comp-ref 模块

**功能**：创建类型化的组件引用，提供完整的TypeScript类型支持

**使用示例**：

```vue
<template>
  <MyComponent ref="componentRef" />
</template>

<script setup lang="ts">
import { useCompRef } from '@baldwinli/vue-hooks';
import MyComponent from './MyComponent.vue';

// 创建类型化的组件引用
const componentRef = useCompRef(MyComponent);

// 现在可以安全地访问组件实例的方法和属性
function callComponentMethod() {
  if (componentRef.value) {
    componentRef.value.someMethod(); // 有完整的类型提示
  }
}
</script>
```

### timeout 模块

**功能**：创建延迟Promise，并在延迟结束后执行Vue的nextTick确保DOM更新完成

**使用示例**：

```typescript
import { timeout } from '@baldwinli/vue-hooks';

// 延迟执行并等待DOM更新
async function delayedOperation() {
  console.log('开始操作');
  // 修改数据
  count.value++;
  // 等待1000毫秒并确保DOM更新
  await timeout(1000);
  console.log('DOM已更新，可以进行后续操作');
}

// 仅等待DOM更新，无延迟
async function waitForDomUpdate() {
  // 触发响应式更新
  updateData();
  // 等待DOM更新完成
  await timeout();
  // 此时DOM已完全更新
  doSomethingWithUpdatedDom();
}
```

### use-model-props 模块

**功能**：简化Vue组件中的v-model双向绑定，特别是对于复杂对象类型

**使用示例**：

```vue
<!-- 子组件 -->
<script setup lang="ts">
import { useModelProps } from '@baldwinli/vue-hooks';

// 定义组件的props
const props = defineProps<{
  userInfo: {
    name: string;
    age: number;
    address: {
      city: string;
      street: string;
    };
  };
}>();

// 定义emit
const emit = defineEmits<{
  'update:userInfo': [value: typeof props.userInfo];
}>();

// 创建响应式的model props引用
const modelProps = useModelProps(props, emit);

// 可以直接修改嵌套属性，会自动触发emit更新父组件
function updateAddress() {
  modelProps.userInfo.value.address.city = 'New City';
}
</script>

<template>
  <input v-model="modelProps.userInfo.value.name" />
  <button @click="updateAddress">更新地址</button>
</template>
```

## 与 core 包的集成

vue-hooks 包构建在 core 包之上，利用了其核心功能：

- 依赖注入系统：通过 Service、Inject 等装饰器实现组件与服务的解耦
- 事件管理：使用 Emitter 实现组件间通信和状态同步
- 工具函数：利用 core 包提供的各种工具函数进行底层实现

这种设计使两个包协同工作，core 提供基础能力，vue-hooks 提供 Vue 特定的集成和扩展。

## 最佳实践

1. **状态管理策略**：
   - 使用 useStateRef 进行简单状态管理
   - 使用 asyncWritableRef 和 asyncReadableRef 处理异步数据获取
   - 使用 asyncReducableRef 处理分页数据和状态累积

2. **性能优化**：
   - 对大型列表使用 useDefer 进行延迟渲染
   - 对频繁更新的状态考虑使用 Vue 的计算属性结合
   - 合理使用 timeout 确保DOM更新完成后再执行依赖DOM的操作

3. **类型安全**：
   - 使用 useCompRef 获取类型安全的组件引用
   - 为所有状态引用提供明确的类型注解
   - 利用 useModelProps 确保props更新的类型安全

4. **组件设计**：
   - 对于类组件，使用装饰器简化状态管理
   - 对于组合式API，合理组织和复用各种Hook
   - 保持组件的单一职责原则

## 版本历史

- v1.0.5：当前版本
- 依赖包：@baldwinli/core、radash、vue@^3.3.0

## 兼容性

- Vue 3.3.0 及以上版本
- 需要 TypeScript 支持（推荐 4.5+）
- 现代浏览器环境，对IE需要额外配置

## 相关包

- **@baldwinli/core**：vue-hooks包的核心依赖，提供依赖注入、事件管理、缓存服务等基础功能。
  - 文档链接：[core 包文档](../core/core-package-docs.md)