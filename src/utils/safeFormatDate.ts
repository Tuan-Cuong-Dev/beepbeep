// utils/safeFormatDate.ts
import { format } from "date-fns";

/**
 * Định dạng an toàn một giá trị ngày tháng (Date, Timestamp, string, number).
 * Luôn trả về string hiển thị được, tránh crash trên mobile.
 *
 * @param value - Date, Firestore Timestamp, số (ms), hoặc string
 * @param formatStr - Mặc định "yyyy-MM-dd" (thân thiện mobile)
 */
export function safeFormatDate(value: any, formatStr = "yyyy-MM-dd"): string {
  if (!value) return "—";

  let date: Date | null = null;

  try {
    if (typeof value?.toDate === "function") {
      // Firestore Timestamp
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      }
    }
  } catch {
    return "—";
  }

  if (!date || isNaN(date.getTime())) return "—";

  try {
    return format(date, formatStr);
  } catch {
    // fallback nếu formatStr không hợp lệ
    return date.toISOString().split("T")[0]; // yyyy-MM-dd
  }
}
