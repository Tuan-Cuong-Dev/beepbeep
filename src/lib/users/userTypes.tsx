export interface UserPreferences {
  language: string;
  region: string;
  currency?: string;
}

export interface User {
  uid: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  phone: string;
  photoURL: string;
  role: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  homeAirport: string;
  createdAt: Date;
  updatedAt: Date;

  preferences?: UserPreferences; // ✅ Thêm dòng này
}
