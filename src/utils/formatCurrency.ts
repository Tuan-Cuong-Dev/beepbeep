'use client';

/**
 * Format số tiền thành dạng 1,000,000 ₫
 * @param value - Số tiền cần format
 * @returns Chuỗi số tiền đã format
 */
export function formatCurrency(value: number | string, locale: string = 'vi-VN', currency: string = 'VND'): string {
  const number = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(number)) return '0 ₫';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0, // không hiện số lẻ
  }).format(number);
}
