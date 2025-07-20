// Tự động tạo mã giới thiệu khi người dùng có CCCD

export function generateReferralCode(idNumber?: string): string | undefined {
  if (!idNumber) return undefined;
  return idNumber.trim().toUpperCase(); // Bạn có thể dùng toLowerCase() tùy ý
}
