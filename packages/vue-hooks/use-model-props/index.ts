import { isPrimitive, isFunction } from 'radash';
import { computed, defineEmits, type WritableComputedRef } from 'vue';
import { isProxy } from '@baldwinli/core';

type ComputedPrettify<T> = {
  [P in keyof T]: WritableComputedRef<T[P]>;
};
export function useModelProps<PP extends Readonly<Dict<any>>>(
  props: PP,
  emit?: ReturnType<typeof defineEmits>,
): ComputedPrettify<PP> {
  const res = {} as ComputedPrettify<PP>;
  for (const key in props) {
    (res as any)[key] = useModelProp(props, key, emit);
  }
  return res;
}

export function useModelProp(
  props: Readonly<any>,
  name: string,
  emit?: ReturnType<typeof defineEmits>,
): ReturnType<typeof computed> {
  let _value = generateValue(props[name], name, emit);
  return computed({
    get() {
      return _value;
    },
    set(val) {
      isFunction(emit) && emit(`update:${name}`, val);
      _value = generateValue(val, name, emit);
    },
  });
}

function generateValue(val: any, propsName: string, emit?: ReturnType<typeof defineEmits>): void {
  let value: any = val;
  if (!isPrimitive(val) && !isProxy(val)) {
    value = convertProxy(void 0, val, propsName, emit);
  }
  return value;
}

function convertProxy<T extends object>(
  origin: any,
  ins: T,
  propsName: string,
  emit?: ReturnType<typeof defineEmits>,
): T {
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
    if (!isPrimitive(val)) {
      target[name] = convertProxy(raw, val, propsName, emit);
    } else {
      target[name] = val;
    }
    isFunction(emit) && emit(`update:${propsName}`, raw);
    return true;
  }
  function getter(target: any, name: string): void {
    if (!isPrimitive(target[name]) && !isProxy(target[name])) {
      return convertProxy(raw, target[name], propsName, emit);
    } else {
      return target[name];
    }
  }
}
