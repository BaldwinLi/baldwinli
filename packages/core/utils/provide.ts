import {
  type Constructable,
  type IProviderConfigure,
  ProvideScopeKeys,
  MICRO_FRONT_END_MAIN,
} from './util.schema';
import { Emitter } from './emitter';
import { isFunction } from 'radash';

/**
 * 单例代理符号，用于标记已代理的类
 */
const singletonProxySymbol = Symbol();

/**
 * 单例代理标识键
 */
const IS_SINGLETON_PROXY = 'IS_SINGLETON_PROXY';

/**
 * 全局Window接口扩展，添加全局属性支持
 */
declare global {
  interface Window {
    global?: any;
    mountedApp?: string;
  }
}

/**
 * 代理映射，存储已创建的单例代理
 */
const proxyMap: Map<Constructable<any>, Constructable<any>> = new Map<
  Constructable<any>,
  Constructable<any>
>();

/**
 * 服务创建事件发射器，当服务实例被创建时触发
 */
export const createdEmitter: Emitter<[Constructable<any>, any]> = new Emitter<void>(void 0 as any);

/**
 * 实名索引查找的类容器，方便自动装载注入
 * @description 存储类名到类构造函数的映射
 */
export const memberIdentificationContainer: Map<string, Constructable<any>> = new Map();

/**
 * IoC容器
 * @description 存储类构造函数到实例的映射，默认容器
 */
const container: Map<Constructable<any>, any> = new Map<Constructable<any>, any>();

/**
 * IoC容器字典
 * @description 按命名空间存储的IoC容器集合
 */
const containerDict: Record<string, Map<Constructable<any>, any>> = {};

/**
 * 清理实例中的未定义属性并建立懒加载getter
 * @param instance 要清理的实例对象
 */
export function clearDirty(instance: any): void {
  for (const key in instance) {
    if (
      typeof instance[key] === 'undefined' &&
      instance.hasOwnProperty(key) &&
      typeof instance.__proto__ !== 'undefined'
    ) {
      // 删除未定义的自有属性
      delete instance[key];
      
      // 如果在成员标识容器中有对应的类，则为原型添加懒加载getter
      if (memberIdentificationContainer.has(key)) {
        Object.defineProperty(instance.__proto__, key, {
          configurable: false,
          enumerable: false,
          get() {
            return new (memberIdentificationContainer.get(key) as Constructable<any>)();
          },
        });
      }
    }
  }
}

/**
 * 创建单例实例
 * @param serviceClass 服务类构造函数
 * @param namespace 命名空间，可选
 * @returns 创建的单例实例
 */
function createSingletonInstance<T>(serviceClass: Constructable<T>, namespace?: string): T {
  const singletonIns = singleton(serviceClass, namespace);
  return new singletonIns();
}

/**
 * 获取指定命名空间的IoC容器
 * @param namespace 命名空间，可选，不传则返回默认容器
 * @returns IoC容器Map对象
 */
export function getContainer(namespace?: string): Map<Constructable<any>, any> {
  let targetContainer;
  if (namespace) {
    // 如果指定了命名空间，获取或创建对应的容器
    targetContainer = containerDict[namespace];
    if (!targetContainer) {
      targetContainer = containerDict[namespace] = new Map<
        Constructable<any>,
        any
      >();
    }
  } else {
    // 未指定命名空间时返回默认容器
    targetContainer = container;
  }
  return targetContainer;
}

/**
 * 根据配置获取命名空间
 * @param config 提供者配置，默认为root作用域
 * @returns 命名空间字符串或undefined
 */
export function getNamespace(
  config: IProviderConfigure = {
    provideScope: ProvideScopeKeys.Root as 'root',
  },
): string | void {
  let namespace;
  switch (config.provideScope) {
    case ProvideScopeKeys.Self:
      // 自身作用域，使用挂载的应用名称
      namespace = window.mountedApp;
      break;
    case ProvideScopeKeys.Main:
      // 主应用作用域，使用预定义的主应用标识
      namespace = MICRO_FRONT_END_MAIN;
      break;
    default:
      // 默认使用配置中指定的命名空间
      if (config.namespace) {
        namespace = config.namespace;
      }
  }
  return namespace;
}
/**
 * IoC单例方法，将静态类转换为单例模式的代理实例
 * @param serviceClass 要转换为单例的服务类构造函数
 * @param namespace 命名空间，可选
 * @returns 代理后的构造函数，确保每次实例化都返回同一个实例
 */
export function singleton<T>(serviceClass: Constructable<T>, namespace?: string): Constructable<T> {
  // 检查是否已经是代理实例
  if ((serviceClass as any)[IS_SINGLETON_PROXY] === singletonProxySymbol) {
    return serviceClass;
  }
  
  // 获取目标容器
  const targetContainer = getContainer(namespace);
  
  // 查找是否已有对应的代理
  let proxy = proxyMap.get(serviceClass);
  if (!proxy) {
    // 创建新的代理实例
    proxy = new Proxy(serviceClass, {
      // 拦截构造函数调用
      construct(target, argArray, newTarget) {
        // 从容器中获取实例
        let ins: any = targetContainer.get(serviceClass);
        if (!ins) {
          // 不存在则创建新实例
          ins = Reflect.construct(target, argArray, newTarget);
          // 清理未定义属性并建立懒加载getter
          clearDirty(ins);
          // 存储到容器
          targetContainer.set(serviceClass, ins);
          // 触发服务创建事件
          createdEmitter.set([serviceClass, ins]);
          // 调用初始化方法（如果存在）
          isFunction(ins.onInit) && ins.onInit(namespace);
        }
        return ins;
      },
      // 拦截属性访问
      get: (target: any, name) => {
        // 特殊处理单例代理标识
        return name === IS_SINGLETON_PROXY ? singletonProxySymbol : target[name];
      },
    });
    
    // 确保原型链正确
    proxy.prototype.constructor = proxy;
    // 保存到代理映射中
    proxyMap.set(serviceClass, proxy);
  }
  
  return proxy;
}

/**
 * 从IoC容器中提供类的实例
 * @param serviceClass 要提供的服务类构造函数
 * @param config 提供者配置，默认为root作用域
 * @returns 服务的单例实例
 */
export function Provide<T>(
  serviceClass: Constructable<T>,
  config: IProviderConfigure = {
    provideScope: ProvideScopeKeys.Root as 'root',
  },
): T {
  return createSingletonInstance(serviceClass, getNamespace(config) as string);
}

/**
 * 服务创建回调函数数组
 */
const cbs: ((arg: Constructable<any>, ins: any) => void)[] = [];

/**
 * 监听IoC容器内实例创建事件
 * @description 当实例被创建并存储到容器内后触发回调
 * @param cb 触发时的回调函数，接收静态类和实例两个参数
 */
export function onCreatedService(cb: (arg: Constructable<any>, ins: any) => void): void {
  cbs.push(cb);
}

// 监听服务创建事件并触发所有注册的回调
createdEmitter.listen(([staticClass, ins]) => cbs.forEach((e) => e(staticClass, ins)));

/**
 * 服务接口定义
 */
export interface IService {
  /**
   * 初始化方法，在服务实例创建后调用
   * @param namespace 服务所在的命名空间，可选
   */
  onInit?: (namespace?: string) => void;
}
