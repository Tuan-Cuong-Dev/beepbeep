// 📁 lib/organizations/serviceCategories.ts

// ✅ Các danh mục dịch vụ trong hệ thống
export type ServiceCategoryKey =
  | 'repair'
  | 'rental'
  | 'battery'
  | 'transport'
  | 'care'
  | 'legal'; // ⚠️ phần legal sau này có thể dành cho team bảo hiểm

// ✅ Các loại hình tổ chức / doanh nghiệp (11 loại đồng bộ với BusinessType)
export type OrganizationType =
  | 'rental_company'
  | 'private_provider'
  | 'agent'
  | 'technician_partner'
  | 'city_driver'
  | 'intercity_driver'
  | 'delivery_partner'
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';

// ✅ Thêm mapping riêng theo subtype
export type TechnicianSubtype = 'mobile' | 'shop';

// ✅ Bản ánh xạ dịch vụ chính cho từng loại hình
export const serviceCategoriesByOrgType: Record<OrganizationType, ServiceCategoryKey[]> = {
  rental_company: ['rental', 'battery'],
  private_provider: ['rental'],
  agent: ['rental'],
  city_driver: ['transport'],
  intercity_driver: ['transport'],
  delivery_partner: ['transport'],
  intercity_bus: ['rental'],
  vehicle_transport: ['transport'],
  tour_guide: ['rental'],
  technician_partner: [], // tạm bỏ trống, xử lý riêng bằng subtype
};

// ✅ Mapping riêng cho technicianPartner theo subtype
export const serviceCategoriesByTechnicianSubtype: Record<TechnicianSubtype, ServiceCategoryKey[]> = {
  mobile: ['repair', 'battery'],
  shop: ['repair', 'battery', 'care'],
};
