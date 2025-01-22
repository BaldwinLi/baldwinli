import { isPrimitive, isFunction } from 'radash';
import { defineEmits, watch, customRef, type Ref } from 'vue';
import { isProxy } from '@baldwinli/core';

type RefPrettify<T> = {
  [P in keyof T]: Ref<T[P]>;
};
export function useModelProps<PP extends Readonly<Dict<any>>>(
  props: PP,
  emit?: ReturnType<typeof defineEmits>,
): RefPrettify<PP> {
  const res = {} as RefPrettify<PP>;
  for (const key in props) {
    (res as any)[key] = useModelProp(props, key, emit);
  }
  return res;
}

export function useModelProp(
  props: Readonly<any>,
  name: string,
  emit?: ReturnType<typeof defineEmits>,
): Ref {
  return customRef((track, trigger) => {
    let _value = generateValue(props[name], name, { track, trigger }, emit);
    watch(
      () => props[name],
      (val) => {
        _value = generateValue(val, name, { track, trigger }, emit);
        trigger();
      },
    );
    return {
      get() {
        track();
        return _value;
      },
      set(val) {
        isFunction(emit) && emit(`update:${name}`, val);
        _value = generateValue(val, name, { track, trigger }, emit);
        trigger();
      },
    };
  });
}

function generateValue(
  val: any,
  propsName: string,
  debuggerOption: {
    track: () => void;
    trigger: () => void;
  },
  emit?: ReturnType<typeof defineEmits>,
): void {
  let value: any = val;
  if (!isPrimitive(val) && !isProxy(val)) {
    value = convertProxy(void 0, val, propsName, debuggerOption, emit);
  }
  return value;
}

function convertProxy<T extends object>(
  origin: any,
  ins: T,
  propsName: string,
  debuggerOption: {
    track: () => void;
    trigger: () => void;
  },
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
      target[name] = convertProxy(raw, val, propsName, debuggerOption, emit);
    } else {
      target[name] = val;
    }
    isFunction(emit) && emit(`update:${propsName}`, raw);
    isFunction(debuggerOption?.trigger) && debuggerOption?.trigger();
    return true;
  }
  function getter(target: any, name: string): void {
    isFunction(debuggerOption?.track) && debuggerOption?.track();
    if (!isPrimitive(target[name]) && !isProxy(target[name])) {
      return convertProxy(raw, target[name], propsName, debuggerOption, emit);
    } else {
      return target[name];
    }
  }
}
