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
