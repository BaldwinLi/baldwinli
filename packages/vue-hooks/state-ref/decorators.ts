/**
 * state-ref 装饰器模块
 * @description 提供用于状态管理的装饰器函数，简化异步状态在类中的使用
 * 包含可写异步引用、可读异步引用和可归约异步引用的装饰器实现
 */
import { isFunction, isObject, isString, isEqual, isPrimitive } from 'radash';
import { asyncWritableRef, asyncReadableRef, asyncReducableRef } from '.';
import type { AsyncAutoRef, AsyncReducableRef, AsyncOption } from '.';
import { customRef, nextTick } from 'vue';

/**
 * 原始异步目标函数类型
 * @template T 返回的Promise类型
 * @template A 函数参数类型数组
 */
type OriginTarget<T, A extends unknown[]> = (...arg: A) => Promise<T>;

/**
 * 存储类型，根据泛型参数推断具体的异步引用类型
 * @template T 原始数据类型
 * @template R 引用类型
 */
type Store<T, R> =
  R extends AsyncAutoRef<T, unknown[]>
    ? AsyncAutoRef<T, unknown[]>
    : R extends AsyncReducableRef<T, unknown, unknown[]>
      ? AsyncReducableRef<T, unknown, unknown[]>
      : never;

/**
 * 返回目标函数类型
 * @template T 原始数据类型
 * @template R 引用类型
 * @template A 函数参数类型数组
 */
type ReturnTarget<T, R, A extends unknown[]> = (...arg: A) => Store<T, R>;

/**
 * 目标实例类型
 * @template T 原始数据类型
 * @template S 存储类型
 * @template A 函数参数类型数组
 * @template R 返回目标类型
 */
type TargetInstType<T, S, A extends unknown[], R = ReturnTarget<T, S, A>> = Dict<
  OriginTarget<T, A> | R
>;

/**
 * 描述符函数类型
 * @template T 原始数据类型
 * @template R 引用类型
 * @template A 函数参数类型数组
 */
type Discriptor<T, R, A extends unknown[]> = (
  target: TargetInstType<T, R, A>,
  funcName: string,
) => ReturnTarget<T, R, A>;

/**
 * 字典类型定义
 */
type Dict<T> = Record<string, T>;

/**
 * 创建装饰器描述符函数
 * @description 创建一个通用的装饰器描述符，用于将异步函数转换为带有状态管理的函数
 * @template T 原始数据类型
 * @template S 存储类型
 * @template A 函数参数类型数组
 * @param asyncRef 异步引用创建函数（asyncReadableRef、asyncWritableRef或asyncReducableRef）
 * @param obj 配置选项或目标对象
 * @param name 方法名（当直接调用时使用）
 * @returns 返回装饰器函数或直接应用装饰器的结果
 */
function createDescriptor<T, S, A extends unknown[]>(
  asyncRef: typeof asyncReadableRef | typeof asyncWritableRef | typeof asyncReducableRef | any,
  obj?: AsyncOption<T, A> | TargetInstType<T, Store<T, S>, A> | any,
  name?: string,
): Discriptor<T, S, A> | ReturnTarget<T, S, A> | unknown {
  // 存储异步引用实例
  let store: Store<T, S>;
  
  /**
   * 获取目标函数（内部辅助函数）
   * @description 将原始异步函数转换为返回异步引用的函数
   */
  function getTargetFunc(
    target: TargetInstType<T, S, A>,
    funcName: string,
    option?: AsyncOption<T, A>,
  ): ReturnTarget<T, S, A> {
    // 获取原始异步函数
    const originFunc = target[funcName] as OriginTarget<T, A>;
    
    // 重写目标函数
    target[funcName] = function (...arg: A): Store<T, S> {
      // 首次调用时创建store
      if (!store) {
        store = asyncRef(originFunc.bind(target), {
          ...option,
          creatorArgs: arg,
        });
      } else {
        // 后续调用时重新执行异步函数
        store[1](...arg);
      }
      // 返回store实例
      return store;
    };
    
    return target[funcName] as ReturnTarget<T, S, A>;
  }
  
  // 判断是否为直接调用模式（传递了name参数）
  if (isString(name) && obj && isFunction(obj[name])) {
    // 直接应用装饰器到指定对象的方法
    return getTargetFunc(obj as TargetInstType<T, S, A>, name);
  } else {
    // 返回装饰器函数，用于类方法装饰
    return (target: TargetInstType<T, S, A>, funcName: string) =>
      getTargetFunc(target, funcName, obj as AsyncOption<T, A>);
  }
}
/**
 * AsyncWritableRefReturn 装饰器
 * @description 将类的异步方法转换为返回可写入异步引用的方法
 * @template T 异步操作返回值类型
 * @template A 函数参数类型数组
 * @param obj 配置选项或目标对象
 * @param name 方法名（当直接调用时使用）
 * @returns 返回装饰器函数或直接应用装饰器的结果
 * @example
 * ```typescript
 * import { AsyncWritableRefReturn } from '@baldwinli/vue-hooks';
 * 
 * class UserService {
 *   @AsyncWritableRefReturn({ initVal: null })
 *   async fetchUser(userId: number) {
 *     const response = await fetch(`/api/users/${userId}`);
 *     return response.json();
 *   }
 * }
 * 
 * const service = new UserService();
 * const [user, refreshUser, isLoading, onUserLoaded] = service.fetchUser(1);
 * ```
 */
