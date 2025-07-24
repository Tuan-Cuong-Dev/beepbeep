import { Timestamp, FieldValue } from 'firebase/firestore';

export type VehicleType = 'car' | 'motorbike';

export type PlaceType = 'cafe' | 'restaurant' | 'home' | 'shop';

export interface BatteryChargingStation {
  id: string;

  // Thông tin địa điểm
  name: string;
  displayAddress: string;
  mapAddress: string;
  phone: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  vehicleType?: VehicleType;
  placeType?: PlaceType; // Loại hình địa điểm (quán cafe, quán ăn...)

  // Thông tin sạc
  chargingPorts?: number;
  chargingPowerKW?: number;
  chargingStandard?: string;
  openHours?: string;
  isActive: boolean;

  // Giá và chính sách sạc
  pricingNotes?: string; // Chuỗi mô tả giá linh hoạt
  pricingOptions?: Record<string, string>; // Ex: { "over50": "10k", "under50": "15k" }
  comboPackages?: string[]; // Ex: ["Combo: Cơm + Nước + Sạc = 68k"]
  additionalFeePolicy?: string; // Ex: "Phụ thu 10k nếu không ăn uống"
  offersPortableCharger?: boolean; // Có cho thuê cục sạc không

  // Tiện ích đi kèm
  restAreaAvailable?: boolean; // Có ghế nằm/nghỉ
  freeDrinks?: boolean; // Có trà đá miễn phí
  foodMenu?: string[]; // Ex: ["Cơm trưa", "Mì bò trứng"]
  drinkMenu?: string[]; // Ex: ["Cafe", "Cam ép", "Nước dừa"]

  // Metadata
  createdBy?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
