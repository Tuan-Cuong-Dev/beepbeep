// Cập nhật ngày 8/07/2025 - Cho phép mở rộng thêm các tính năng quan trọng cần xây.

import { Timestamp } from 'firebase/firestore';

export interface UserPreferences {
  language: string;
  region: string;
  currency?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  updatedAt: Timestamp;
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

  // Phân quyền
  role: string; // hoặc roles?: string[] nếu cần đa vai trò

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

  // Thời gian
  createdAt: Date;
  updatedAt: Date;
}
