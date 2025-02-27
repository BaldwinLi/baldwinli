import { isPrimitive } from 'radash';
import { getContainer } from '../utils/provide';
import { CacheService } from '../services/cache-service';
import { onCreatedService } from '../utils/provide';
import { hash, isProxy, isVoid } from '../utils/utils';

const cache = new CacheService();
/**
 * @description 类的属性修饰器, 使其状态会存储到CacheService中(即状态不会随着浏览器刷新而丢失, 状态生命周期与CacheService相同)
 * @attention 被该修饰器修饰的成员所在的类必须被Service修饰器修饰, 并且能够在相应命名空间的IoC容器中找到当前类的实例, 否则无法确定该成员在运行时的唯一性以至于无法持久化存储
 * @params namespace: IoC容器的命名空间, 参考Service修饰器参数
 */
export function Store<T>(
  namespace: Dict<any> | string,
  name?: string,
): void | ((target: Dict<any>, propName: string) => void) | any {
  function modifyProp(target: Dict<any>, propName: string, _namespace?: string): void {
    const staticClass = target.constructor;
    onCreatedService((_staticClass) => {
      if (_staticClass === staticClass) {
        const container = getContainer(_namespace as string);
        const instance = container.get(staticClass as any) as any;
        if (instance) {
          const identifier = hash(
            propName +
              (_namespace ?? '') +
              Object.getOwnPropertyNames(target).reduce((p, n) => p + n, '') +
              Object.getOwnPropertyNames(instance).reduce((p, n) => p + n, ''),
          );
          let value: any = generateValue(cache.get(identifier) ?? instance[propName], identifier);
          Object.defineProperty(instance, propName, {
            configurable: true,
            enumerable: true,
            set(val: T) {
              value = generateValue(val, identifier);
            },
            get() {
              return value;
            },
          });
        } else {
          throw new Error(
            'The class in which a member is decorated by Store decorator is not decorated by the Service decorator so that cannot establish the uniqueness of the member',
          );
        }
      }
    });
  }
  if (name && !isPrimitive(namespace)) {
    modifyProp(namespace as Dict<any>, name);
  } else {
    return function (target: Dict<any>, propName: string) {
      modifyProp(target, propName, namespace as string);
    };
  }
}

function generateValue(val: any, identifier: string): void {
  let value: any = val;
  if (!isPrimitive(val)) {
    value = convertProxy(void 0, val as any, identifier);
  }
  if (isVoid(val)) {
    cache.remove(identifier);
  } else {
    cache.set(identifier, val);
  }
  return value;
}

function convertProxy<T extends object>(origin: any, ins: T, identifier: string): T {
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
    if (!isPrimitive(val) && Object.prototype.hasOwnProperty.call(target, name)) {
      target[name] = convertProxy(raw, val, identifier);
    } else {
      target[name] = val;
    }
    cache.set(identifier, raw);
    return true;
  }
  function getter(target: any, name: string): void {
    if (
      !isPrimitive(target[name]) &&
      !isProxy(target[name]) &&
      Object.prototype.hasOwnProperty.call(target, name)
    ) {
      return convertProxy(raw, target[name], identifier);
    } else {
      return target[name];
    }
  }
}
