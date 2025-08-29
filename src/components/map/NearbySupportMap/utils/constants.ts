// Tránh import vòng qua index.tsx
export const DEFAULT_CENTER: [number, number] = [16.047079, 108.20623]; // Đà Nẵng
export const DEFAULT_ZOOM = 13;

// (tuỳ chọn) màu trạng thái nếu muốn dùng chung cho Legend
export const STATUS_COLOR: Record<string, string> = {
  pending: '#ef4444',
  assigned: '#fb923c',
  proposed: '#f59e0b',
  confirmed: '#10b981',
  rejected: '#f43f5e',
  in_progress: '#6366f1',
  resolved: '#9333ea',
  closed: '#6b7280',
};
