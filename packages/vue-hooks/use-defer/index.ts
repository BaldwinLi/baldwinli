/**
 * useDefer Hook
 * @description 优化浏览器绘制性能，通过控制渲染次数来避免大量元素迭代渲染产生的卡顿问题
 * @param maxCount 最大控制迭代次数，默认前100次迭代
 * @returns 返回一个函数，该函数接收一个索引值，当索引值小于当前渲染计数时返回true
 * @example
 * ```vue
 * <template>
 *   <div v-for="(item, index) in 10000">
 *     <heavy-component :item="item" v-if="defer(index)" />
 *   </div>
 * </template>
 * <script setup>
 * import { useDefer } from '@baldwinli/vue-hooks';
 * 
 * // 使用默认配置（100次迭代）
 * const defer = useDefer();
 * 
 * // 或者自定义迭代次数
 * // const defer = useDefer(500);
 * </script>
 * ```
 */
export function useDefer(maxCount: number = 100): (num: number) => boolean {
  // 渲染计数，跟踪当前应该渲染到第几个元素
  const count = ref(0);
  
  // 存储requestAnimationFrame的ID，用于组件卸载时取消
  let reqId: number;
  
  /**
   * 更新帧函数，使用requestAnimationFrame确保在浏览器下一帧执行
   */
  function updateFrame(): void {
    // 增加渲染计数
    count.value++;
    
    // 当达到最大迭代次数时停止
    if (count.value >= maxCount) {
      return;
    }
    
    // 继续请求下一帧更新
    reqId = requestAnimationFrame(updateFrame);
  }
  
  // 立即开始渲染过程
  updateFrame();
  
  // 组件卸载时清理，防止内存泄漏
  onUnmounted(() => cancelAnimationFrame(reqId));
  
  // 返回判断函数，用于在模板中控制渲染
  return function (n: number): boolean {
    // 当索引小于等于当前渲染计数时渲染该元素
    return count.value >= n;
  };
}
