// Ánh xạ loại hình dịch vụ tương ứng với doanh nghiệp

// 🔄 lib/organizations/serviceCategoryMapping.ts
export const serviceCategoriesByOrgType: Record<string, string[]> = {
  rental_company: ['rental', 'maintenance', 'insurance', 'battery_swap'],
  technician_partner: ['repair', 'maintenance', 'diagnostics'],
  agent: ['rental'],
  private_owner: ['rental'],
  intercity_bus: ['rental'],
  tour_guide: ['tour_service'],
  vehicle_transport: ['transport'],
};