export function AsyncWritableRefReturn<T, A extends unknown[]>(
  obj?: AsyncOption<T, A> | TargetInstType<T, AsyncAutoRef<T, A>, A> | any,
  name?: string,
): Discriptor<T, AsyncAutoRef<T, A>, A> | ReturnTarget<T, AsyncAutoRef<T, A>, A> | any {
  return createDescriptor(asyncWritableRef, obj, name);
}

/**
 * AsyncReadableRefReturn 装饰器
 * @description 将类的异步方法转换为返回只读异步引用的方法
 * @template T 异步操作返回值类型
 * @template A 函数参数类型数组
 * @param obj 配置选项或目标对象
 * @param name 方法名（当直接调用时使用）
 * @returns 返回装饰器函数或直接应用装饰器的结果
 * @example
 * ```typescript
 * import { AsyncReadableRefReturn } from '@baldwinli/vue-hooks';
 * 
 * class ConfigService {
 *   @AsyncReadableRefReturn({ initVal: {} })
 *   async fetchConfig() {
 *     const response = await fetch('/api/config');
 *     return response.json();
 *   }
 * }
 * 
 * const service = new ConfigService();
 * const [config, reloadConfig, isLoading, onConfigLoaded] = service.fetchConfig();
 * ```
 */
export function AsyncReadableRefReturn<T, A extends unknown[]>(
  obj?: AsyncOption<T, A> | TargetInstType<T, AsyncAutoRef<T, A>, A> | any,
  name?: string,
): Discriptor<T, AsyncAutoRef<T, A>, A> | ReturnTarget<T, AsyncAutoRef<T, A>, A> | any {
  return createDescriptor(asyncReadableRef, obj, name);
}

/**
 * AsyncReducableRefReturn 装饰器
 * @description 将类的异步方法转换为返回可归约异步引用的方法
 * @template T 原始异步数据类型
 * @template R 归约后的结果类型
 * @template A 函数参数类型数组
 * @param obj 配置选项或目标对象
 * @param name 方法名（当直接调用时使用）
 * @returns 返回装饰器函数或直接应用装饰器的结果
 * @example
 * ```typescript
 * import { AsyncReducableRefReturn } from '@baldwinli/vue-hooks';
 * 
 * class UserListService {
 *   @AsyncReducableRefReturn({ initVal: [] })
 *   async fetchUsers(page: number) {
 *     const response = await fetch(`/api/users?page=${page}`);
 *     return response.json();
 *   }
 * }
 * 
 * const service = new UserListService();
 * const [users, loadMore, isLoading, setReduce, reset] = service.fetchUsers(1);
 * setReduce((prev, next) => [...prev, ...next]);
 * ```
 */
export function AsyncReducableRefReturn<T, R, A extends unknown[]>(
  obj?:
    | (AsyncOption<R, A> & { initVal?: R })
    | TargetInstType<T, AsyncReducableRef<T, R, A>, A>
    | any,
  name?: string,
):
  | Discriptor<T, AsyncReducableRef<T, R, A>, A>
  | ReturnTarget<T, AsyncReducableRef<T, R, A>, A>
  | any {
  return createDescriptor(asyncReducableRef, obj, name);
}

