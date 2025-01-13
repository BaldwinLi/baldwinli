import { CookieStorage } from './cookie.storage';
import { Provide } from '../utils/provide';
import { NAMESPACE } from '../utils/util.schema';
import { Service } from '../decorators/service';

export const cookieStorage = Provide(CookieStorage);

/**
 * @description 提供相同origin之间的数据读写， storage的生命周期与启用的storage相同， 支持localStorage、sessionStorage和cooike, 默认localStorage
 */
@Service('cache')
export class CacheService {
  private cacheMap!: Dict<string>;
  private NAMESPACE: string = NAMESPACE;
  private _storage!: Storage;
  constructor() {
    this.storageInit();
    this.refreshCacheMap();
  }

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

  public get(key: string): any {
    if (this._storage instanceof CookieStorage) {
      this._storage.getItem(key);
    } else {
      this.refreshCacheMap();
      return this.cacheMap[key];
    }
  }

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

  public clear(): void {
    if (this._storage instanceof CookieStorage) {
      this._storage.clear();
    } else {
      this.cacheMap = {};
      this._storage.removeItem(this.NAMESPACE);
    }
  }

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

  private replaceStorge(storage: Storage): void {
    if (this.isValidStorage(storage)) {
      if (storage !== this._storage) {
        if (storage instanceof CookieStorage) {
          for (const key of storage.keys) {
            const value = this._storage.getItem(key) as any;
            storage.setItem(key, value);
          }
          this._storage.clear();
        } else if (this._storage instanceof CookieStorage) {
          this.cacheMap = {};
          for (const key of this._storage.keys) {
            this.cacheMap[key] = this._storage.getItem(key) as any;
          }
          storage.setItem(this.NAMESPACE, JSON.stringify(this.cacheMap));
          this._storage.clear();
        } else {
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

  private isValidStorage(storage: Storage): boolean {
    if (storage) {
      try {
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

  private setCookieStorage(): void {
    this._storage = cookieStorage;
    this._storage.namespace = this.NAMESPACE + '-';
  }
}
