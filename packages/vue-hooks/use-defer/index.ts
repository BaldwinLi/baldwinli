import { onUnmounted, ref } from "vue";

/**
 * @description 优化浏览器绘制性能, 避免大量元素迭代渲染产生的卡顿问题
 * @usage
 * <template>
 *      <div v-for="(item, index) in 10000">
 *         <hug-component :item="item" v-if="defer(index)" />
 *      </div>
 * </template>
 * <script setup>
 * const defer = useDefer();
 * </script>
 * @param 最大控制迭代次数, 默认前100次迭代
 */
export function useDefer(maxCount: number = 100): (num: number) => boolean {
  const count = ref(0);
  let reqId: number;
  function updateFrame(): void {
    count.value++;
    if (count.value >= maxCount) {
      return;
    }
    reqId = requestAnimationFrame(updateFrame);
  }
  updateFrame();
  onUnmounted(() => cancelAnimationFrame(reqId));
  return function (n: number): boolean {
    return count.value >= n;
  };
}
