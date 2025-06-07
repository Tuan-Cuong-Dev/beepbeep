import { Timestamp } from "firebase/firestore";

// Convert string (ex: '2025-05-06') => Timestamp
export function stringToTimestamp(dateString?: string): Timestamp | null {
  if (!dateString) return null;
  return Timestamp.fromDate(new Date(dateString + "T00:00:00"));
}

// Convert Timestamp => string (ex: '2025-05-06') để bind vào Input type="date"
export function timestampToString(timestamp?: Timestamp | null): string {
  if (!timestamp) return '';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  return date.toISOString().split('T')[0]; // 'YYYY-MM-DD'
}

// ✅ Convert Timestamp => string chuẩn input type="datetime-local"
export function timestampToDatetimeLocal(timestamp?: any): string {
  if (!timestamp) return '';
  const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}
