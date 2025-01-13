export type Constructable<T> = new (...args: any) => T;
export const PROJECT_KEY = 'GENLITEX';
export const MICRO_FRONT_END_MAIN = 'MICRO-FRONT-END-MAIN';
export const ProvideScopeKeys = {
  Root: 'root',
  Self: 'self',
  Main: 'main',
};

export interface IProviderConfigure {
  provideScope?: 'root' | 'self' | 'main';
  namespace?: string;
}
export interface Description {
  configurable: boolean;
  enumerable: string;
  initializer: any;
  writable: boolean;
}

export const NAMESPACE = `${PROJECT_KEY}_COMMON`;
