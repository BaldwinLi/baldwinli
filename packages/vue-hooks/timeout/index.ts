/**
 * timeout函数
 * @description 创建一个定时延迟的Promise，并在延迟结束后执行Vue的nextTick，确保DOM更新完成
 * @param timestamp 延迟时间（毫秒），可选参数
 * @returns 返回一个Promise，在指定时间后解析
 * @example
 * ```typescript
 * import { timeout } from '@baldwinli/vue-hooks';
 * 
 * // 延迟1000毫秒后执行
 * async function delayedOperation() {
 *   console.log('开始');
 *   await timeout(1000);
 *   console.log('1秒后执行，此时DOM已更新');
 * }
 * 
 * // 无延迟但等待DOM更新
 * async function waitForDomUpdate() {
 *   console.log('更新前');
 *   await timeout();
 *   console.log('DOM已更新');
 * }
 * ```
 */
export function timeout(timestamp?: number): Promise<void> {
    // 返回一个Promise，在指定时间后解析
    return new Promise((resolve) => {
        // 使用setTimeout进行定时延迟
        setTimeout(async () => {
            // 等待Vue的nextTick，确保DOM更新完成
            await nextTick();
            // 解析Promise，通知调用者延迟结束
            resolve();
        }, timestamp);
    });
}
