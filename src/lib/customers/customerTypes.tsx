import { Timestamp } from 'firebase/firestore';

export interface Customer {
  id: string; // Firestore document ID
  userId: string; // Liên kết tới users.uid

  // Thông tin cơ bản
  name: string;
  email: string;
  phone: string;
  address: string;

  // Thông tin định danh
  idNumber: string; // CCCD/CMND/Passport
  driverLicense: string;
  nationality?: string;         // Quốc tịch
  sex?: 'male' | 'female' | 'other'; // ✅ chuẩn hóa
  dateOfBirth: Timestamp | null;

  placeOfOrigin?: string;       // Quê quán
  placeOfResidence?: string;    // Nơi thường trú

  // Liên kết công ty (nếu có)
  companyId?: string;

  // Mở rộng
  personalVehicleIds?: string[]; // Danh sách xe cá nhân (vehicleId)
  rentalHistoryIds?: string[];   // Lịch sử booking
  insuranceSubscriptions?: string[]; // Các gói bảo hiểm đã đăng ký

  createdAt: Date;
  updatedAt: Date;
}
