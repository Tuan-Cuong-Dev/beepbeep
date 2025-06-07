// utils/safeFormatDate.ts
import { format } from "date-fns";

export function safeFormatDate(value: any, formatStr = "dd/MM/yyyy") {
  if (!value) return "N/A";

  let date: Date | null = null;

  if (typeof value?.toDate === "function") {
    date = value.toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  }

  if (!date || isNaN(date.getTime())) return "N/A";

  return format(date, formatStr);
}
