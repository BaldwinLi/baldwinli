/**
 * state-ref 模块
 * @description 提供基于Vue的响应式状态管理Hook，支持同步和异步状态处理
 * 包含普通响应式引用和异步操作响应式状态管理
 */
import { type EmitterOption, Emitter, isProxy } from '@baldwinli/core';
import { isFunction, isPrimitive } from 'radash';
import { customRef, type Ref } from 'vue';

/**
 * 转换对象为可响应的Proxy代理
 * @description 创建一个可响应的Proxy代理对象，确保嵌套对象的响应性和状态同步
 * @template T 代理对象的类型
 * @param origin 原始对象，用于引用跟踪
 * @param ins 需要被代理的对象实例
 * @param emitter 用于状态管理的Emitter实例
 * @param track Vue的依赖收集函数
 * @param trigger Vue的依赖触发函数
 * @returns 返回代理后的响应式对象
 */
function convertProxy<T extends object>(
  origin: any,
  ins: T,
  emitter: Emitter<T>,
  track: () => void,
  trigger: () => void,
): T {
  let raw: any;
  if (!origin) {
    raw = new Proxy(ins as any, {
      set: setter,
      get: getter,
    });
    return raw;
  } else {
    raw = origin;
    return new Proxy(ins as any, {
      set: setter,
      get: getter,
    });
  }
  function setter(target: any, name: string, val: any): boolean {
    if (!isPrimitive(val) && target.hasOwnProperty(name)) {
      target[name] = convertProxy(raw, val, emitter as any, track, trigger);
    } else {
      target[name] = val;
    }
    emitter.set(origin);
    return true;
  }
  function getter(target: any, name: string): void {
    track();

    if (!isPrimitive(target[name]) && !isProxy(target[name]) && target.hasOwnProperty(name)) {
      return convertProxy(raw, target[name], emitter, track, trigger);
    } else {
      return target[name];
    }
  }
}

/**
 * 创建一个简单的状态引用Hook
 * @description 内部使用的Hook，用于创建可手动更新的响应式引用
 * @template T 状态值的类型
 * @param initVal 初始状态值
 * @returns 返回一个元组，包含响应式引用和更新函数
 */
function useStateRef<T>(initVal: T): [Ref<T>, (val: T) => void] {
  let value = initVal;
  let _tragger: () => void;
  function setter(val: T): void {
    value = val;
    _tragger();
  }
  const resRef = customRef((track, trigger) => {
    _tragger = trigger;
    return {
      set: () => void 0,
      get() {
        track();
        return value;
      },
    };
  });
  return [resRef, setter];
}

/**
 * 异步操作选项类型
 * @template T 状态值类型
 * @template A 异步创建函数的参数类型数组
 * @extends EmitterOption 继承自Emitter的选项
 * @property initVal 初始状态值
 * @property creatorArgs 传递给异步创建函数的参数
 */
export type AsyncOption<T, A extends unknown[]> = EmitterOption<T> & {
  initVal?: T;
  creatorArgs?: A;
};

/**
 * 异步创建函数类型
 * @template T 返回的Promise类型
 * @template A 函数参数类型数组
 * @returns 返回Promise对象
 */
export type AsyncCreator<T, A extends unknown[]> = (...arg: A) => Promise<T>;

/**
 * 异步引用基础类型
 * @template T 引用值类型
 * @template A 执行函数参数类型数组
 */
type AsyncRef<T, A extends unknown[]> = [
  ref: Ref<T>,         // 响应式引用
  execute: AsyncCreator<T, A>,  // 执行函数
  isAwaiting: Ref<boolean>,     // 等待状态标志
];

/**
 * 归约回调函数类型
 * @template T 输入数据类型
 * @template R 归约结果类型
 * @param previous 上一次归约的结果
 * @param next 当前输入值
 * @returns 返回新的归约结果
 */
export type ReduceCallBack<T, R> = (previous: R, next: T) => R;

/**
 * 自动异步引用类型
 * @template T 引用值类型
 * @template A 执行函数参数类型数组
 */
export type AsyncAutoRef<T, A extends unknown[]> = [
  ...AsyncRef<T, A>,
  onResolved: (cb: (val: T) => void) => void,  // 解析完成回调注册函数
];

