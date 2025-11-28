# @baldwinli/core 包文档

## 包概述

`@baldwinli/core` 是一个核心工具包，提供依赖注入、事件管理、缓存服务和面向切面编程等基础功能。它为前端应用提供了结构化、模块化的开发方式，特别适合构建复杂的Web应用和微前端架构。

### 主要功能

- **依赖注入系统**：提供IoC容器和装饰器，实现服务的注册、实例化和依赖管理
- **事件管理**：提供强大的事件发射器，支持跨标签页的状态共享
- **缓存服务**：封装多种存储方式(localStorage、sessionStorage、Cookie)的统一接口
- **面向切面编程(AOP)**：提供方法拦截和增强能力
- **工具函数**：提供各种实用工具和辅助函数

### 包结构

```
├── decorators/      # 装饰器目录
│   ├── advice.ts    # AOP切面装饰器
│   ├── autowired.ts # 自动依赖注入装饰器
│   ├── inject.ts    # 依赖注入装饰器
│   ├── service.ts   # 服务装饰器
│   └── store.ts     # 状态存储装饰器
├── services/        # 服务目录
│   ├── cache-service.ts     # 缓存服务
│   ├── cookie.storage.ts    # Cookie存储实现
│   └── http-client.ts       # HTTP客户端服务
├── utils/           # 工具目录
│   ├── emitter.ts       # 事件发射器
│   ├── math.ts          # 数学工具
│   ├── mobile-utils.ts  # 移动端工具
│   ├── provide.ts       # 依赖注入核心实现
│   ├── use-advice.ts    # AOP增强实现
│   ├── util.schema.ts   # 类型定义
│   └── utils.ts         # 通用工具函数
├── index.ts         # 包入口文件
└── package.json     # 包配置文件
```

## 核心模块详解

### 依赖注入系统

#### Service装饰器

**功能**：将类转换为单例服务，并在IoC容器中注册

**使用示例**：

```typescript
import { Service } from '@baldwinli/core';

// 基本用法
@Service
class UserService {
  getUserInfo(userId: string) {
    return { id: userId, name: '用户' };
  }
}

// 带名称注册
@Service('myService')
class NamedService {
  // 服务实现
}

// 带配置的用法
@Service('configService', { provideScope: 'root' })
class ConfigService {
  // 服务实现
}
```

#### Inject装饰器

**功能**：将IoC容器中的服务实例注入到类成员属性中

**使用示例**：

```typescript
import { Inject, Service } from '@baldwinli/core';

@Service
class UserController {
  @Inject(UserService)
  userService: UserService;
  
  getUser(id: string) {
    return this.userService.getUserInfo(id);
  }
}
```

#### Autowired装饰器

**功能**：自动从IoC容器中查找并注入已注册的服务实例

**使用示例**：

```typescript
import { Autowired, Service } from '@baldwinli/core';

// 先注册服务
@Service('userService')
class UserService {
  // 服务实现
}

// 自动装配服务
class UserController {
  @Autowired
  userService: UserService;
  
  // 使用服务
}
```

#### Provide函数

**功能**：从IoC容器中获取服务实例

**使用示例**：

```typescript
import { Provide, Service } from '@baldwinli/core';

@Service
class ApiService {
  // 实现
}

// 直接获取服务实例
const apiService = Provide(ApiService);
```

### 事件管理 (Emitter)

**功能**：创建事件消息实例，支持状态管理和跨标签页通信

**主要特性**：
- 状态维护和更新
- 跨标签页状态同步（通过BroadcastChannel）
- 事件监听和取消监听
- Promise转换支持

**使用示例**：

```typescript
import { Emitter } from '@baldwinli/core';

// 创建事件发射器
const userEmitter = new Emitter({ name: '', age: 0 }, {
  channelName: 'userState' // 启用跨标签页通信
});

// 监听事件
const unlisten = userEmitter.listen((user) => {
  console.log('用户信息更新:', user);
});

// 更新状态
userEmitter.set({ name: 'John', age: 30 });

// 使用回调函数更新状态
userEmitter.update(user => ({
  ...user,
  age: user.age + 1
}));

// 取消监听
unlisten();

// 转为Promise
userEmitter.toPromise().then(user => {
  console.log('获取到用户信息:', user);
});
```

### 缓存服务 (CacheService)

**功能**：提供统一的缓存接口，支持localStorage、sessionStorage和Cookie存储

**主要特性**：
- 多存储适配器支持
- 命名空间隔离
- 数据自动序列化
- 存储不可用时的降级策略

**使用示例**：

```typescript
import { cacheService, CacheService } from '@baldwinli/core';

// 使用全局单例实例
cacheService.set('userInfo', { id: 1, name: 'John' });
const userInfo = cacheService.get('userInfo');

// 移除特定缓存项
cacheService.remove('userInfo');

// 清空所有缓存
cacheService.clear();

// 切换存储方式
cacheService.storage = sessionStorage; // 切换到会话存储
cacheService.storage = localStorage;  // 切换到本地存储
```

### 面向切面编程 (AOP)

**功能**：提供方法拦截和增强能力，用于横切关注点如日志、事务、异常处理等

**使用示例**：

```typescript
import { Advice, Service } from '@baldwinli/core';

// 定义拦截器
const logInterceptor = {
  before: (target: any, methodName: string, args: any[]) => {
    console.log(`执行${methodName}方法，参数:`, args);
  },
  after: (target: any, methodName: string, result: any) => {
    console.log(`执行${methodName}方法完成，结果:`, result);
  },
  error: (target: any, methodName: string, error: Error) => {
    console.error(`执行${methodName}方法出错:`, error);
    throw error; // 可以选择重新抛出或处理错误
  }
};

// 应用Advice装饰器
@Advice(logInterceptor)
@Service
class UserService {
  getUserInfo(id: string) {
    return { id, name: '用户' + id };
  }
  
  updateUser(id: string, data: any) {
    // 实现更新逻辑
    return { success: true };
  }
}
```

## 微前端支持

core包提供了对微前端架构的支持，通过命名空间和作用域配置，可以在微前端环境中实现隔离和共享：

```typescript
import { Service, Provide } from '@baldwinli/core';

// 在主应用中注册全局服务
@Service('globalConfig', { provideScope: 'main' })
class GlobalConfigService {
  // 全局配置服务
}

// 在子应用中注册局部服务
@Service('appConfig', { provideScope: 'self' })
class AppConfigService {
  // 应用特定配置
}

// 获取特定作用域的服务
const globalConfig = Provide(GlobalConfigService, { provideScope: 'main' });
```

## 最佳实践

1. **服务设计原则**：
   - 单一职责：每个服务只负责一个功能领域
   - 接口清晰：提供明确的API和返回类型
   - 依赖声明：通过装饰器明确声明依赖关系

2. **性能优化**：
   - 避免频繁创建Emitter实例
   - 合理使用缓存策略
   - 注意服务实例的生命周期管理

3. **错误处理**：
   - 使用Advice装饰器统一处理服务层错误
   - 确保缓存操作的异常处理
   - 适当记录服务调用日志

## 版本历史

- v1.0.9：当前版本
- 依赖包：radash、qs、decimal.js

## 兼容性

支持所有现代浏览器，IE需要额外的polyfill支持。在微前端环境中，需要确保各应用使用相同版本的core包以避免兼容性问题。

## 相关包

- **@baldwinli/vue-hooks**：基于core包构建的Vue 3专用Hook工具集，提供了丰富的响应式状态管理、组件交互优化功能。
  - 文档链接：[vue-hooks 包文档](../vue-hooks/vue-hooks-package-docs.md)