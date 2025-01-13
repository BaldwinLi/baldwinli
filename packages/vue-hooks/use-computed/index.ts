import { type ComputedRef, computed } from 'vue';
import { hash } from '@probe/core';
/**
 * @description 通过方法获得该方法对应返回计算属性的方法, 使得在参数不变的情况下状态不变
 * @param fn
 * @returns ComputedRef
 */
export function useComputed(fn: (...args: any[]) => any): (...args: any[]) => ComputedRef {
  const map = new Map();
  return function (...args) {
    const key = hash(JSON.stringify(args));
    if (map.has(key)) {
      return map.get(key);
    }
    const result = computed(() => fn(...args));
    map.set(key, result);
    return result;
  };
}
