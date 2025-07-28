// Ánh xạ loại hình dịch vụ tương ứng với doanh nghiệp

// 🔄 lib/organizations/serviceCategoryMapping.ts

export type OrganizationType =
  | 'rental_company'
  | 'technician_partner'
  | 'agent'
  | 'private_provider'
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';

export type ServiceCategoryKey =
  | 'repair'
  | 'rental'
  | 'battery'
  | 'transport'
  | 'care'
  | 'legal';

export const serviceCategoriesByOrgType: Record<OrganizationType, ServiceCategoryKey[]> = {
  rental_company: ['rental', 'battery', 'legal'],
  technician_partner: ['repair', 'battery'],
  agent: ['rental'],
  private_provider: ['rental'],
  intercity_bus: ['rental'],
  vehicle_transport: ['transport'],
  tour_guide: ['rental'], // hoặc tạo riêng category 'tour' nếu có UI tương ứng
};
