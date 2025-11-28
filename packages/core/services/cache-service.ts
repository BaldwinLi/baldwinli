import { CookieStorage } from './cookie.storage';
import { Provide } from '../utils/provide';
import { NAMESPACE } from '../utils/util.schema';
import { Service } from '../decorators/service';

/**
 * Cookie存储实例，通过依赖注入创建
 */
export const cookieStorage = Provide(CookieStorage);

/**
 * 缓存服务类
 * @description 提供相同origin之间的数据读写，storage的生命周期与启用的storage相同，支持localStorage、sessionStorage和cookie，默认使用localStorage
 */
@Service('cache')
export class CacheService {
  /**
   * 缓存映射表，用于存储键值对
   */
  private cacheMap!: Dict<string>;
  
  /**
   * 命名空间，用于在存储中隔离数据
   */
  private NAMESPACE: string = NAMESPACE;
  
  /**
   * 当前使用的存储实例
   */
  private _storage!: Storage;
  
  /**
   * 构造函数
   * @description 初始化存储并刷新缓存映射表
   */
  constructor() {
    this.storageInit();
    this.refreshCacheMap();
  }

  /**
   * 存储设置器
   * @param val - 要使用的存储实例（localStorage、sessionStorage或CookieStorage）
   * @throws {Error} 当提供的存储类型不受支持时抛出错误
   */
  set storage(val: Storage) {
    switch (val) {
      case localStorage:
        this.replaceStorge(localStorage);
        break;
      case sessionStorage:
        this.replaceStorge(sessionStorage);
        break;
      case cookieStorage:
        this.replaceStorge(cookieStorage);
        break;
      default:
        throw new Error(
          'Set Storage is not support: need to set "localStorage", "sessionStorage" or "CookieStorage"',
        );
    }
  }

  /**
   * 设置缓存数据
   * @param key - 缓存键名
   * @param value - 要存储的值（会自动序列化）
   */
  public set(key: string, value: any): void {
    if (key) {
      if (this._storage instanceof CookieStorage) {
        this._storage.setItem(key, value);
      } else {
        this.cacheMap[key] = value;
        this._storage.setItem(this.NAMESPACE, JSON.stringify(this.cacheMap));
      }
    }
  }

  /**
   * 获取缓存数据
   * @param key - 缓存键名
   * @returns 缓存的值，如果不存在则返回undefined
   */
  public get(key: string): any {
    if (this._storage instanceof CookieStorage) {
      return this._storage.getItem(key);
    } else {
      this.refreshCacheMap();
      return this.cacheMap[key];
    }
  }

  /**
   * 移除指定缓存
   * @param key - 要移除的缓存键名
   */
  public remove(key: string): void {
    if (key) {
      if (this._storage instanceof CookieStorage) {
        this._storage.removeItem(key);
      } else {
        delete this.cacheMap[key];
        this._storage.setItem(this.NAMESPACE, JSON.stringify(this.cacheMap));
      }
    }
  }

  /**
   * 清空所有缓存
   */
  public clear(): void {
    if (this._storage instanceof CookieStorage) {
      this._storage.clear();
    } else {
      this.cacheMap = {};
      this._storage.removeItem(this.NAMESPACE);
    }
  }

  /**
   * 刷新缓存映射表
   * @private
   * @description 从存储中重新读取数据到缓存映射表
   */
  private refreshCacheMap(): void {
    try {
      if (!(this._storage instanceof CookieStorage)) {
        const valStr = this._storage.getItem(this.NAMESPACE);
        this.cacheMap = (valStr && JSON.parse(valStr)) || {};
      }
    } catch (e) {
      this.cacheMap = {};
    }
  }

  /**
   * 替换当前使用的存储
   * @private
   * @param storage - 新的存储实例
   * @throws {Error} 当存储不可用时抛出错误
   */
  private replaceStorge(storage: Storage): void {
    if (this.isValidStorage(storage)) {
      if (storage !== this._storage) {
        // 数据迁移逻辑
        if (storage instanceof CookieStorage) {
          // 从当前存储迁移到CookieStorage
          for (const key of storage.keys) {
            const value = this._storage.getItem(key) as any;
            storage.setItem(key, value);
          }
          this._storage.clear();
        } else if (this._storage instanceof CookieStorage) {
          // 从CookieStorage迁移到其他存储
          this.cacheMap = {};
          for (const key of this._storage.keys) {
            this.cacheMap[key] = this._storage.getItem(key) as any;
          }
          storage.setItem(this.NAMESPACE, JSON.stringify(this.cacheMap));
          this._storage.clear();
        } else {
          // 在localStorage和sessionStorage之间迁移
          storage.setItem(this.NAMESPACE, JSON.stringify(this.cacheMap));
          this._storage.removeItem(this.NAMESPACE);
          this._storage = storage;
        }
        this._storage = storage;
      }
    } else {
      throw new Error('The Storage is not support on current browser.');
    }
  }

  /**
   * 初始化存储
   * @private
   * @description 按优先级尝试初始化可用的存储
   * @throws {Error} 当所有存储都不可用时抛出错误
   */
  private storageInit(): void {
    if (this.isValidStorage(localStorage)) {
      this._storage = localStorage;
    } else if (this.isValidStorage(sessionStorage)) {
      this._storage = sessionStorage;
    } else if (this.isValidStorage(cookieStorage)) {
      this.setCookieStorage();
    } else {
      throw new Error('The Storage is not support on current browser.');
    }
  }

  /**
   * 验证存储是否可用
   * @private
   * @param storage - 要验证的存储实例
   * @returns 存储是否可用
   */
  private isValidStorage(storage: Storage): boolean {
    if (storage) {
      try {
        // 通过实际写入和读取来验证存储是否可用
        storage.setItem('storageTest', 'value');
        if (storage.getItem('storageTest') !== 'value') {
          storage.removeItem('storageTest');
          return false;
        }
        storage.removeItem('storageTest');
        return true;
      } catch (e) {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * 设置Cookie存储
   * @private
   * @description 配置并使用CookieStorage
   */
  private setCookieStorage(): void {
    this._storage = cookieStorage;
    this._storage.namespace = this.NAMESPACE + '-';
  }
}

/**
 * 缓存服务实例
 * @description 全局单例，可直接使用
 */
export const cacheService = new CacheService();
