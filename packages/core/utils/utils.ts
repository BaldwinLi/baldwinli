import { isFunction, isNumber, isString } from 'radash';

const hexDigits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export function uuid(length: number = 35): string {
  const s: string[] = [];
  for (let i = 0; i < length; i++) {
    s[i] = (hexDigits + hexDigits.toLowerCase()).substr(Math.floor(Math.random() * 0x24), 1);
  }
  return s.join('');
}
const dateFormatStr = 'yyyy-MM-dd hh:mm:ss';
export function dateFormat(date: string | number | Date, fmt: string = dateFormatStr): string {
  if (!date) {
    return '';
  }
  if (!(date instanceof Date)) {
    if (isString(date)) {
      date = Date.parse(
        date
          .toString()
          .replace(/-/g, '/')
          .replace(/(\d+)T(\d+)/, '$1 $2'),
      );
    }
    date = new Date(date);
  }
  const o: Dict<number> = {
    'M+': date.getMonth() + 1, // 月份
    'd+': date.getDate(), // 日
    'h+': date.getHours(), // 24进制小时
    'H+': date.getHours() > 12 ? date.getHours() - 12 : date.getHours(), // 12进制小时
    'm+': date.getMinutes(), // 分
    's+': date.getSeconds(), // 秒
    'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
    S: date.getMilliseconds(), // 毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt
      .toString()
      .replace(RegExp.$1, String(date.getFullYear()).substr(4 - RegExp.$1.length));
  }
  for (const k in o) {
    if (isNumber(o[k]) && new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt
        .toString()
        .replace(
          RegExp.$1,
          (RegExp.$1.length === 1 ? o[k] : `00${o[k]}`.substr(String(o[k]).length)) as string,
        );
    }
  }
  return fmt;
}


export function isProxy(obj: any) {
  return Object.prototype.toString.call(obj) === "[object Proxy]";
}

export function isVoid(val: any): boolean {
  return isNil(val) || val === '' || (isNumber(val) && isNaN(val));
}

export function isEmpty(target: Dict<any>): boolean {
  for (const index in target) {
    if (!isVoid(target[index])) {
      return false;
    }
  }
  return true;
}

export function isUndefined(val: any): boolean {
  return typeof val === 'undefined';
}

export function isNull(val: any): boolean {
  return val === null;
}

export function isNil(val: any): boolean {
  return isUndefined(val) || isNull(val);
}

export function isElement(val: any): boolean {
  return typeof HTMLElement === 'object'
    ? val instanceof HTMLElement
    : val && typeof val === 'object' && val.nodeType === 1 && typeof val.nodeName === 'string';
}

//清除 null undefined NaN ""
export function clearDirtyProps(obj: Dict<any>) {
  for (const index in obj) {
    if (isVoid(obj[index as any])) {
      delete obj[index];
    }
  }
}

export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function concatenate<T extends Uint8Array>(...arrays: T[]): T {
  let totalLength = 0;
  for (const arr of arrays) {
    if (arr) {
      totalLength += arr.length;
    }
  }
  let result;
  let offset = 0;
  for (const arr of arrays) {
    if (arr) {
      if (!result && isFunction((arr as any).constructor)) {
        result = new (arr as any).constructor(totalLength);
      }
      result.set(arr, offset);
      offset += arr.length;
    }
  }
  return result;
}

export function hash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString();
}