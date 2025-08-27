// Kiểm tra users có phải là kỹ thuật viên lưu động ko ?

// src/utils/isMobileTechnician.ts
'use client';

import type { User } from '@/src/lib/users/userTypes';

export function isMobileTechnician(user?: Partial<User> | null): boolean {
  if (!user) return false;

  // Kiểm tra theo field business
  const business: any = (user as any).business || {};

  const type = String(business.type || '').toLowerCase();
  const subtype = String(business.subtype || '').toLowerCase();

  return type === 'technician_partner' && subtype === 'mobile';
}
