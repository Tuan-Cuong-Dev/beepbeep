// 📁 lib/users/userTypes.ts
import { Timestamp, GeoPoint } from 'firebase/firestore';

export interface UserPreferences {
  language: string;
  region: string;
  currency?: string;
}

export interface UserLocation {
  geo: GeoPoint;                 // ⬅️ thay thế lat/lng number
  address?: string;
  updatedAt: Timestamp;
  // Optional tiện lợi:
  location?: string;             // "lat,lng"
}

export interface User {
  uid: string;

  // Thông tin cá nhân
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;

  // Làm việc tại công ty nào ?
  companyId?: string;

  // Phân quyền
  role: string;

  // Địa chỉ tĩnh
  address: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;

  homeAirport?: string;

  // Tuỳ chọn hệ thống
  preferences?: UserPreferences;

  // Mở rộng dữ liệu cá nhân
  idNumber?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  coverURL?: string;

  // 🚨 Vị trí gần nhất được hệ thống ghi nhận
  lastKnownLocation?: UserLocation;

  // 🎯 TÍNH NĂNG ĐÓNG GÓP
  contributionPoints?: number;
  contributionLevel?: 1 | 2 | 3;
  totalContributions?: number;

  // 📣 MÃ GIỚI THIỆU
  referralCode?: string;
  referredBy?: string;
  referralPoints?: number;
  totalReferrals?: number;

  // Thời gian
  createdAt: Date;
  updatedAt: Date;
}
