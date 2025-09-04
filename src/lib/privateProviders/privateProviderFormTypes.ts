import type { Timestamp, GeoPoint, FieldValue } from "firebase/firestore";

/** State dùng trong Form — cho phép thiếu geo khi đang nhập */
export type PrivateProviderFormState = {
  id?: string;
  ownerId?: string;
  name?: string;
  email?: string;
  phone?: string;

  displayAddress?: string;

  location?: {
    geo?: GeoPoint;                 // có thể thiếu trong lúc nhập
    location?: string;              // "lat,lng"
    mapAddress?: string;            // link / mô tả
    address?: string;               // địa chỉ text
    updatedAt?: Timestamp | FieldValue; // 👈 cho phép FieldValue
  };

  businessType?: "private_provider";
  createdAt?: Timestamp | FieldValue;   // 👈 cho phép FieldValue
  updatedAt?: Timestamp | FieldValue;   // 👈 cho phép FieldValue
};
