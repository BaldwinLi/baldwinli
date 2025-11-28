import { clone, isFunction } from 'radash';
import { NAMESPACE } from './util.schema';
import { cacheService } from '../services/cache-service';

/**
 * 消息事件常量
 */
const MSG = 'message';

/**
 * 广播通道实例
 */
let channel: BroadcastChannel;

/**
 * Emitter选项接口
 * @template T - 事件数据类型
 */
export interface Option<T> {
  /**
   * 频道名称
   * @description 声明频道名称可以让应用在相同origin的tab页之间互相共享状态
   */
  channelName?: string;
  
  /**
   * 自动更新方法
   * @description 赋予只读内部自动更新的能力方法
   */
  start?: (cb: (value: T) => void) => void;
}

/**
 * 事件消息类
 * @template T - 事件数据类型
 * @description 可以创建一个事件消息实例，并维护自身状态，支持相同origin之间的状态共享
 */
export class Emitter<T> {
  /**
   * 回调函数列表
   */
  private callbackList: ((message: T) => void)[] = [];
  
  /**
   * 当前值
   */
  private value?: T;
  
  /**
   * 频道名称
   */
  private channelName?: string;
  
  /**
   * 绑定的监听器处理函数
   */
  private bindingListenerHandler: (event: { data: { data: T; type: string } }) => void =
    this.listenHandler.bind(this);
  
  /**
   * 构造函数
   * @param value - 初始值
   * @param option - 配置选项
   */
  constructor(value: T, option?: Option<T>) {
    this.channelName = option?.channelName;
    // 优先从缓存获取值，如果没有则使用初始值
    this.value = this.channelName ? cacheService.get(this.channelName) || value : value;
    
    // 初始化广播通道
    if (!channel && this.channelName) {
      channel = window.BroadcastChannel && new window.BroadcastChannel(NAMESPACE);
    }
    
    // 设置缓存并添加事件监听
    if (this.channelName) {
      cacheService.set(this.channelName, this.value);
      channel?.addEventListener(MSG, this.bindingListenerHandler);
    }
    
    // 设置自动更新
    if (isFunction(option?.start)) {
      option?.start(this.set.bind(this));
    }
  }

  /**
   * 更新状态
   * @param cb - 更新回调函数，接收当前值并返回新值
   */
  public update(cb: (val: T) => T): void {
    if (isFunction(cb)) {
      this.set(cb(this.value as T));
    }
  }

  /**
   * 设置状态
   * @param value - 新值
   */
  public set(value: T): void {
    // 深拷贝避免引用问题
    this.value = clone(value);
    
    // 更新缓存并广播消息
    if (this.channelName) {
      cacheService.set(this.channelName, this.value);
      channel?.postMessage({ data: value, type: this.channelName });
    }
    
    // 触发所有监听器
    this.listenHandler({ data: { data: value, type: this.channelName } });
  }

  /**
   * 获取状态
   * @returns 当前状态值
   */
  public get(): T {
    return this.value as T;
  }

  /**
   * 监听事件消息
   * @param cb - 监听回调函数
   * @param invalidate - 取消监听时的清理函数
   * @returns 取消监听的函数
   * @throws {TypeError} 当cb不是函数时抛出错误
   */
  public listen(cb: (message: T) => void, invalidate?: (message: T) => void): () => void {
    if (isFunction(cb)) {
      this.callbackList.push(cb);
      
      // 返回取消监听的函数
      return () => {
        const index = this.callbackList.findIndex((e) => e === cb);
        if (index > -1) {
          this.callbackList.splice(index, 1);
        }
        // 执行清理函数
        if (isFunction(invalidate)) {
          invalidate(this.get());
        }
      };
    } else {
      throw new TypeError('Argument must be a function.');
    }
  }

  /**
   * 停止当前所有消息监听
   * @description 该操作不可逆
   */
  public unlisten(): void {
    if (this.callbackList) {
      this.callbackList.length = 0;
    }
  }

  /**
   * 将监听消息转化为Promise实例
   * @returns 解析为下一条消息的Promise
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
