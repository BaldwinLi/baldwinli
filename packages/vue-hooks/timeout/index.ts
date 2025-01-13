import { nextTick } from "vue";

/**
 *
 * @description 组件与程序执行timeout
 * @param timeout时间戳
 */
export function timeout(timestamp?: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(async () => {
            await nextTick();
            resolve();
        }, timestamp);
    });
}
