// Địa chỉ tĩnh (chuẩn, có cấu trúc)
// Đây là dữ liệu dành riêng cho User (Người dùng)

// 📁 lib/common/addressTypes.ts
export interface AddressCore {
  line1?: string;         // số nhà/đường
  line2?: string;         // căn hộ, toà nhà, …
  locality?: string;      // city/town
  adminArea?: string;     // state/province/region
  postalCode?: string;    // zip/postal code
  countryCode?: string;   // ISO 3166-1 alpha-2, ví dụ "US", "VN"
  formatted?: string;     // tuỳ chọn: nguyên văn để hiển thị
}
