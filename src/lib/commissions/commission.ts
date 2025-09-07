// Xữ lý hoa hồng cho CTV 
// Date : 07/09/2025

// src/lib/commissions/commission.ts

export type CommissionPolicy =
  | { mode: 'percent'; rate: number; min?: number; max?: number }
  | { mode: 'flat'; amount: number };

// ───────── Guards
export function isPercentPolicy(
  p: CommissionPolicy | null | undefined
): p is Extract<CommissionPolicy, { mode: 'percent' }> {
  return !!p && p.mode === 'percent';
}
export function isFlatPolicy(
  p: CommissionPolicy | null | undefined
): p is Extract<CommissionPolicy, { mode: 'flat' }> {
  return !!p && p.mode === 'flat';
}

// ───────── Chuẩn hoá policy từ nhiều schema
export function normalizeCommissionPolicy(raw: any): CommissionPolicy | null {
  if (!raw || typeof raw !== 'object') return null;

  // chuẩn mới
  if (raw.mode === 'percent' && isNumLike(raw.rate)) {
    const rate = clamp(toRate(raw.rate), 0, 1);
    const { min, max } = coerceMinMax(raw.min, raw.max);
    return { mode: 'percent', rate, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
  }
  if (raw.mode === 'flat' && isNumLike(raw.amount)) {
    return { mode: 'flat', amount: toMoney(raw.amount) };
  }

  // biến thể cũ
  if ((raw.mode === 'percent' || raw.type === 'percentage') && isNumLike(raw.value)) {
    const rate = clamp(toRate(raw.value), 0, 1);
    const { min, max } = coerceMinMax(raw.min, raw.max);
    return { mode: 'percent', rate, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
  }
  if ((raw.mode === 'flat' || raw.type === 'flat') && isNumLike(raw.value)) {
    return { mode: 'flat', amount: toMoney(raw.value) };
  }
  if (isNumLike(raw.rate) && (raw.mode === 'percent' || raw.type === 'percentage')) {
    const rate = clamp(toRate(raw.rate), 0, 1);
    const { min, max } = coerceMinMax(raw.min, raw.max);
    return { mode: 'percent', rate, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
  }

  return null;
}

// ───────── Tính tiền hoa hồng
export function computeCommission(policy: CommissionPolicy | null | undefined, base: number): number {
  const amountBase = Math.max(0, Number(base) || 0);
  if (!policy) return 0;

  if (isPercentPolicy(policy)) {
    const pct = clamp(policy.rate, 0, 1);
    let val = amountBase * pct;
    if (isNumLike(policy.min)) val = Math.max(val, Number(policy.min));
    if (isNumLike(policy.max)) val = Math.min(val, Number(policy.max));
    return roundCurrency(val); // cho VND → round 0 chữ số; nếu cần 2 chữ số thì đổi ROUND_DECIMALS=2
  }
  if (isFlatPolicy(policy)) {
    return roundCurrency(Math.max(0, Number(policy.amount) || 0));
  }
  return 0;
}

// ───────── Helpers
function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

const ROUND_DECIMALS = 0; // VND: làm tròn tới đồng. Nếu cần 2 chữ số: set 2.
function roundCurrency(n: number) {
  const f = Math.pow(10, ROUND_DECIMALS);
  return Math.round((n + Number.EPSILON) * f) / f;
}

function isNumLike(v: unknown): boolean {
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') return !Number.isNaN(parseNumberLike(v));
  return false;
}

// parse "100,000", "100.000", "10%" → number
function parseNumberLike(s: string): number {
  // tỉ lệ: "10%" → 10
  if (/%$/.test(s.trim())) {
    const raw = s.trim().replace('%', '');
    return Number(raw.replace(/[^\d.-]/g, '')) || 0;
  }
  // tiền/cs: bỏ mọi ký tự non-digit (giữ . -)
  return Number(s.replace(/[^\d.-]/g, '')) || 0;
}

// chuyển bất kỳ input rate thành [0..1]
function toRate(v: unknown): number {
  if (typeof v === 'number') return v > 1 ? v / 100 : v;
  if (typeof v === 'string') {
    const n = parseNumberLike(v);
    return n > 1 ? n / 100 : n;
  }
  return 0;
}

function toMoney(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseNumberLike(v);
  return 0;
}

// nhận min/max (có thể string), CHẤP NHẬN cả 0
function coerceMinMax(minIn: unknown, maxIn: unknown): { min?: number; max?: number } {
  const hasMin = isNumLike(minIn);
  const hasMax = isNumLike(maxIn);
  const min = hasMin ? toMoney(minIn as any) : undefined;
  const max = hasMax ? toMoney(maxIn as any) : undefined;

  // nếu min > max → hoán đổi để an toàn
  if (min !== undefined && max !== undefined && min > max) {
    return { min: max, max: min };
  }
  return { min, max };
}
