import { isFunction, isString } from 'radash';
import {
  ProvideScopeKeys,
  type Constructable,
  type IProviderConfigure,
} from '../utils/util.schema';
import { getNamespace, singleton, memberIdentificationContainer } from '../utils/provide';

function convertAndCreate(staticClass: Constructable<any>, namespace?: string): Constructable<any> {
  const singletonClass = singleton(staticClass, namespace);
  new singletonClass();
  return singletonClass;
}

/**
 * @description IoC单例Service修饰器, 用来修饰类(class)的声明, 当该类被引用时转为单例模式的代理实例并在IoC容器中创建该类的实例
 * @attention 若被该修饰器修饰的类被其他修饰器修饰, 若想达到IoC的理想能力必须最先被该修饰器修饰
 */
export function Service(
  name: string | Constructable<any>,
  arg?: IProviderConfigure | unknown,
): any {
  if (isFunction(name)) {
    return convertAndCreate(name);
  } else {
    return function (serviceClass: Constructable<any>) {
      arg = arg || {
        provideScope: ProvideScopeKeys.Root as 'root',
      };
      const singletonClass = convertAndCreate(
        serviceClass,
        getNamespace(arg as IProviderConfigure) as string,
      );
      if (name && isString(name)) {
        memberIdentificationContainer.set(name, singletonClass);
      }
      return singletonClass;
    };
  }
}
