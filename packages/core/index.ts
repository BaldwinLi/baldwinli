export { Emitter, type Option as EmitterOption } from './utils/emitter';
export { Inject } from './decorators/inject';
export { Provide, onCreatedService, type IService } from './utils/provide';
export * from './utils/utils';
import { CacheService, cookieStorage } from './services/cache-service';
export { HttpClient } from './services/http-client';
export { Service } from './decorators/service';
export { Autowired } from './decorators/autowired';
export { Advice } from './decorators/advice';
export { Store } from './decorators/store';
export { useAdvice } from './utils/use-advice';
export * from './utils/mobile-utils';
export * from './utils/math';

const cacheService = new CacheService();
export { cacheService, cookieStorage, CacheService };
