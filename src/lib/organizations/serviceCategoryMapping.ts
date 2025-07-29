// ✅ Các danh mục dịch vụ trong hệ thống
export type ServiceCategoryKey =
  | 'repair'
  | 'rental'
  | 'battery'
  | 'transport'
  | 'care'
  | 'legal';

  // Chú ý Phần legal sau này có thể khai thác riêng cho team bảo hiểm sau. Ko bỏ vào đây

// ✅ Các loại hình tổ chức / doanh nghiệp (đơn giản hóa kỹ thuật viên)
export type OrganizationType =
  | 'rental_company'
  | 'private_provider'
  | 'agent'
  | 'technician_partner' // ✅ gom mobile/shop vào chung
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';

// ✅ Thêm mapping riêng theo subtype
export type TechnicianSubtype = 'mobile' | 'shop';

// ✅ Bản ánh xạ dịch vụ chính
export const serviceCategoriesByOrgType: Record<OrganizationType, ServiceCategoryKey[]> = {
  rental_company: ['rental', 'battery'],
  private_provider: ['rental'],
  agent: ['rental'],
  intercity_bus: ['rental'],
  vehicle_transport: ['transport'],
  tour_guide: ['rental'],
  technician_partner: [], // tạm bỏ trống, sẽ xử lý bằng subtype
};

// ✅ Mapping riêng cho technicianPartner theo subtype
export const serviceCategoriesByTechnicianSubtype: Record<TechnicianSubtype, ServiceCategoryKey[]> = {
  mobile: ['repair', 'battery'],
  shop: ['repair', 'battery', 'care'],
};