/**
 * 可归约的异步引用类型
 * @template T 输入数据类型
 * @template R 归约后结果类型
 * @template A 执行函数参数类型数组
 */
export type AsyncReducableRef<T, R, A extends unknown[]> = [
  ...AsyncRef<R, A>,
  reduce: (cb: ReduceCallBack<T, R>) => void,  // 归约函数设置
  reset: () => void,  // 重置函数
];
/**
 * 创建一个可写入的响应式引用
 * @description 基于Vue的customRef和Emitter实现的可写入响应式引用，支持深度响应式和状态管理
 * @template T 引用值类型
 * @param value 初始值
 * @param option 配置选项，继承自EmitterOption
 * @returns 返回Vue的Ref对象，支持get和set操作
 * @example
 * ```typescript
 * import { writableRef } from '@baldwinli/vue-hooks';
 * 
 * // 创建基本类型的可写入引用
 * const count = writableRef(0);
 * count.value = 10; // 触发响应式更新
 * 
 * // 创建对象类型的可写入引用
 * const user = writableRef({ name: 'John', age: 30 });
 * user.value.name = 'Jane'; // 嵌套属性更新也会触发响应式更新
 * ```
 */
export function writableRef<T>(value: T, option?: EmitterOption<T>): Ref<T> {
  const emitter = new Emitter<T>(void 0 as any, option);
  let _track: () => void, _trigger: () => void;
  function set(val: T): void {
    if (isPrimitive(val)) {
      emitter.set(val);
    } else {
      emitter.set(convertProxy(void 0, val as any, emitter as Emitter<any>, _track, _trigger));
    }
  }
  return customRef((track, trigger) => {
    emitter.listen(trigger);
    _track = track;
    _trigger = trigger;
    set(value);
    return {
      set,
      get() {
        track();
        return emitter.get();
      },
    };
  });
}

/**
 * 创建一个只读的响应式引用
 * @description 基于Vue的customRef和Emitter实现的只读响应式引用，类似于Vue的readable
 * @template T 引用值类型
 * @param value 初始值
 * @param option 配置选项，包含start函数用于设置初始值更新逻辑
 * @param option.start 启动函数，接收一个更新回调函数作为参数
 * @returns 返回Vue的Ref对象，仅支持get操作，set操作会被忽略
 * @example
 * ```typescript
 * import { readableRef } from '@baldwinli/vue-hooks';
 * 
 * // 创建一个每秒更新的时间只读引用
 * const time = readableRef(new Date(), {
 *   start: (update) => {
 *     const timer = setInterval(() => {
 *       update(new Date());
 *     }, 1000);
 *     // 可以在start中返回清理函数
 *     return () => clearInterval(timer);
 *   }
 * });
 * 
 * // 可以读取值，但设置值会被忽略
 * console.log(time.value); // 显示当前时间
 * time.value = new Date(2000); // 无效操作，不会改变值
 * ```
 */
export function readableRef<T>(
  value: T,
  option: EmitterOption<T> & { start: (cb: (value: T) => void) => void },
): Ref<T> {
  const emitter = new Emitter<T>(value, option);
  return customRef((track, trigger) => {
    emitter.listen(trigger);
    return {
      set: () => void 0,
      get() {
        track();
        return emitter.get();
      },
    };
  });
}

/**
 * 创建一个可写入的异步响应式引用
 * @description 管理异步操作状态的可写入响应式引用，支持自动执行异步函数并更新状态
 * @template T 异步操作返回值类型
 * @template A 异步函数参数类型数组
 * @param asyncCreator 创建Promise实例的函数，必须传入函数而非Promise实例
 * @param option 配置选项
 * @param option.initVal 初始值
 * @param option.creatorArgs 传递给异步创建函数的初始参数
 * @returns 返回AsyncAutoRef类型的元组，包含：
 * - 响应式引用（Ref<T>）
 * - 执行函数（(...args: A) => Promise<T>）
 * - 等待状态标志（Ref<boolean>）
 * - 完成回调注册函数（(cb: (val: T) => void) => void）
 * @example
 * ```typescript
 * import { asyncWritableRef } from '@baldwinli/vue-hooks';
 * 
 * // 创建异步可写入引用
 * const [user, fetchUser, isLoading, onUserLoaded] = asyncWritableRef(
 *   (userId) => fetch(`/api/users/${userId}`).then(res => res.json()),
 *   { initVal: null, creatorArgs: [1] }
 * );
 * 
 * // 监听数据加载完成
 * onUserLoaded((data) => {
 *   console.log('用户数据已加载:', data);
 * });
 * 
 * // 重新加载数据
 * async function refreshUser() {
 *   await fetchUser(2); // 加载ID为2的用户
 * }
 * ```
 */
