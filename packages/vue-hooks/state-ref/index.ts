import { type EmitterOption, Emitter, isProxy } from '@probe/core';
import { isFunction, isPrimitive } from 'radash';
import { customRef, type Ref } from 'vue';

function convertProxy<T extends object>(
  origin: any,
  ins: T,
  emitter: Emitter<T>,
  track: () => void,
  trigger: () => void,
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
    if (!isPrimitive(val) && target.hasOwnProperty(name)) {
      target[name] = convertProxy(raw, val, emitter as any, track, trigger);
    } else {
      target[name] = val;
    }
    emitter.set(origin);
    return true;
  }
  function getter(target: any, name: string): void {
    track();

    if (!isPrimitive(target[name]) && !isProxy(target[name]) && target.hasOwnProperty(name)) {
      return convertProxy(raw, target[name], emitter, track, trigger);
    } else {
      return target[name];
    }
  }
}

function useStateRef<T>(initVal: T): [Ref<T>, (val: T) => void] {
  let value = initVal;
  let _tragger: () => void;
  function setter(val: T): void {
    value = val;
    _tragger();
  }
  const resRef = customRef((track, trigger) => {
    _tragger = trigger;
    return {
      set: () => void 0,
      get() {
        track();
        return value;
      },
    };
  });
  return [resRef, setter];
}

export type AsyncOption<T, A extends unknown[]> = EmitterOption<T> & {
  initVal?: T;
  creatorArgs?: A;
};
export type AsyncCreator<T, A extends unknown[]> = (...arg: A) => Promise<T>;
type AsyncRef<T, A extends unknown[]> = [
  ref: Ref<T>,
  execute: AsyncCreator<T, A>,
  isAwaiting: Ref<boolean>,
];
export type ReduceCallBack<T, R> = (previous: R, next: T) => R;
export type AsyncAutoRef<T, A extends unknown[]> = [
  ...AsyncRef<T, A>,
  onResolved: (cb: (val: T) => void) => void,
];
export type AsyncReducableRef<T, R, A extends unknown[]> = [
  ...AsyncRef<R, A>,
  reduce: (cb: ReduceCallBack<T, R>) => void,
  reset: () => void,
];
/**
 * @description 创建一个通过Emitter管理状态的ref, 参考writable
 */
export function writableRef<T>(value: T, option?: EmitterOption<T>): Ref<T> {
  const emitter = new Emitter<T>(void 0 as any, option);
  let _track: () => void, _trigger: () => void;
  function set(val: T): void {
    if (isPrimitive(val)) {
      emitter.set(val);
    } else {
      emitter.set(convertProxy(void 0, val, emitter as Emitter<any>, _track, _trigger));
    }
  }
  return customRef((track, trigger) => {
    emitter.listen(trigger);
    _track = track;
    _trigger = trigger;
    set(value);
    return {
      set,
      get() {
        track();
        return emitter.get();
      },
    };
  });
}

/**
 * @description 创建一个通过Emitter管理状态的只读ref, 参考readable
 */
export function readableRef<T>(
  value: T,
  option: EmitterOption<T> & { start: (cb: (value: T) => void) => void },
): Ref<T> {
  const emitter = new Emitter<T>(value, option);
  return customRef((track, trigger) => {
    emitter.listen(trigger);
    return {
      set: () => void 0,
      get() {
        track();
        return emitter.get();
      },
    };
  });
}

/**
 * @description 创建一个通过Emitter管理Promise状态的ref, 参考writable
 * @param asyncCreator 创建一个Promise实例的方法, !注意: 不能将Promise实例作为参数传入, 必须传入创建Promise实例的方法
 * @param option.onResolved 当Promise实例状态变为fulfilled时执行
 * @return 两个元素的数组[Ref, 重新创建并执行Promise, 并设置Emitter状态的方法]
 */
