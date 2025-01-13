import { isFunction } from 'radash';

/**
 * @description 建议拦截器选项
 */
export interface InterceptorOption<T> {
  // 通知方法在目标方法调用之前执行, 返回true之后目标方法才会执行
  before?: (methodName: string, thisArg?: T, args?: unknown[]) => boolean | Promise<boolean>;
  // 通知方法在目标方法调用之后执行
  after?: (
    methodName: string,
    thisArg?: T,
    result?: unknown,
    args?: unknown[],
  ) => void | Promise<void>;
  // 通知方法在目标方法抛出异常后执行
  throwing?: (
    methodName: string,
    thisArg?: T,
    err?: Error,
    args?: unknown[],
  ) => void | Promise<void>;
  // 通知方法会将目标方法封装起来, 必须返回目标方法执行后的返回结果
  around?: (
    methodName: string,
    thisArg?: T,
    args?: unknown[],
    targetMethod?: (...args: unknown[]) => unknown,
  ) => unknown | Promise<unknown>;
}
/**
 * @description 将对象转化为AOP执行建议拦截代理对象, 用于实现在不修改源代码的情况下给程序动态统一添加额外功能, 应用主要体现在事务处理、日志管理、权限控制、异常处理等方面
 * @attention 为了兼容拦截的异步情况, 被拦截的方法会强行返回Promise实例
 */
export function useAdvice<T extends object>(
  target: T, // 目标对象实例
  interceptorOption: InterceptorOption<T>, // 建议拦截器选项
  targetFunctions?: ((...args: unknown[]) => unknown)[], // 建议拦截的方法清单, 默认全部拦截(除Object实例的方法)
): T {
  return new Proxy(target, {
    get: (obj: { [key: string]: any } & T, name: string) => {
      if (isFunction(obj[name]) && !Object.getOwnPropertyNames(Object.prototype).includes(name)) {
        return new Proxy(obj[name], {
          apply: async (
            targetMethod: (...args: unknown[]) => unknown | Promise<unknown>,
            thisArg,
            argumentsList,
          ) => {
            if (
              (!targetFunctions ||
                targetFunctions.length === 0 ||
                targetFunctions.includes(targetMethod)) &&
              (!isFunction(interceptorOption.before) ||
                (await interceptorOption.before(name, obj, argumentsList)))
            ) {
              let result;
              try {
                if (isFunction(interceptorOption.around)) {
                  result = await interceptorOption.around(name, obj, argumentsList, targetMethod);
                } else {
                  result = await targetMethod.apply(thisArg, argumentsList);
                }
                isFunction(interceptorOption.after) &&
                  (await interceptorOption.after(name, obj, result, argumentsList));
              } catch (e: Error | any) {
                isFunction(interceptorOption.throwing) &&
                  (await interceptorOption.throwing(name, obj, e, argumentsList));
              }
              return result;
            }
          },
        });
      } else {
        return obj[name];
      }
    },
  });
}
