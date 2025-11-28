/**
 * Autowired装饰器模块
 * 提供自动依赖注入功能
 */
import { isString } from 'radash';
import type { Description, IProviderConfigure, Constructable } from '../utils/util.schema';
import { memberIdentificationContainer } from '../utils/provide';

/**
 * 定义目标对象的属性，实现自动依赖注入
 * @param obj 目标对象
 * @param prop 属性名称
 * @param description 属性描述符，可选
 */
function defineTarget(obj: any, prop: string, description?: Description): void {
  // 获取成员标识容器中的所有键
  const insArr = memberIdentificationContainer.keys();
  let ins,
    iteratorRes = insArr.next();
  
  // 遍历查找匹配的服务名称
  while (!iteratorRes.done) {
    if (iteratorRes.value === prop) {
      // 创建对应的服务实例
      ins = new (memberIdentificationContainer.get(iteratorRes.value) as Constructable<any>)();
      break;
    } else {
      iteratorRes = insArr.next();
    }
  }
  
  if (ins) {
    // 定义只读的getter属性
    const option = {
      configurable: false,
      enumerable: false,
      get() {
        return ins;
      },
    };
    
    // 为对象和描述符定义属性
    Object.defineProperty(obj, prop, option);
    description && Object.defineProperty(description, 'initializer', option);
  } else {
    // 未找到对应的服务时抛出错误
    throw new Error(
      `${prop} has not been declared, please confirm member property name(${prop}) is correct, if it is, please
                use "Service" decorator to declare ${prop}`,
    );
  }
}

/**
 * IoC自动依赖注入装饰器
 * @description 自动从IoC容器中获取并注入已注册的服务实例
 * @param target 目标类或配置对象
 * @param name 属性名称
 * @param description 属性描述符
 * @returns 装饰器函数或直接执行注入
 * @attention 被修饰的成员属性名称必须与使用@Service注册的服务名称一致
 * @example
 * // 基本用法
 * class UserController {
 *   @Autowired
 *   userService: UserService;
 *   
 *   getUserInfo() {
 *     return this.userService.getUserInfo();
 *   }
 * }
 */
export function Autowired(
  target: any | IProviderConfigure,
  name?: string,
  description?: Description,
): any {
  // 判断是否使用了配置参数形式
  const hasArg = !name || !isString(name);
  
  if (hasArg) {
    // 返回装饰器函数，用于属性装饰器形式
    return function (obj: any, prop: string, description?: Description) {
      defineTarget(obj, prop, description);
    };
  } else {
    // 直接执行注入，用于参数形式
    defineTarget(target, name, description);
  }
}
