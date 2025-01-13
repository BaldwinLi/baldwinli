import {
  type Constructable,
  type IProviderConfigure,
  ProvideScopeKeys,
  MICRO_FRONT_END_MAIN,
} from './util.schema';
import { Emitter } from './emitter';
import { isFunction } from 'radash';

const singletonProxySymbol = Symbol();
const IS_SINGLETON_PROXY = 'IS_SINGLETON_PROXY';
declare global {
  interface Window {
    global?: any;
    mountedApp?: string;
  }
}

const proxyMap: Map<Constructable<any>, Constructable<any>> = new Map<
  Constructable<any>,
  Constructable<any>
>();

export const createdEmitter: Emitter<[Constructable<any>, any]> = new Emitter(void 0 as any);

/**
 * @description 实名索引查找的类容器, 方便自动装载注入
 */
export const memberIdentificationContainer: Map<string, Constructable<any>> = new Map();
/**
 * @description IoC容器
 */
const container: Map<Constructable<any>, any> = new Map<Constructable<any>, any>();

/**
 * @description  IoC容器字典, key为容器的namespace
 */
const containerDict: Dict<Map<Constructable<any>, any>> = {};

export function clearDirty(instance: any): void {
  for (const key in instance) {
    if (
      typeof instance[key] === 'undefined' &&
      instance.hasOwnProperty(key) &&
      typeof instance.__proto__ !== 'undefined'
    ) {
      delete instance[key];
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

function createSingletonInstance<T>(serviceClass: Constructable<T>, namespace?: string): T {
  const singletonIns = singleton(serviceClass, namespace);
  return new singletonIns();
}

export function getContainer(namespace?: string): Map<Constructable<any>, Constructable<any>> {
  let targetContainer;
  if (namespace) {
    targetContainer = containerDict[namespace];
    if (!targetContainer) {
      targetContainer = containerDict[namespace] = new Map<
        Constructable<any>,
        new (...args: any) => any
      >();
    }
  } else {
    targetContainer = container;
  }
  return targetContainer;
}

export function getNamespace(
  config: IProviderConfigure = {
    provideScope: ProvideScopeKeys.Root as 'root',
  },
): string | void {
  let namespace;
  switch (config.provideScope) {
    case ProvideScopeKeys.Self:
      namespace = window.mountedApp;
      break;
    case ProvideScopeKeys.Main:
      namespace = MICRO_FRONT_END_MAIN;
      break;
    default:
      if (config.namespace) {
        namespace = config.namespace;
      }
  }
  return namespace;
}
/**
 * @description IoC单例方法, 将静态类转换为单例模式的代理实例
 */
export function singleton<T>(serviceClass: Constructable<T>, namespace?: string): Constructable<T> {
  if ((serviceClass as any)[IS_SINGLETON_PROXY] === singletonProxySymbol) {
    return serviceClass;
  }
  const targetContainer = getContainer(namespace);
  let proxy = proxyMap.get(serviceClass);
  if (!proxy) {
    proxy = new Proxy(serviceClass, {
      construct(target, argArray, newTarget) {
        let ins: any = targetContainer.get(serviceClass);
        if (!ins) {
          ins = Reflect.construct(target, argArray, newTarget);
          clearDirty(ins);
          targetContainer.set(serviceClass, ins);
          createdEmitter.set([serviceClass, ins]);
          isFunction(ins.onInit) && ins.onInit(namespace);
        }
        return ins;
      },
      get: (target: any, name) => {
        return name === IS_SINGLETON_PROXY ? singletonProxySymbol : target[name];
      },
    });
    proxy.prototype.constructor = proxy;
    proxyMap.set(serviceClass, proxy);
  }
  return proxy;
}

/**
 * @description 从IoC容器中提供类的实例
 */
export function Provide<T>(
  serviceClass: Constructable<T>,
  config: IProviderConfigure = {
    provideScope: ProvideScopeKeys.Root as 'root',
  },
): T {
  return createSingletonInstance(serviceClass, getNamespace(config) as string);
}

const cbs: ((arg: Constructable<any>, ins: any) => void)[] = [];

/**
 * @description 监听IoC容器内实例一层存储时的事件, 当实例被创建并存储到容器内后触发
 * @param cb 触发时的回调函数
 */
export function onCreatedService(cb: (arg: Constructable<any>, ins: any) => void): void {
  cbs.push(cb);
}

createdEmitter.listen(([staticClass, ins]) => cbs.forEach((e) => e(staticClass, ins)));

export interface IService {
  onInit?: (namespace?: string) => void;
}
