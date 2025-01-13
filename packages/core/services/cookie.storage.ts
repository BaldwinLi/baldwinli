import { PROJECT_KEY } from '../utils/util.schema';
export class CookieStorage implements Storage {
  private NAMESPACE = `${PROJECT_KEY}_`;
  private _keys: string[] = [];
  get length(): number {
    return this._keys.length;
  }

  get keys(): string[] {
    return this._keys;
  }

  public key(index: number): string | null {
    return this._keys[index];
  }

  public getItem(key: string): string | null {
    if (!key) {
      return null;
    }
    const value = this.getCookie(this.NAMESPACE + key);
    return value ? JSON.parse(value) : value;
  }

  public setItem(key: string, value: string): void {
    this._keys.push(key);
    this.setCookie(this.NAMESPACE + key, JSON.stringify(value), this.cookieExpiration(60));
  }

  public removeItem(key: string): void {
    this._keys.splice(
      this._keys.findIndex((e) => e === key),
      1,
    );
    this.setCookie(this.NAMESPACE + key, '', this.cookieExpiration(-100));
  }

  public clear(): void {
    for (const key of this._keys) {
      this.removeItem(key);
    }
    this._keys.length = 0;
  }

  private cookieExpiration(minutes: number) {
    const exp = new Date();
    exp.setTime(exp.getTime() + minutes * 60 * 1000);
    return exp;
  }

  private getCookie(key: string): string {
    const name = key + '=';
    const ca = document.cookie.split(';');
    for (const i in ca) {
      if (ca[i]) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
        }
      }
    }
    return '';
  }

  private setCookie(key: string, value: string, expirationDate: Date): void {
    const cookie =
      key + '=' + value + '; ' + 'expires=' + expirationDate.toUTCString() + '; secure; ';
    document.cookie = cookie;
  }
}