/**
 * FieldRef 装饰器
 * @description 类的属性装饰器，将类属性转换为只读的响应式引用
 * @template T 属性值类型
 * @param defaultValue 默认值
 * @param name 属性名（当直接调用时使用）
 * @returns 返回装饰器函数或undefined
 * @example
 * ```typescript
 * import { FieldRef } from '@baldwinli/vue-hooks';
 * 
 * class User {
 *   @FieldRef('Unknown')
 *   name: string;
 *   
 *   @FieldRef(0)
 *   age: number;
 *   
 *   constructor(name?: string, age?: number) {
 *     if (name) this.name = name;
 *     if (age) this.age = age;
 *   }
 * }
 * 
 * const user = new User('John', 30);
 * // name和age现在是响应式的只读引用
 * console.log(user.name); // 'John'
 * // user.name = 'Jane'; // 无效，设置操作会被忽略
 * ```
 */
export function FieldRef<T>(
  defaultValue: Dict<any> | T,
  name?: string,
): void | ((target: Dict<any>, propName: string) => void) | any {
  /**
   * 修改属性为响应式引用（内部辅助函数）
   * @param target 目标对象
   * @param propName 属性名
   * @param defaultVal 默认值
   */
  function modifyProp(target: Dict<any>, propName: string, defaultVal?: T): void {
    // 存储属性值
    let value: T = defaultVal as T;
    // 存储Vue的trigger函数引用
    let _trigger: () => void;
    
    // 创建自定义引用
    const getRef = customRef((track, trigger) => {
      _trigger = trigger;
      return {
        set: () => void 0, // 只读，忽略设置操作
        get() {
          track(); // 触发依赖收集
          return value;
        },
      };
    });
    
    // 使用Object.defineProperty重新定义属性
    Object.defineProperty(target, propName, {
      configurable: true,
      enumerable: true,
      set(val: T) {
        // 内部更新值并触发响应式更新
        value = val;
        isFunction(_trigger) && _trigger();
      },
      get() {
        // 返回响应式引用
        return getRef;
      },
    });
  }
  
  // 如果提供了name参数并且defaultValue是对象或函数，直接修改指定对象的属性
  if (name && (isObject(defaultValue) || isFunction(defaultValue))) {
    modifyProp(defaultValue, name);
  } else {
    // 否则返回装饰器函数用于类属性装饰
    return function (target: Dict<any>, propName: string) {
      modifyProp(target, propName, defaultValue as T);
    };
  }
}
/**
 * @description 类的set或get方法修饰器, get属性只读, 使其改写为返回一个只读的Ref的方法, 该Ref会在原get方法返回值变化时触发变更
 * @attention !注意: 只能修饰声明过get方法的set或get方法, 可以是实例的get或set方法, 也可以是静态get或set方法
 */
export function AccessorRef<T>(
  target: Dict<any>,
  name: string,
  descriptor: TypedPropertyDescriptor<T>,
): void {
  if (isFunction(descriptor?.get)) {
    const originGet = descriptor.get as () => T;
    let ins: unknown;
    let value: T;
    const getRef = customRef((track, trigger) => {
      return {
        set: () => void 0,
        get() {
          if (ins) {
            const currentVal = originGet.call(ins);
            if ((isPrimitive(currentVal) && value !== currentVal) || !isEqual(value, currentVal)) {
              trigger();
              value = isPrimitive(currentVal) ? currentVal : JSON.parse(JSON.stringify(currentVal));
            }
            track();
            return currentVal;
          }
        },
      };
    });
    descriptor.get = new Proxy(
      function () {
        return getRef;
      },
      {
        apply(method, obj) {
          ins = obj;
          return method();
        },
      },
    ) as () => T;
    nextTick(() => {
      Object.defineProperty(target, name, descriptor);
      Object.defineProperty(descriptor, 'initializer', descriptor);
      setInterval(() => getRef.value, 100);
    });
  } else {
    throw new Error(
      `@AccessorRef decorator must decorate a property which must have a get-function in descriptor, "${target.constructor.name}.${name}" doesn't have its get-function in descriptor.`,
    );
  }
}
