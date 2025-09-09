// Lấy giá bất chấp format

// src/utils/price.ts
import { formatCurrency } from "@/src/utils/formatCurrency";

/** Trả về số (VND) hoặc null nếu không tìm được. */
export function pickVehiclePrice(vehicle: any, model?: any): number | null {
  // Ưu tiên theo vehicle → fallback sang model (nếu truyền vào)
  const candidates: any[] = [
    vehicle?.pricePerDay,
    vehicle?.price,
    vehicle?.prices?.default,
    model?.pricePerDay,
    model?.price,
    model?.prices?.default,
  ].filter((v) => v !== undefined && v !== null);

  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      // Chịu chuỗi "350.000", "350,000", "350000", "350 000"
      const num = Number(v.replace(/[^\d.-]/g, ""));
      if (Number.isFinite(num)) return num;
    }
  }
  return null;
}

/** Text hiển thị sẵn sàng render. */
export function priceText(vehicle: any, model?: any, empty = "—"): string {
  const p = pickVehiclePrice(vehicle, model);
  if (p == null) {
    console.warn("[priceText] Missing/invalid price", {
      vehicleId: vehicle?.id,
      raw: {
        pricePerDay: vehicle?.pricePerDay,
        price: vehicle?.price,
        prices: vehicle?.prices,
      },
      modelPrice: {
        pricePerDay: model?.pricePerDay,
        price: model?.price,
        prices: model?.prices,
      },
    });
    return empty;
  }
  return formatCurrency(p);
}
