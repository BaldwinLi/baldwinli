import type { CacheService } from './cache-service';
import { stringify } from 'qs';
import { isEmpty, isFunction, trim } from 'radash';
import type { Constructable } from '../utils/util.schema';
import { concatenate, isNull, isUndefined } from '../utils/utils';
import { clearDirty } from '../utils/provide';

/**
 * 查询参数字典类型
 */
type QueryDict = Dict<string | number | boolean | any>;

/**
 * HTTP方法类型
 */
type Method = 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'PUT';

/**
 * HTTP客户端抽象类
 * @description 封装fetch API，提供便捷的HTTP请求方法，必须被子类继承以实现具体功能
 */
@Hooksable
export abstract class HttpClient {
  /**
   * 默认配置对象
   */
  protected pdefaultConfig: RequestInit;
  
  /**
   * API基础URL
   */
  protected baseURL: string = '/';
  
  /**
   * 缓存服务实例
   */
  protected cache!: CacheService;
  
  /**
   * 构造函数
   * @description 初始化默认配置，设置默认Content-Type为application/json
   */
  constructor() {
    this.pdefaultConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
    } as any;
  }

  /**
   * 默认配置获取器
   * @returns 默认请求配置对象
   */
  get defaultConfig(): RequestInit {
    return this.pdefaultConfig;
  }

  /**
   * 通用请求方法
   * @param input - 请求URL或Request对象
   * @param config - 请求配置
   * @returns 请求响应结果
   */
  public async request(input: RequestInfo | URL, config: RequestInit): Promise<any> {
    const conf = this.doMergeConfig(config!);
    await this.beforeRequest(input as string, void 0, config.body as any, conf);
    return this.doneResponse(
      fetch(input, {
        ...conf,
        body: JSON.stringify(this.doMergeData(JSON.parse(config.body as string))),
      }),
    );
  }

  /**
   * GET请求方法
   * @param url - 请求URL
   * @param query - 查询参数
   * @param config - 请求配置
   * @returns 请求响应结果
   */
  public async get(url: string, query?: QueryDict, config?: RequestInit): Promise<any> {
    const conf = this.doMergeConfig(config!);
    await this.beforeRequest(url, query, void 0, {
      ...(conf || {}),
      method: 'GET',
    });
    return this.doneResponse(fetch(this.getRequest(this.stringifyQuery(url, query), 'GET', conf)));
  }

  /**
   * DELETE请求方法
   * @param url - 请求URL
   * @param query - 查询参数
   * @param config - 请求配置
   * @returns 请求响应结果
   */
  public async delete(url: string, query?: QueryDict, config?: RequestInit): Promise<any> {
    const conf = this.doMergeConfig(config!);
    await this.beforeRequest(url, query, void 0, {
      ...(conf || {}),
      method: 'DELETE',
    });
    return this.doneResponse(
      fetch(this.getRequest(this.stringifyQuery(url, query), 'DELETE', conf)),
    );
  }

  /**
   * HEAD请求方法
   * @param url - 请求URL
   * @param query - 查询参数
   * @param config - 请求配置
   * @returns 请求响应结果
   */
  public async head(url: string, query?: QueryDict, config?: RequestInit): Promise<any> {
    const conf = this.doMergeConfig(config!);
    await this.beforeRequest(url, query, void 0, {
      ...(conf || {}),
      method: 'HEAD',
    });
    return this.doneResponse(fetch(this.getRequest(this.stringifyQuery(url, query), 'HEAD', conf)));
  }

  /**
   * OPTIONS请求方法
   * @param url - 请求URL
   * @param query - 查询参数
   * @param config - 请求配置
   * @returns 请求响应结果
   */
  public async options(url: string, query?: QueryDict, config?: RequestInit): Promise<any> {
    const conf = this.doMergeConfig(config!);
    await this.beforeRequest(url, query, void 0, {
      ...(conf || {}),
      method: 'OPTIONS',
    });
    return this.doneResponse(
      fetch(this.getRequest(this.stringifyQuery(url, query), 'OPTIONS', conf)),
    );
  }

  /**
   * POST请求方法
   * @param url - 请求URL
   * @param data - 请求体数据
   * @param query - 查询参数
   * @param config - 请求配置
   * @returns 请求响应结果
   */
  public async post(
    url: string,
    data?: any,
    query?: QueryDict,
    config?: RequestInit,
  ): Promise<any> {
    const conf = this.doMergeConfig(config!);
    await this.beforeRequest(url, query, data, {
      ...(conf || {}),
      method: 'POST',
    });
    const _data = this.doMergeData(data);
    return this.doneResponse(
      fetch(
        this.getRequest(this.stringifyQuery(url, query), 'POST', {
          ...conf,
          body: JSON.stringify(_data),
        }),
      ),
    );
  }

  /**
   * PUT请求方法
   * @param url - 请求URL
   * @param data - 请求体数据
   * @param query - 查询参数
   * @param config - 请求配置
   * @returns 请求响应结果
   */
  public async put(url: string, data?: any, query?: QueryDict, config?: RequestInit): Promise<any> {
    const conf = this.doMergeConfig(config!);
    await this.beforeRequest(url, query, data, {
      ...(conf || {}),
      method: 'PUT',
    });
    const _data = this.doMergeData(data);
    return this.doneResponse(
      fetch(
        this.getRequest(this.stringifyQuery(url, query), 'PUT', {
          ...conf,
          body: JSON.stringify(_data),
        }),
      ),
    );
  }

  /**
   * PATCH请求方法
   * @param url - 请求URL
   * @param data - 请求体数据
   * @param query - 查询参数
   * @param config - 请求配置
   * @returns 请求响应结果
   */
  public async patch(
    url: string,
    data?: any,
    query?: QueryDict,
    config?: RequestInit,
  ): Promise<any> {
    const conf = this.doMergeConfig(config!);
    await this.beforeRequest(url, query, data, {
      ...(conf || {}),
      method: 'PATCH',
    });
    const _data = this.doMergeData(data);
    return this.doneResponse(
      fetch(
        this.getRequest(this.stringifyQuery(url, query), 'PATCH', {
          ...conf,
          body: JSON.stringify(_data),
        }),
      ),
    );
  }

  /**
   * 文件上传方法
   * @param url - 上传URL
   * @param method - HTTP方法
   * @param data - 包含文件的表单数据
   * @param options - 上传选项
   * @param options.query - 查询参数
   * @param options.headers - 请求头
   * @param options.chunk - 是否启用分片上传
   * @param options.boundary - 多部分表单边界
   * @param options.onProgress - 上传进度回调
   * @returns 上传响应结果
   */
  public async upload(
    url: string,
    method: Method,
    data: Dict<any>,
    options?: {
      query?: QueryDict;
      headers?: Dict<any>;
      chunk?: boolean;
      boundary?: string;
      onProgress?: (loaded: number, total: number) => void;
    },
  ): Promise<any> {
    const config = this.doMergeConfig({
      headers: options?.headers,
    });
    await this.beforeRequest(url, options?.query, data, {
      ...(config || {}),
      method,
    });
    let resultPromise: Promise<Response>;
    const _url = this.stringifyQuery(url, options?.query);
    
    // 分片上传逻辑
    if (options?.chunk) {
      resultPromise = (async () => {
        const promises = [] as Promise<Response[]>[];
        let total = 0;
        const loadedMap: Dict<number> = {};
        
        // 处理所有文件
        for (const key in data) {
          if (data[key] instanceof File) {
            total += (data[key] as any)?.size || 0;
            promises.push(
              this.uploadBigFile(
                _url,
                method,
                data[key] as File,
                config?.headers || {},
                (loaded: number, filename: string) => {
                  loadedMap[filename] = loaded;
                  let _loaded = 0;
                  for (const key in loadedMap) {
                    _loaded += loadedMap[key] || 0;
                  }
                  // 调用进度回调
                  isFunction(options?.onProgress) && options?.onProgress!(_loaded, total);
                },
              ),
            );
          }
        }
        
        // 等待所有上传完成并返回最后一个响应
        const results = (await Promise.all(promises)).flat();
        return results[results.length - 1];
      })();
    } else {
      const body = new FormData();
      for (const key in data) {
        body.append(key, data[key] as Blob);
      }
      const headers = config?.headers || {};
      if (options?.boundary) {
        headers['Content-Type'] = `multipart/form-data; boundary=${options?.boundary}`;
      } else {
        delete headers['Content-Type'];
      }
      resultPromise = this.uploadBody(_url, method, body, headers, options?.onProgress);
    }
    return await this.doneResponse(resultPromise);
  }

  public async download(
    url: string,
    method: Method,
    options?: {
      query?: QueryDict;
      data?: Dict<any>;
      config?: RequestInit;
      fileName?: string;
      usePure?: boolean;
      onProgress?: (loaded: number, total: number) => void;
    },
  ): Promise<void> {
    const config = this.doMergeConfig(options?.config);
    await this.beforeRequest(url as string, options?.query, options?.data, {
      ...(config || {}),
      method,
    });
    const resp = await fetch(this.baseURL + this.stringifyQuery(url as string, options?.query), {
      ...config,
      method,
      body: options?.data && JSON.stringify(this.doMergeData(options?.data)),
    });
    await this.afterResponse(resp as any);
    if (resp.headers && resp.body) {
      const blob = options?.usePure
        ? await resp.blob()
        : new Blob([await this.getUintArray(resp, options?.onProgress)], {
            type: resp.headers.get('Content-Type') || 'text/plain',
          });
      const link = document.createElement('a');
      link.target = '_blank';
      link.style.display = 'none';
      link.href = URL.createObjectURL(blob);
      link.download = options?.fileName || this.getDefaultFileName(resp);
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }
  }

  private async doneResponse(response: Promise<Response>): Promise<any> {
    let res: Response = null as any;
    try {
      res = await response;
      const contentType = res.headers.get('Content-Type');
      if (contentType?.startsWith('application/json')) {
        (res as any).data = await res.json();
      } else if (contentType?.startsWith('text/plain')) {
        (res as any).data = await res.text();
      }
    } catch (e: any) {
      if (e.response instanceof Response) {
        res = e.response;
      } else {
        return await this.afterResponse(res as any);
      }
    }
    return await this.afterResponse(res as any);
  }

  /**
   * @description 请求响应后会被执行的钩子抽象方法， 必须被实现
   */
  protected abstract afterResponse(result: Response & { data: any }): Promise<any>;

  /**
   * @description 发送请求前会被执行的钩子抽象方法， 必须被实现
   */
  protected abstract beforeRequest(
    url: string,
    query?: QueryDict,
    data?: Dict<any>,
    config?: RequestInit,
  ): Promise<void>;

  private stringifyQuery(url: string, params?: QueryDict): string {
    if (!isEmpty(params)) {
      const query: Dict<any> = {};
      for (const key in params) {
        if (!isUndefined(params[key]) && !isNull(params[key]) && params[key] !== '') {
          query[key] = params[key];
        }
      }
      const reg = /[?]/;
      url += reg.test(url) ? `${stringify(query)}` : `?${stringify(query)}`;
    }
    return url;
  }

  /**
   * @description 请求默认配置与自定义配置的合并的钩子抽象方法， 必须被实现
   */
  protected abstract doMergeConfig(config?: RequestInit, data?: any): RequestInit;

  /**
   * @description 发送请求前合并业务数据与系统级数据变为统一数据结构的钩子抽象方法， 必须被实现
   */
  protected abstract doMergeData(data?: Dict<any>): Dict<any>;

  /**
   * @description 当请求响应后捕捉请求体异常的钩子抽象方法， 必须被实现
   */
  protected abstract doCatchError(res: Response & { data: any }): void | Promise<void>;

  private getRequest(
    url: string,
    method: string,
    config: RequestInit,
    enableBaseUrl: boolean = true,
  ): Request {
    return new Request(
      (enableBaseUrl ? this.baseURL.replace(/\/+$/, '') : '') + '/' + url.replace(/^\/+/, ''),
      {
        ...config,
        method,
      },
    );
  }

  private getResponse(xhr: XMLHttpRequest): Response {
    const headers = xhr.getAllResponseHeaders();
    const arr = headers.trim().split(/[\r\n]+/);
    const headerMap: Dict<any> = {};
    for (const line of arr) {
      const parts = line.split(': ');
      headerMap[parts[0]] = parts[1];
    }
    return new Response(xhr.response, {
      headers: headerMap,
      status: xhr.status,
      statusText: xhr.statusText,
    });
  }

  private getDefaultFileName(resp: Response): string {
    const disposition = resp.headers.get('Content-Disposition');
    let fileName;
    if (disposition) {
      const fileDes = decodeURI(disposition.split('=')[1]);
      fileName = trim(trim(fileDes, ';'));
    }
    return fileName || resp.url.split('/').pop()?.split('#')[0].split('?')[0] || '';
  }

  private uploadBody(
    url: string,
    method: Method,
    body: Blob | FormData,
    headers: Dict<any>,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<Response> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.onloadend = () => resolve(this.getResponse(xhr));
      xhr.upload.onprogress = (e) => isFunction(onProgress) && onProgress!(e.loaded, e.total);
      xhr.open(method, this.baseURL + url);
      for (const index in headers) {
        xhr.setRequestHeader(index, headers[index]);
      }
      xhr.send(body);
    });
  }

  private async uploadBigFile(
    url: string,
    method: Method,
    file: File,
    headers: Dict<any>,
    onProgress?: (loaded: number, fileName: string) => void,
  ): Promise<Response[]> {
    const chunkSize = 1 * 1024 * 1024; // 分块大小为1MB
    const chunks = Math.ceil(file.size / chunkSize); // 计算分块数
    let currentChunk = 0; // 当前分块
    let start, end;
    const promises = [] as Promise<Response>[];
    while (currentChunk < chunks) {
      start = currentChunk * chunkSize;
      end = start + chunkSize >= file.size ? file.size : start + chunkSize;
      const chunk = file.slice(start, end);
      const _headers = {
        ...headers,
        'Content-Type': 'application/octet-stream',
        'Content-Range': 'bytes ' + start + '-' + end + '/' + file.size,
      };
      promises.push(
        this.uploadBody(
          url,
          method,
          chunk,
          _headers,
          (loaded: number) => isFunction(onProgress) && onProgress!(loaded, file.name),
        ),
      );
      currentChunk++;
    }
    return Promise.all(promises);
  }

  private async getUintArray(
    resp: Response,
    onProgress?: (loaded: number, total: number) => void,
  ): Promise<Uint8Array> {
    const contentLength = resp.headers.get('content-length');
    if (contentLength && isFunction(onProgress)) {
      const total = +(Number(contentLength) || 0);
      let result!: Uint8Array;
      const reader = resp.body?.getReader();
      if (reader) {
        let loaded = 0;
        while (total > 0) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          if (!result) {
            result = new (value as any).constructor(0);
          }
          loaded += value.length;
          onProgress!(loaded, total);
          result = concatenate(result, value);
        }
        return result;
      } else {
        return result;
      }
    } else {
      return new Uint8Array(await resp.arrayBuffer());
    }
  }
}

/**
 * @description 修饰器 只能修饰HttpClient, 控制HttpClient事件钩子的执行时机
 */
function Hooksable(target: Constructable<any> | any): any {
  return function () {
    const instance = new target();
    clearDirty(instance);
    this.__proto__.__proto__ = instance;
    const childInstance = this;
    const originAfterResponse: (result: Response) => Promise<any> =
      childInstance.afterResponse.bind(childInstance);
    childInstance.afterResponse = async (result: Response) => {
      const data = await originAfterResponse(result);
      await childInstance.doCatchError(result);
      return data;
    };
    const originDoMergeConfig: (config?: RequestInit, data?: any) => RequestInit =
      childInstance.doMergeConfig.bind(childInstance);
    childInstance.doMergeConfig = (config: RequestInit = {}, data?: any) => {
      return originDoMergeConfig(
        {
          ...childInstance.pdefaultConfig,
          ...config,
          headers: {
            ...childInstance.pdefaultConfig?.headers,
            ...config?.headers,
          },
        },
        data,
      );
    };
  };
}
