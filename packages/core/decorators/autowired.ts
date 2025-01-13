import { isString } from 'radash';
import type { Description, IProviderConfigure, Constructable } from '../utils/util.schema';
import { memberIdentificationContainer } from '../utils/provide';

function defineTarget(obj: any, prop: string, description?: Description): void {
  const insArr = memberIdentificationContainer.keys();
  let ins,
    iteratorRes = insArr.next();
  while (!iteratorRes.done) {
    if (iteratorRes.value === prop) {
      ins = new (memberIdentificationContainer.get(iteratorRes.value) as Constructable<any>)();
      break;
    } else {
      iteratorRes = insArr.next();
    }
  }
  if (ins) {
    const option = {
      configurable: false,
      enumerable: false,
      get() {
        return ins;
      },
    };
    Object.defineProperty(obj, prop, option);
    description && Object.defineProperty(description, 'initializer', option);
  } else {
    throw new Error(
      `${prop} has not been declare, please confirm memeber property name(${prop}) is correct, if it is, please
                use "Service" decorator to declare ${prop}`,
    );
  }
}

/**
 * @description IoC自动注入修饰器, 可实现自动注入IoC容器中的实例
 * @attention 被修饰的成员属性名称必须以类全名的驼峰形式命名, 注入的实例所对应的静态类必须被Service修饰器修饰
 */
export function Autowired(
  target: any | IProviderConfigure,
  name?: string,
  description?: Description,
): any {
  const hasArg = !name || !isString(name);
  if (hasArg) {
    return function (obj: any, prop: string, description?: Description) {
      defineTarget(obj, prop, description);
    };
  } else {
    defineTarget(target, name, description);
  }
}