export function asyncWritableRef<T, A extends unknown[]>(
  asyncCreator: AsyncCreator<T, A>,
  option?: AsyncOption<T, A>,
): AsyncAutoRef<T, A> {
  let emitter: Emitter<T>;
  let _cb: (val: T) => void;
  let _trigger: () => void;
  let _track: () => void;
  const [isAwaiting, setisAwaiting] = useStateRef(false);
  function onResolved(cb: (val: T) => void) {
    _cb = cb;
  }
  async function execute(...arg: A): Promise<T> {
    try {
      setisAwaiting(true);
      const ins = isFunction(asyncCreator) && asyncCreator(...arg);
      const instance = ((ins instanceof Promise && (await ins)) || ins) as T;
      if (isPrimitive(instance)) {
        emitter.set(instance);
      } else {
        emitter.set(
          convertProxy(void 0, instance as any, emitter as Emitter<any>, _track, _trigger) as any,
        );
      }
      isFunction(_cb) && _cb(emitter.get());
    } finally {
      setisAwaiting(false);
    }
    return emitter.get();
  }
  return [
    customRef((track, trigger) => {
      _trigger = trigger;
      _track = track;
      if (isPrimitive(option?.initVal)) {
        emitter = new Emitter<T>(option?.initVal as T, option);
      } else {
        emitter = new Emitter<T>(
          convertProxy(
            void 0,
            option?.initVal as any,
            emitter as Emitter<T & object>,
            track,
            trigger,
          ) as T,
          option,
        );
      }
      execute(...((option?.creatorArgs || []) as A));
      emitter.listen(trigger);
      return {
        set(val: T) {
          if (isPrimitive(val)) {
            emitter.set(val);
          } else {
            emitter.set(
              convertProxy(void 0, val as any, emitter as Emitter<T & object>, track, trigger),
            );
          }
        },
        get() {
          track();
          return emitter.get();
        },
      };
    }),
    execute,
    isAwaiting,
    onResolved,
  ];
}

/**
 * 创建一个只读的异步响应式引用
 * @description 管理异步操作状态的只读响应式引用，自动执行异步函数但不支持手动设置值
 * @template T 异步操作返回值类型
 * @template A 异步函数参数类型数组
 * @param asyncCreator 创建Promise实例的函数，必须传入函数而非Promise实例
 * @param option 配置选项
 * @param option.initVal 初始值
 * @param option.creatorArgs 传递给异步创建函数的初始参数
 * @returns 返回AsyncAutoRef类型的元组，包含：
 * - 只读响应式引用（Ref<T>）
 * - 执行函数（(...args: A) => Promise<T>）
 * - 等待状态标志（Ref<boolean>）
 * - 完成回调注册函数（(cb: (val: T) => void) => void）
 * @example
 * ```typescript
 * import { asyncReadableRef } from '@baldwinli/vue-hooks';
 * 
 * // 创建异步只读引用
 * const [config, reloadConfig, isLoading, onConfigLoaded] = asyncReadableRef(
 *   () => fetch('/api/config').then(res => res.json()),
 *   { initVal: {} }
 * );
 * 
 * // 监听配置加载完成
 * onConfigLoaded((cfg) => {
 *   console.log('配置已加载:', cfg);
 * });
 * 
 * // 手动重新加载配置
 * function refreshConfig() {
 *   reloadConfig();
 * }
 * ```
 */
