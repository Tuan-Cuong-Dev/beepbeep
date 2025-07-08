// Đã định nghĩa gộp ở rentalCompanyTypes.tsx
export interface PrivateOwner {
  id: string;
  userId: string;

  name: string;
  phone: string;

  vehiclesOwned: string[]; // ebikeIds
  rentalAgreements?: string[];

  createdAt: Date;
  updatedAt: Date;
}
