import type { Timestamp } from "firebase/firestore";
import type { GeoPoint } from "firebase/firestore";

/** State dùng trong Form — cho phép thiếu geo khi đang nhập */
export type PrivateProviderFormState = {
  id?: string;
  ownerId?: string;
  name?: string;
  email?: string;
  phone?: string;

  displayAddress?: string;

  location?: {
    geo?: GeoPoint;          // <- có thể thiếu trong lúc nhập
    location?: string;       // "lat,lng" dạng chuỗi
    mapAddress?: string;     // link / mô tả
    address?: string;        // địa chỉ text
    updatedAt?: Timestamp;
  };

  businessType?: "private_provider"; // không cần nhập
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
