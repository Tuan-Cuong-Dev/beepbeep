import { Timestamp, FieldValue } from 'firebase/firestore';

export type AccessoryStatus =
  | 'in_stock'
  | 'in_use'
  | 'damaged'
  | 'lost'
  | 'retired';

export type AccessoryType = 'tracked' | 'bulk';

export interface Accessory {
  id: string;
  companyId: string;
  name: string;

  // Dạng theo loại:
  type: AccessoryType;

  // Dùng nếu loại là 'tracked' (có mã định danh riêng)
  code?: string;

  // Dùng nếu loại là 'bulk' (quản lý theo số lượng)
  quantity?: number;

  status: AccessoryStatus;

  importDate: Timestamp;
  importedDate?: Timestamp; // ✅ thêm dòng này
  exportDate?: Timestamp;
  notes?: string;
  updatedAt?: Timestamp | FieldValue; 
}
