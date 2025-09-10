// Chuẩn hóa việc tính hoa hồng
// Helpers: chuẩn hoá & tính commission

import type {
  CommissionPolicy,
  Program,
  ProgramModelCommission,
  CommissionAudience,
} from '@/src/lib/programs/rental-programs/programsType';

/* Guards */
export const isPercentPolicy = (p?: CommissionPolicy | null): p is Extract<CommissionPolicy, { mode: 'percent' }> =>
  !!p && p.mode === 'percent';
export const isFlatPolicy = (p?: CommissionPolicy | null): p is Extract<CommissionPolicy, { mode: 'flat' }> =>
  !!p && p.mode === 'flat';

/** Làm tròn VND (0 chữ số) */
const roundVND = (n: number) => Math.round((n + Number.EPSILON));

/** Tính số tiền commission từ policy và base (base = tổng tiền booking sau giảm giá, đề xuất) */
export function computeCommissionAmount(policy: CommissionPolicy | null | undefined, baseAmount: number): number {
  const base = Math.max(0, Number(baseAmount) || 0);
  if (!policy) return 0;

  if (isPercentPolicy(policy)) {
    const pct = Math.max(0, Math.min(1, Number(policy.rate) || 0));
    let val = base * pct;
    if (typeof policy.min === 'number') val = Math.max(val, policy.min);
    if (typeof policy.max === 'number') val = Math.min(val, policy.max);
    return roundVND(val);
  }
  if (isFlatPolicy(policy)) {
    return roundVND(Math.max(0, Number(policy.amount) || 0));
  }
  return 0;
}

/** Lấy commission policy theo model + audience từ Program */
export function pickModelCommissionPolicy(
  program: Program | null | undefined,
  modelId: string,
  audience: CommissionAudience // 'agent' | 'dealer'
): CommissionPolicy | null {
  if (!program || !Array.isArray(program.modelCommissions)) return null;
  const row: ProgramModelCommission | undefined = program.modelCommissions.find(m => m?.modelId === modelId);
  if (!row) return null;
  return (row as any)?.[audience] ?? null;
}

/** Tiện ích: chọn policy theo list program (ưu tiên theo trạm nếu bạn có logic ưu tiên) */
export function pickCommissionPolicyFromPrograms(
  programs: Program[],
  modelId: string,
  audience: CommissionAudience,
  stationId?: string
): { program?: Program; policy?: CommissionPolicy | null } {
  // (1) Ưu tiên program target đúng station (nếu có)
  const targeted = stationId
    ? programs.filter(p => (p.stationTargets ?? []).some(t => t?.stationId === stationId))
    : [];
  const general = programs.filter(p => (p.stationTargets ?? []).length === 0);

  for (const p of [...targeted, ...general]) {
    const policy = pickModelCommissionPolicy(p, modelId, audience);
    if (policy) return { program: p, policy };
  }
  return { program: undefined, policy: null };
}
