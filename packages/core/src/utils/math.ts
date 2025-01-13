import Decimal from 'decimal.js';
// 数字除法运算, 修复js数学运算的精度问题
export function div(value: number | string, div: number): string {
  return (value as string) && new Decimal(value).div(div).toString();
}

// 数字乘法运算, 修复js数学运算的精度问题
export function multi(value: number | string, multi: number): string {
  return (value as string) && new Decimal(value).mul(multi).toString();
}
