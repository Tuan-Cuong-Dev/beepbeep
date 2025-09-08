// Chuẩn hóa việc chọn ngày toàn dự án Bíp Bíp

// Utils chuẩn hoá ngày cho toàn dự án theo yyyy-MM-dd
// Gọi DateField trong UI

/** parse "yyyy-MM-dd" -> Date|null (chính xác, không auto-correct) */
export function parseYMD(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
  const dt = new Date(y, mo, d);
  return (dt.getFullYear() === y && dt.getMonth() === mo && dt.getDate() === d) ? dt : null;
}

/** format Date -> "yyyy-MM-dd" */
export function fmtYMD(d: Date | null | undefined): string {
  if (!d || isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** check "yyyy-MM-dd" hợp lệ */
export function isYMD(s: string | null | undefined): boolean {
  return !!parseYMD(s || '');
}

/** clamp d theo min/max (nếu có) */
export function clampDate(d: Date, min?: Date | null, max?: Date | null): Date {
  let x = d;
  if (min && x < min) x = min;
  if (max && x > max) x = max;
  return x;
}
