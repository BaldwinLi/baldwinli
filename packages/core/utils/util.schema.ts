/**
 * 构造函数类型，用于表示任何可以使用new关键字实例化的类
 * @template T 实例类型
 */
export type Constructable<T> = new (...args: any) => T;
/**
 * 项目标识键，用于全局命名空间和缓存键前缀
 */
export const PROJECT_KEY = 'GENLITEX';
/**
 * 微前端主应用标识
 */
export const MICRO_FRONT_END_MAIN = 'MICRO-FRONT-END-MAIN';
/**
 * 提供者作用域键集合
 * - Root: 根作用域，全局共享
 * - Self: 自身作用域，当前应用实例内共享
 * - Main: 主应用作用域，在微前端架构中主应用内共享
 */
export const ProvideScopeKeys = {
  Root: 'root',
  Self: 'self',
  Main: 'main',
};

/**
 * 提供者配置接口
 */
export interface IProviderConfigure {
  /**
   * 提供作用域，可选值：root、self、main
   */
  provideScope?: 'root' | 'self' | 'main';
  
  /**
   * 自定义命名空间，当provideScope为root时有效
   */
  namespace?: string;
}
/**
 * 属性描述符接口
 */
export interface Description {
  /**
   * 是否可配置
   */
  configurable: boolean;
  
  /**
   * 是否可枚举
   */
  enumerable: string;
  
  /**
   * 属性初始化器
   */
  initializer: any;
  
  /**
   * 是否可写
   */
  writable: boolean;
}

/**
 * 公共命名空间，用于共享服务和数据
 */
export const NAMESPACE = `${PROJECT_KEY}_COMMON`;
