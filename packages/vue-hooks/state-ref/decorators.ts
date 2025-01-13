import { isFunction, isObject, isString, isEqual, isPrimitive } from 'radash';
import { asyncWritableRef, asyncReadableRef, asyncReducableRef } from '.';
import type { AsyncAutoRef, AsyncReducableRef, AsyncOption } from '.';
import { customRef, nextTick } from 'vue';

type OriginTarget<T, A extends unknown[]> = (...arg: A) => Promise<T>;
type Store<T, R> =
  R extends AsyncAutoRef<T, unknown[]>
    ? AsyncAutoRef<T, unknown[]>
    : R extends AsyncReducableRef<T, unknown, unknown[]>
      ? AsyncReducableRef<T, unknown, unknown[]>
      : never;
type ReturnTarget<T, R, A extends unknown[]> = (...arg: A) => Store<T, R>;
type TargetInstType<T, S, A extends unknown[], R = ReturnTarget<T, S, A>> = Dict<
  OriginTarget<T, A> | R
>;
type Discriptor<T, R, A extends unknown[]> = (
  target: TargetInstType<T, R, A>,
  funcName: string,
) => ReturnTarget<T, R, A>;

function createDescriptor<T, S, A extends unknown[]>(
  asyncRef: typeof asyncReadableRef | typeof asyncWritableRef | typeof asyncReducableRef | any,
  obj?: AsyncOption<T, A> | TargetInstType<T, Store<T, S>, A> | any,
  name?: string,
): Discriptor<T, S, A> | ReturnTarget<T, S, A> | unknown {
  let store: Store<T, S>;
  function getTargetFunc(
    target: TargetInstType<T, S, A>,
    funcName: string,
    option?: AsyncOption<T, A>,
  ): ReturnTarget<T, S, A> {
    const originFunc = target[funcName] as OriginTarget<T, A>;
    target[funcName] = function (...arg: A): Store<T, S> {
      if (!store) {
        store = asyncRef(originFunc.bind(target), {
          ...option,
          creatorArgs: arg,
        });
      } else {
        store[1](...arg);
      }
      return store;
    };
    return target[funcName] as ReturnTarget<T, S, A>;
  }
  if (isString(name) && obj && isFunction(obj[name])) {
    return getTargetFunc(obj as TargetInstType<T, S, A>, name);
  } else {
    return (target: TargetInstType<T, S, A>, funcName: string) =>
      getTargetFunc(target, funcName, obj as AsyncOption<T, A>);
  }
}
/**
 * @description 类的实例方法修饰器, 将实例方法改造为将返回Promise实例的方法转换为返回Writable的方法
 */
export function AsyncWritableRefReturn<T, A extends unknown[]>(
  obj?: AsyncOption<T, A> | TargetInstType<T, AsyncAutoRef<T, A>, A> | any,
  name?: string,
): Discriptor<T, AsyncAutoRef<T, A>, A> | ReturnTarget<T, AsyncAutoRef<T, A>, A> | any {
  return createDescriptor(asyncWritableRef, obj, name);
}

/**
 * @description 类的实例方法修饰器, 将实例方法改造为将返回Promise实例的方法转换为返回Readable的方法
 */
export function AsyncReadableRefReturn<T, A extends unknown[]>(
  obj?: AsyncOption<T, A> | TargetInstType<T, AsyncAutoRef<T, A>, A> | any,
  name?: string,
): Discriptor<T, AsyncAutoRef<T, A>, A> | ReturnTarget<T, AsyncAutoRef<T, A>, A> | any {
  return createDescriptor(asyncReadableRef, obj, name);
}

/**
 * @description 类的实例方法修饰器, 将实例方法改造为将返回Promise实例的方法转换为返回Reducale的方法
 */
export function AsyncReducableRefReturn<T, R, A extends unknown[]>(
  obj?:
    | (AsyncOption<R, A> & { initVal?: R })
    | TargetInstType<T, AsyncReducableRef<T, R, A>, A>
    | any,
  name?: string,
):
  | Discriptor<T, AsyncReducableRef<T, R, A>, A>
  | ReturnTarget<T, AsyncReducableRef<T, R, A>, A>
  | any {
  return createDescriptor(asyncReducableRef, obj, name);
}

/**
 * @description 类的属性修饰器,  使其改写为返回一个只读的Ref的方法, 该Ref会在属性值变化时触发变更
 */
export function FieldRef<T>(
  defaultValue: Dict<any> | T,
  name?: string,
): void | ((target: Dict<any>, propName: string) => void) | any {
  function modifyProp(target: Dict<any>, propName: string, defaultVal?: T): void {
    let value: T = defaultVal as T;
    let _trigger: () => void;
    const getRef = customRef((track, trigger) => {
      _trigger = trigger;
      return {
        set: () => void 0,
        get() {
          track();
          return value;
        },
      };
    });
    Object.defineProperty(target, propName, {
      configurable: true,
      enumerable: true,
      set(val: T) {
        value = val;
        isFunction(_trigger) && _trigger();
      },
      get() {
        return getRef;
      },
    });
  }
  if (name && (isObject(defaultValue) || isFunction(defaultValue))) {
    modifyProp(defaultValue, name);
  } else {
    return function (target: Dict<any>, propName: string) {
      modifyProp(target, propName, defaultValue as T);
    };
  }
}
/**
 * @description 类的set或get方法修饰器, get属性只读, 使其改写为返回一个只读的Ref的方法, 该Ref会在原get方法返回值变化时触发变更
 * @attention !注意: 只能修饰声明过get方法的set或get方法, 可以是实例的get或set方法, 也可以是静态get或set方法
 */
export function AccessorRef<T>(
  target: Dict<any>,
  name: string,
  descriptor: TypedPropertyDescriptor<T>,
): void {
  if (isFunction(descriptor?.get)) {
    const originGet = descriptor.get as () => T;
    let ins: unknown;
    let value: T;
    const getRef = customRef((track, trigger) => {
      return {
        set: () => void 0,
        get() {
          if (ins) {
            const currentVal = originGet.call(ins);
            if ((isPrimitive(currentVal) && value !== currentVal) || !isEqual(value, currentVal)) {
              trigger();
              value = isPrimitive(currentVal) ? currentVal : JSON.parse(JSON.stringify(currentVal));
            }
            track();
            return currentVal;
          }
        },
      };
    });
    descriptor.get = new Proxy(
      function () {
        return getRef;
      },
      {
        apply(method, obj) {
          ins = obj;
          return method();
        },
      },
    ) as () => T;
    nextTick(() => {
      Object.defineProperty(target, name, descriptor);
      Object.defineProperty(descriptor, 'initializer', descriptor);
      setInterval(() => getRef.value, 100);
    });
  } else {
    throw new Error(
      `@AccessorRef decorator must decorate a property which must have a get-function in descriptor, "${target.constructor.name}.${name}" doesn't have its get-function in descriptor.`,
    );
  }
}
