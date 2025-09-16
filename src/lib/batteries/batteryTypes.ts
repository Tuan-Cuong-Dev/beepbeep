// Các trường dữ liệu của 1 viên pin ở mức cơ bản
// Khi phát triển thành trạm Bíp Bíp thì sẽ chi tiết hơn rất nhiều

export type Battery = {
  id: string;
  companyId: string; // 🔗 Liên kết với RentalCompany hoặc PrivateOwner
  batteryCode: string;
  physicalCode?: string;
  importDate: any; // Firestore Timestamp
  exportDate?: any; // Firestore Timestamp
  status: 'in_stock' | 'in_use' | 'returned' | 'maintenance';
  notes?: string;
};
