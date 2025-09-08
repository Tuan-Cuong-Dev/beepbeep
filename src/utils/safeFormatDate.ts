// utils/safeFormatDate.ts
// Bỏ dần vì nó ko cho phép chọn ngay trên input
// làm người dùng khó hiểu - sẽ cho thay bằng dateYMD.ts từ 08/09/2025
// Gọi DateField trong UI

import { format as dfFormat } from 'date-fns';

/** Firestore Timestamp tối giản (để không phải import sdk ở layer utils) */
type FirestoreTimestampLike = { toDate: () => Date };

/** Chuẩn hoá mọi input về Date | null */
export function toDateSafe(value: unknown): Date | null {
  if (!value) return null;

  try {
    // Firestore Timestamp
    if (typeof (value as FirestoreTimestampLike)?.toDate === 'function') {
      const d = (value as FirestoreTimestampLike).toDate();
      return isNaN(d.getTime()) ? null : d;
    }

    // Date instance
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? null : value;
    }

    // number | string
    if (typeof value === 'number') {
      // hỗ trợ cả giây và mili-giây
      const ms = value < 1e12 ? value * 1000 : value;
      const d = new Date(ms);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'string') {
      const raw = value.trim();
      if (!raw) return null;
      // Cho phép "yyyy-MM-dd", ISO, hoặc string date hợp lệ của JS
      const d = new Date(raw);
      return isNaN(d.getTime()) ? null : d;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Định dạng an toàn một giá trị ngày tháng (Date, Firestore Timestamp, string, number).
 * Luôn trả về string hiển thị được, tránh crash trên mobile / môi trường thật.
 *
 * @param value    Date | FirestoreTimestamp | string | number (ms/seconds)
 * @param pattern  Mặc định "yyyy-MM-dd" (thân thiện mobile & đồng bộ input)
 */
export function safeFormatDate(value: unknown, pattern = 'yyyy-MM-dd'): string {
  const date = toDateSafe(value);
  if (!date) return '—';

  try {
    return dfFormat(date, pattern);
  } catch {
    // Fallback nếu pattern không hợp lệ
    return date.toISOString().split('T')[0]; // yyyy-MM-dd
  }
}
