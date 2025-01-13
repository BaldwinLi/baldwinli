import {
  type Constructable,
  type Description,
  type IProviderConfigure,
  ProvideScopeKeys,
} from '../utils/util.schema';
import { Provide } from '../utils/provide';

/**
 * @description 类成员属性修饰器, 当当前所在类实例化之后将参数类在IoC容器对应的实例注入到实例成员属性中
 */
export function Inject<T>(
  staticClass: Constructable<T>,
  config: IProviderConfigure = {
    provideScope: ProvideScopeKeys.Root as 'root',
  },
): (target: any, propertyName: string, description?: Description) => void {
  return (target: any, propertyName: string, description?: Description) => {
    const option = {
      configurable: false,
      enumerable: false,
      get() {
        return Provide(staticClass, config);
      },
    };
    Object.defineProperty(target, propertyName, option);
    description && Object.defineProperty(description, 'initializer', option);
  };
}
