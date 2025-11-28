/**
 * Service装饰器模块
 * 提供IoC单例服务注册和实例化功能
 */
import { isFunction, isString } from 'radash';
import {
  ProvideScopeKeys,
  type Constructable,
  type IProviderConfigure,
} from '../utils/util.schema';
import { getNamespace, singleton, memberIdentificationContainer } from '../utils/provide';

/**
 * 将静态类转换为单例类并立即创建实例
 * @param staticClass 要转换的静态类
 * @param namespace 命名空间，可选
 * @returns 转换后的单例类
 */
function convertAndCreate(staticClass: Constructable<any>, namespace?: string): Constructable<any> {
  // 将类转换为单例代理
  const singletonClass = singleton(staticClass, namespace);
  // 立即创建实例并存储到IoC容器
  new singletonClass();
  return singletonClass;
}

/**
 * IoC单例Service装饰器
 * @description 用于将类转换为单例模式，并在IoC容器中注册和创建实例
 * @param name 服务名称字符串或直接传入类构造函数
 * @param arg 提供者配置选项，包含provideScope和namespace
 * @returns 装饰器函数或转换后的单例类
 * @attention 若被该装饰器修饰的类同时被其他装饰器修饰，为了保证IoC功能正常，Service装饰器必须最先应用
 * @example
 * // 基本用法
 * @Service
 * class MyService {
 *   // 服务实现
 * }
 * 
 * // 带名称和配置的用法
 * @Service('myService', { provideScope: 'root' })
 * class MyNamedService {
 *   // 服务实现
 * }
 */
export function Service(
  name: string | Constructable<any>,
  arg?: IProviderConfigure | unknown,
): any {
  // 直接传入类的情况
  if (isFunction(name)) {
    return convertAndCreate(name);
  } else {
    // 传入名称和配置的情况，返回装饰器函数
    return function (serviceClass: Constructable<any>) {
      // 设置默认配置
      arg = arg || {
        provideScope: ProvideScopeKeys.Root as 'root',
      };
      
      // 转换为单例并创建实例
      const singletonClass = convertAndCreate(
        serviceClass,
        getNamespace(arg as IProviderConfigure) as string,
      );
      
      // 如果提供了名称，则注册到成员标识容器
      if (name && isString(name)) {
        memberIdentificationContainer.set(name, singletonClass);
      }
      
      return singletonClass;
    };
  }
}
