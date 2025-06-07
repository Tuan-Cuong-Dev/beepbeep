// Công ty EMOVE
import { Role } from '@/src/components/rent/emove/useRentBikeForm';

export function convertRoleToDisplayRole(rawRole: string): Role {
  const normalized = rawRole
    .toLowerCase()
    .replace(/\s+/g, '_') // chuyển khoảng trắng thành gạch dưới
    .trim();

  const mapping: Record<string, Role> = {
    staff: 'Staff',
    customer: 'Customer',
    station_manager: 'Station Manager',
    company_owner: 'Company Owner',
    private_owner: 'Private Owner',
    agent: 'Agent',
    technician: 'Technician',
    investor: 'Investor',
    admin: 'Admin',
  };

  return mapping[normalized] || 'Customer'; // fallback an toàn
}
