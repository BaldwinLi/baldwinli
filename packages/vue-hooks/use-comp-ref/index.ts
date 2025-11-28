/**
 * useCompRef Hook
 * @description 创建一个类型化的组件引用，提供更好的TypeScript类型推断和IDE智能提示
 * @template T 组件构造函数类型
 * @param _comp 组件构造函数，用于类型推导，运行时不实际使用
 * @returns 返回一个类型为组件实例的ref对象，可以直接在模板的ref属性中使用
 * @example
 * ```vue
 * <template>
 *   <MyComponent ref="componentRef" />
 * </template>
 * <script setup lang="ts">
 * import { useCompRef } from '@baldwinli/vue-hooks';
 * import MyComponent from './MyComponent.vue';
 * 
 * // 创建类型化的组件引用
 * const componentRef = useCompRef(MyComponent);
 * 
 * // 现在可以访问组件实例的方法和属性，并且有完整的类型支持
 * function callComponentMethod() {
 *   if (componentRef.value) {
 *     componentRef.value.someMethod();
 *   }
 * }
 * </script>
 * ```
 */
export function useCompRef<T extends abstract new (...args: any) => any>(
  // 组件构造函数参数，仅用于类型推导
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _comp: T,
) {
  // 返回一个类型为组件实例的ref对象，提供完整的TypeScript类型支持
  return ref<InstanceType<T> | any>();
}
