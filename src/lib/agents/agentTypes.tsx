// lib/agents/agentTypes.ts
// Update 04/09/2025
// lib/agents/agentTypes.ts

import { Timestamp, FieldValue, GeoPoint } from "firebase/firestore";
import type { LocationCore } from "@/src/lib/locations/locationTypes";

/** Agent: dùng LocationCore (geo bắt buộc để query theo bán kính) */
export interface Agent {
  id: string;
  ownerId: string;            // userId của người tạo
  name: string;
  email: string;
  phone: string;
  displayAddress: string;
  location: LocationCore;     // <- geo là GeoPoint BẮT BUỘC ở model thật
  businessType: "agent";
  createdAt: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}

/** Dữ liệu form khi tạo/sửa (không có id/ownerId/timestamps) */
export type AgentFormData = Omit<
  Agent,
  "id" | "ownerId" | "createdAt" | "updatedAt"
>;

/** Location dành cho FORM: cho phép thiếu geo */
export type LocationCoreEditable = Omit<LocationCore, "geo"> & {
  geo?: GeoPoint | null;      // <- khác biệt: cho phép null/undefined
};

/** State form: KHÔNG intersect với LocationCore (tránh làm geo bắt buộc) */
export type AgentFormState = Omit<
  Agent,
  "id" | "ownerId" | "createdAt" | "updatedAt" | "location"
> & {
  location: LocationCoreEditable; // <- dùng editable
};
