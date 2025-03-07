import { clone, isFunction } from 'radash';
import { NAMESPACE } from './util.schema';
import { cacheService } from '../services/cache-service';
const MSG = 'message';
let channel: BroadcastChannel;

export interface Option<T> {
  // 频道名称, 声明频道名称可以让应用在相同origin的tab页之间互相共享状态
  channelName?: string;
  // 赋予只读内部自动更新的能力方法
  start?: (cb: (value: T) => void) => void;
}
/**
 * @description 事件消息类, 可以创建一个事件消息实例, 并维护自身状态, 构造函数可传入初始状态和channelName以支持提供相同origin之间的状态共享
 */
export class Emitter<T> {
  private callbackList: ((message: T) => void)[] | any = [];
  private value?: T;
  private channelName?: string;
  private bindingListenerHandler: (event: { data: { data: T; type: string } }) => void =
    this.listenHandler.bind(this);
  constructor(value: T, option?: Option<T>) {
    this.channelName = option?.channelName;
    this.value = this.channelName ? cacheService.get(this.channelName) || value : value;
    if (!channel && this.channelName) {
      channel = window.BroadcastChannel && new window.BroadcastChannel(NAMESPACE);
    }
    if (this.channelName) {
      cacheService.set(this.channelName, this.value);
      channel?.addEventListener(MSG, this.bindingListenerHandler);
    }
    if (isFunction(option?.start)) {
      option?.start(this.set.bind(this));
    }
  }

  /**
   * @description 更新状态
   */
  public update(cb: (val: T) => T): void {
    if (isFunction(cb)) {
      this.set(cb(this.value as T));
    }
  }

  /**
   * @description 设置状态
   */
  public set(value: T): void {
    this.value = clone(value);
    if (this.channelName) {
      cacheService.set(this.channelName, this.value);
      channel?.postMessage({ data: value, type: this.channelName });
    }
    this.listenHandler({ data: { data: value, type: this.channelName } });
  }

  /**
   *
   * @description 获取状态
   */
  public get(): T {
    return this.value as T;
  }

  /**
   * @description 监听事件消息
   * @param 监听事件消息回调函数
   * @return 提供停止监听当前消息方法, 该操作不可逆
   */
  public listen(cb: (message: T) => void, invalidate?: (message: T) => void): () => void {
    if (isFunction(cb)) {
      this.callbackList?.push(cb);
      return () => {
        const index = this.callbackList?.findIndex((e: (message: T) => void) => e === cb);
        index > -1 && this.callbackList?.splice(index, 1);
        isFunction(invalidate) && invalidate(this.get());
      };
    } else {
      throw new TypeError('Argument must be a function.');
    }
  }

  /**
   * @description 停止当前所有消息监听, 该操作不可逆
   */
  public unlisten(): void {
    this.callbackList && (this.callbackList.length = 0);
  }

  /**
   * @description 将监听消息转化为Promise实例
   */
  public toPromise(): Promise<T> {
    return new Promise((resolve) => {
      const unlisten = this.listen((message: T) => {
        resolve(message);
        unlisten();
      });
    });
  }

  /**
   * @description 关闭当前事件消息实例, 该操作不可逆
   */
  public close(): void {
    delete this.callbackList;
    delete this.value;
    this.channelName && channel?.removeEventListener(MSG, this.bindingListenerHandler);
  }

  private listenHandler(event: { data: { data: T; type?: string } }): void {
    const payload = event.data;
    if (payload.type === this.channelName) {
      this.value = payload.data;
      for (const callback of this.callbackList || []) {
        callback(payload.data);
      }
    }
  }
}
