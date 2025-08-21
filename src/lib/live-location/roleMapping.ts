// lib/live-location/roleMapping.ts
// Phân tích & quyết định có nên cập nhật vị trí live khi vào dashboard hay không.

import type { BusinessType } from '@/src/lib/my-business/businessTypes';

type PageBusinessType =
  | 'admin' | 'technician_assistant' | 'technician_partner'
  | 'rental_company_owner' | 'private_provider' | 'agent'
  | 'company_admin' | 'station_manager' | 'staff' | 'technician' | null;

type StaffLite = { companyId?: string | null; role?: string | null };

export function resolveBusinessContext(input: {
  pageBusinessType: PageBusinessType;
  staffRoles?: StaffLite[];
  /** Nếu là technician_partner, có thể truyền id để gán làm entityId */
  technicianPartnerId?: string | null;
}) {
  const { pageBusinessType, staffRoles, technicianPartnerId } = input;

  let businessType: BusinessType | null = null;

  switch (pageBusinessType) {
    case 'technician_partner':
      businessType = 'technician_partner';
      break;
    case 'private_provider':
      businessType = 'private_provider';
      break;
    case 'agent':
      businessType = 'agent';
      break;
    case 'rental_company_owner':
    case 'company_admin':
    case 'station_manager':
    case 'staff':
    case 'technician':
      businessType = 'rental_company';
      break;
    // admin & technician_assistant không theo dõi vị trí
    case 'admin':
    case 'technician_assistant':
    default:
      businessType = null;
  }

  const companyId =
    staffRoles && staffRoles.length > 0
      ? (staffRoles[0]?.companyId ?? null)
      : null;

  const entityId =
    pageBusinessType === 'technician_partner'
      ? (technicianPartnerId ?? null)
      : null;

  return { businessType, companyId, entityId };
}

/**
 * Quyết định có nên kích hoạt cập nhật vị trí live khi user vào dashboard hay không.
 * - TechnicianPartner: chỉ track nếu type === 'mobile'
 * - Rental company: mặc định chỉ track khi vai trò nhân sự là 'technician' (thường xuyên di chuyển)
 * - Các nhóm inherently-mobility: agent / tour_guide / vehicle_transport / intercity_bus → track
 * - Private provider: tuỳ cấu hình (mặc định KHÔNG track trừ khi bạn bật cờ)
 */
export function shouldTrackLiveLocation(ctx: {
  businessType: BusinessType | null;
  pageBusinessType: PageBusinessType;
  staffRoles?: StaffLite[];

  /** Chỉ áp dụng khi pageBusinessType === 'technician_partner' */
  technicianPartnerType?: 'shop' | 'mobile' | null;

  /** Tuỳ chọn: nếu chủ private_provider cũng hay di chuyển (ship/đi giao), bật true */
  privateProviderIsMobile?: boolean;
}) {
  const { businessType } = ctx;
  if (!businessType) return false;

  switch (businessType) {
    case 'technician_partner':
      // ✅ Chỉ track khi là mobile
      return ctx.technicianPartnerType === 'mobile';

    case 'agent':
    case 'tour_guide':
    case 'vehicle_transport':
    case 'intercity_bus':
      // ✅ Bản chất công việc di chuyển
      return true;

    case 'private_provider':
      // Mặc định false; bật nếu mô hình của bạn có di chuyển
      return ctx.privateProviderIsMobile === true;

    case 'rental_company': {
      // Tinh chỉnh: chỉ track khi nhân sự là kỹ thuật (thường chạy hiện trường)
      const staffRole = (ctx.staffRoles?.[0]?.role ?? '').toLowerCase();
      return staffRole === 'technician';
    }

    default:
      return false;
  }
}
