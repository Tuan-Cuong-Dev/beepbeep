// 📁 lib/users/userTypes.ts
import type { AddressCore } from '@/src/lib/locations/addressTypes';
import type { UserLocation } from '@/src/lib/locations/locationTypes'; // cập nhật import
import { Timestamp } from 'firebase/firestore';

export interface UserPreferences {
  language: string;
  region: string;
  currency?: string;
}

export interface User {
  uid: string;

  // Thông tin
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;
  companyId?: string;
  role: string;

  // ✅ Địa chỉ hồ sơ (tĩnh) – có cấu trúc, dễ i18n / thuế / shipping
  profileAddress?: AddressCore;

  // ✈️ tuỳ chọn
  homeAirport?: string;

  preferences?: UserPreferences;

  // Mở rộng
  idNumber?: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  coverURL?: string;

  // 🚨 Vị trí gần nhất (động)
  lastKnownLocation?: UserLocation;

  // Đóng góp
  contributionPoints?: number;
  contributionLevel?: 1 | 2 | 3;
  totalContributions?: number;

  // Referral
  referralCode?: string;
  referredBy?: string;
  referralPoints?: number;
  totalReferrals?: number;

  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}
