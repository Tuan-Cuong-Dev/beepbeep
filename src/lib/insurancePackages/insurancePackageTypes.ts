// Gói bảo hiểm dành riêng cho từng xe va từng khách hàng

export interface InsurancePackage {
  id: string;
  userId: string;
  vehicleId?: string; // chỉ có sau khi kích hoạt
  packageCode: string; // ví dụ: BIP365-DE01-9023-X7F2
  frameNumber?: string;
  engineNumber?: string;
  plateNumber?: string;
  isActive: boolean;
  activationMethod: 'manual' | 'auto';
  activatedAt?: FirebaseFirestore.Timestamp;
  expiredAt?: FirebaseFirestore.Timestamp;
  imageUrl?: string; // ảnh PNG cá nhân hoá
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  note?: string;
}

