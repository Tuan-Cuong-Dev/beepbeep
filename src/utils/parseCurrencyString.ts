'use client';

/**
 * Parse chuỗi tiền (ví dụ '1.250.000 ₫') thành số nguyên 1250000
 * @param value - Chuỗi cần parse
 * @returns Giá trị số nguyên
 */
export function parseCurrencyString(value: string): number {
  if (!value) return 0;

  // Xóa toàn bộ dấu chấm, ký tự không phải số
  const numericString = value.replace(/[^\d]/g, '');

  const number = parseInt(numericString, 10);

  return isNaN(number) ? 0 : number;
}