export function asyncWritableRef<T, A extends unknown[]>(
  asyncCreator: AsyncCreator<T, A>,
  option?: AsyncOption<T, A>,
): AsyncAutoRef<T, A> {
  let emitter: Emitter<T>;
  let _cb: (val: T) => void;
  let _trigger: () => void;
  let _track: () => void;
  const [isAwaiting, setisAwaiting] = useStateRef(false);
  function onResolved(cb: (val: T) => void) {
    _cb = cb;
  }
  async function execute(...arg: A): Promise<T> {
    try {
      setisAwaiting(true);
      const ins = isFunction(asyncCreator) && asyncCreator(...arg);
      const instance = ((ins instanceof Promise && (await ins)) || ins) as T;
      if (isPrimitive(instance)) {
        emitter.set(instance);
      } else {
        emitter.set(
          convertProxy(void 0, instance, emitter as Emitter<any>, _track, _trigger) as any,
        );
      }
      isFunction(_cb) && _cb(emitter.get());
    } finally {
      setisAwaiting(false);
    }
    return emitter.get();
  }
  return [
    customRef((track, trigger) => {
      _trigger = trigger;
      _track = track;
      if (isPrimitive(option?.initVal)) {
        emitter = new Emitter<T>(option?.initVal as T, option);
      } else {
        emitter = new Emitter<T>(
          convertProxy(
            void 0,
            option?.initVal as any,
            emitter as Emitter<T & object>,
            track,
            trigger,
          ) as T,
          option,
        );
      }
      execute(...((option?.creatorArgs || []) as A));
      emitter.listen(trigger);
      return {
        set(val: T) {
          if (isPrimitive(val)) {
            emitter.set(val);
          } else {
            emitter.set(
              convertProxy(void 0, val as any, emitter as Emitter<T & object>, track, trigger),
            );
          }
        },
        get() {
          track();
          return emitter.get();
        },
      };
    }),
    execute,
    isAwaiting,
    onResolved,
  ];
}

/**
 * @description 创建一个通过Emitter管理Promise状态的只读ref, 参考readable
 * @param asyncCreator 创建一个Promise实例的方法, !注意: 不能将Promise实例作为参数传入, 必须传入创建Promise实例的方法
 * @param option.onResolved 当Promise实例状态变为fulfilled时执行
 * @return 两个元素的数组[Ref, 重新创建并执行Promise, 并设置Emitter状态的方法]
 */
export function asyncReadableRef<T, A extends unknown[]>(
  asyncCreator: AsyncCreator<T, A>,
  option?: AsyncOption<T, A>,
): AsyncAutoRef<T, A> {
  const [isAwaiting, setisAwaiting] = useStateRef(false);
  const emitter = new Emitter<T>(option?.initVal as T, option);
  let _cb: (val: T) => void;
  function onResolved(cb: (val: T) => void) {
    _cb = cb;
  }
  async function execute(...arg: A): Promise<T> {
    try {
      setisAwaiting(true);
      const ins = isFunction(asyncCreator) && asyncCreator(...arg);
      ins instanceof Promise && emitter.set(await ins);
      isFunction(_cb) && _cb(emitter.get());
    } finally {
      setisAwaiting(false);
    }
    return emitter.get();
  }
  return [
    customRef((track, trigger) => {
      execute(...((option?.creatorArgs || []) as A));
      emitter.listen(trigger);
      return {
        set: () => void 0,
        get() {
          track();
          return emitter.get();
        },
      };
    }),
    execute,
    isAwaiting,
    onResolved,
  ];
}

/**
 * @description 创建一个通过Emitter管理Promise状态的只读ref, 拓展readable, 提供reduce可递归处理状态的函数, reset可重置状态的函数
 * @param asyncCreator 创建一个Promise实例的方法, !注意: 不能将Promise实例作为参数传入, 必须传入创建Promise实例的方法
 * @param option.onResolved 当Promise实例状态变为fulfilled时执行
 * @return 三个元素的数组[Ref, 提供reduce可递归处理状态的函数, reset可重置状态的函数]
 */
export function asyncReducableRef<T, R, A extends unknown[]>(
  asyncCreator: AsyncCreator<T, A>,
  option?: AsyncOption<R, A>,
): AsyncReducableRef<T, R, A> {
  const [isAwaiting, setisAwaiting] = useStateRef(false);
  const emitter = new Emitter<R>(option?.initVal as R, option);
  let _cb: ReduceCallBack<T, R>;
  let initialized = false;
  async function execute(...arg: A): Promise<R> {
    if (isFunction(_cb)) {
      try {
        setisAwaiting(true);
        const ins = isFunction(asyncCreator) && asyncCreator(...arg);
        ins instanceof Promise && emitter.set(_cb(emitter.get(), await ins));
      } finally {
        setisAwaiting(false);
      }
      return emitter.get();
    } else {
      throw new Error('Reduce must be initialized before execute.');
    }
  }
  function reduce(cb: ReduceCallBack<T, R>): void {
    if (isFunction(asyncCreator)) {
      _cb = cb;
      if (!initialized) {
        execute(...((option?.creatorArgs || []) as A));
        initialized = true;
      }
    }
  }
  function reset(): void {
    emitter.set(option?.initVal as R);
  }
  return [
    customRef((track, trigger) => {
      emitter.listen(trigger);
      return {
        set: () => void 0,
        get() {
          track();
          return emitter.get();
        },
      };
    }),
    execute,
    isAwaiting,
    reduce,
    reset,
  ];
}
