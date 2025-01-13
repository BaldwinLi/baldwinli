import { ref } from "vue";

/**
 * @param 声明组件在页面生的ref具类化
 */
export function useCompRef<T extends abstract new (...args: any) => any>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _comp: T,
) {
  return ref<InstanceType<T> | any>();
}