export function asyncReadableRef<T, A extends unknown[]>(
  asyncCreator: AsyncCreator<T, A>,
  option?: AsyncOption<T, A>,
): AsyncAutoRef<T, A> {
  const [isAwaiting, setisAwaiting] = useStateRef(false);
  const emitter = new Emitter<T>(option?.initVal as T, option);
  let _cb: (val: T) => void;
  function onResolved(cb: (val: T) => void) {
    _cb = cb;
  }
  async function execute(...arg: A): Promise<T> {
    try {
      setisAwaiting(true);
      const ins = isFunction(asyncCreator) && asyncCreator(...arg);
      ins instanceof Promise && emitter.set(await ins);
      isFunction(_cb) && _cb(emitter.get());
    } finally {
      setisAwaiting(false);
    }
    return emitter.get();
  }
  return [
    customRef((track, trigger) => {
      execute(...((option?.creatorArgs || []) as A));
      emitter.listen(trigger);
      return {
        set: () => void 0,
        get() {
          track();
          return emitter.get();
        },
      };
    }),
    execute,
    isAwaiting,
    onResolved,
  ];
}

/**
 * 创建一个可归约的异步响应式引用
 * @description 支持归约操作的异步响应式引用，适用于需要累积或转换异步数据的场景
 * @template T 原始异步数据类型
 * @template R 归约后的结果类型
 * @template A 异步函数参数类型数组
 * @param asyncCreator 创建Promise实例的函数，必须传入函数而非Promise实例
 * @param option 配置选项
 * @param option.initVal 初始归约结果值
 * @param option.creatorArgs 传递给异步创建函数的初始参数
 * @returns 返回AsyncReducableRef类型的元组，包含：
 * - 只读响应式引用（Ref<R>）
 * - 执行函数（(...args: A) => Promise<R>）
 * - 等待状态标志（Ref<boolean>）
 * - 归约函数设置（(cb: ReduceCallBack<T, R>) => void）
 * - 重置函数（() => void）
 * @example
 * ```typescript
 * import { asyncReducableRef } from '@baldwinli/vue-hooks';
 * 
 * // 创建可归约的异步引用，用于累积用户列表
 * const [users, loadMoreUsers, isLoading, setReduce, resetUsers] = asyncReducableRef(
 *   (page) => fetch(`/api/users?page=${page}`).then(res => res.json()),
 *   { initVal: [] }
 * );
 * 
 * // 设置归约函数 - 合并新用户到现有列表
 * setReduce((previousUsers, newUsers) => [...previousUsers, ...newUsers]);
 * 
 * // 加载更多用户
 * async function fetchNextPage(page = 1) {
 *   await loadMoreUsers(page);
 * }
 * 
 * // 重置用户列表
 * function clearUsers() {
 *   resetUsers();
 * }
 * ```
 */
export function asyncReducableRef<T, R, A extends unknown[]>(
  asyncCreator: AsyncCreator<T, A>,
  option?: AsyncOption<R, A>,
): AsyncReducableRef<T, R, A> {
  const [isAwaiting, setisAwaiting] = useStateRef(false);
  const emitter = new Emitter<R>(option?.initVal as R, option);
  let _cb: ReduceCallBack<T, R>;
  let initialized = false;
  async function execute(...arg: A): Promise<R> {
    if (isFunction(_cb)) {
      try {
        setisAwaiting(true);
        const ins = isFunction(asyncCreator) && asyncCreator(...arg);
        ins instanceof Promise && emitter.set(_cb(emitter.get(), await ins));
      } finally {
        setisAwaiting(false);
      }
      return emitter.get();
    } else {
      throw new Error('Reduce must be initialized before execute.');
    }
  }
  function reduce(cb: ReduceCallBack<T, R>): void {
    if (isFunction(asyncCreator)) {
      _cb = cb;
      if (!initialized) {
        execute(...((option?.creatorArgs || []) as A));
        initialized = true;
      }
    }
  }
  function reset(): void {
    emitter.set(option?.initVal as R);
  }
  return [
    customRef((track, trigger) => {
      emitter.listen(trigger);
      return {
        set: () => void 0,
        get() {
          track();
          return emitter.get();
        },
      };
    }),
    execute,
    isAwaiting,
    reduce,
    reset,
  ];
}
