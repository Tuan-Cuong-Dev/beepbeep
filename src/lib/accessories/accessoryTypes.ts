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

  type: AccessoryType;

  // Nếu là 'tracked' (có mã riêng)
  code?: string;

  // Nếu là 'bulk' (quản lý theo số lượng)
  quantity?: number;

  status: AccessoryStatus;

  importDate: Timestamp;
  importedDate?: Timestamp;
  exportDate?: Timestamp;

  importPrice?: number; // 💰 Giá nhập
  retailPrice?: number; // 💰 Giá bán

  notes?: string;
  updatedAt?: Timestamp | FieldValue;
}
