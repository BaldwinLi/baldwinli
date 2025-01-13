import type { InterceptorOption } from '../utils/use-advice';
import type { Constructable } from '../utils/util.schema';
import { useAdvice } from '../utils/use-advice';

/**
 * @description AOP拦截建议修饰器, 将类在运行时实例化的时候转化为AOP执行建议拦截代理对象, 用于实现在不修改源代码的情况下给程序动态统一添加额外功能, 应用主要体现在事务处理、日志管理、权限控制、异常处理等方面
 * @attention 为了兼容拦截的异步情况, 被拦截的方法会强行返回Promise实例
 */
export function Advice(
  interceptorOption: InterceptorOption<any>, // 建议拦截器选项
  targetFunctions?: ((...args: unknown[]) => unknown)[], // 建议拦截的方法清单, 默认全部拦截(除Object实例的方法)
) {
  return function (staticClass: Constructable<any>) {
    return new Proxy(staticClass, {
      construct(target, argArray, newTarget) {
        return useAdvice(
          Reflect.construct(target, argArray, newTarget),
          interceptorOption,
          targetFunctions,
        );
      },
    });
  };
}
