"use client";

import { useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { PrivateProvider } from "@/src/lib/privateProviders/privateProviderTypes";
import type { PrivateProviderFormState } from "@/src/lib/privateProviders/privateProviderFormTypes";
import { GeoPoint, serverTimestamp } from "firebase/firestore";

/* -------- Helpers -------- */

function parseLatLngString(s?: string): [number, number] | null {
  if (!s) return null;
  const parts = s.split(",").map((p) => p.trim());
  if (parts.length !== 2) return null;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return [lat, lng];
}

/** Biến formState -> payload Partial<PrivateProvider> (đúng schema LocationCore) */
function buildSubmitPayload(form: Partial<PrivateProviderFormState>): Partial<PrivateProvider> {
  const locState = form.location || {};
  let geo = locState.geo;

  // Nếu người dùng chỉ nhập "lat,lng" mà chưa có GeoPoint -> dựng GeoPoint
  if (!geo && locState.location) {
    const parsed = parseLatLngString(locState.location);
    if (parsed) {
      geo = new GeoPoint(parsed[0], parsed[1]);
    }
  }

  const location =
    geo || locState.location || locState.mapAddress || locState.address
      ? {
          geo: geo!, // (có thể undefined — ta sẽ validate trước khi submit)
          location: locState.location,
          mapAddress: locState.mapAddress,
          address: locState.address,
          updatedAt: serverTimestamp(),
        }
      : undefined;

  const payload: Partial<PrivateProvider> = {
    id: form.id!,
    ownerId: form.ownerId!,
    name: form.name!,
    email: form.email!,
    phone: form.phone!,
    displayAddress: form.displayAddress!,
    location: location as any,
    businessType: "private_provider",
    updatedAt: serverTimestamp() as any,
  };

  return payload;
}

interface Props {
  initialData?: PrivateProvider; // khi edit
  onSubmit: (data: Partial<PrivateProvider>) => void;
  onCancel?: () => void;
}

export default function PrivateProviderForm({ initialData, onSubmit, onCancel }: Props) {
  // Map dữ liệu ban đầu (PrivateProvider) sang state form mềm dẻo
  const initialForm: Partial<PrivateProviderFormState> = useMemo(() => {
    if (!initialData) return {};
    return {
      id: initialData.id,
      ownerId: initialData.ownerId,
      name: initialData.name,
      email: initialData.email,
      phone: initialData.phone,
      displayAddress: initialData.displayAddress,
      location: {
        geo: initialData.location?.geo,
        location: initialData.location?.location,
        mapAddress: initialData.location?.mapAddress,
        address: initialData.location?.address,
        updatedAt: initialData.location?.updatedAt as any,
      },
      businessType: "private_provider",
      createdAt: initialData.createdAt,
      updatedAt: initialData.updatedAt,
    };
  }, [initialData]);

  const [form, setForm] = useState<Partial<PrivateProviderFormState>>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* ------ Handlers ------ */

  const handleChange = <K extends keyof PrivateProviderFormState>(
    key: K,
    value: PrivateProviderFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLocationChange = (key: "mapAddress" | "location" | "address", value: string) => {
    setForm((prev) => ({
      ...prev,
      location: {
        ...(prev.location || {}),
        [key]: value,
      },
    }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};

    if (!form.name || !form.name.trim()) e.name = "Vui lòng nhập tên.";
    if (!form.phone || !form.phone.trim()) e.phone = "Vui lòng nhập số điện thoại.";
    if (!form.displayAddress || !form.displayAddress.trim())
      e.displayAddress = "Vui lòng nhập địa chỉ hiển thị.";

    // Location: chấp nhận một trong các cách: có geo sẵn, hoặc parse được từ location "lat,lng"
    const loc = form.location;
    let geoOk = !!loc?.geo;
    if (!geoOk && loc?.location) {
      geoOk = !!parseLatLngString(loc.location);
    }
    if (!geoOk) {
      e.location = "Nhập tọa độ Lat,Lng hợp lệ (vd: 16.0613026,108.2110477) hoặc chọn geo.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = buildSubmitPayload(form);
    // Đảm bảo location.geo có thật trước khi submit
    if (!payload.location?.geo) {
      // (Phòng hờ: validate đã chặn, nhưng ta thêm guard cho chắc)
      setErrors((prev) => ({
        ...prev,
        location: "Thiếu GeoPoint hợp lệ cho vị trí.",
      }));
      return;
    }
    onSubmit(payload);
  };

  /* ------ UI ------ */

  return (
    <div className="space-y-3 p-4">
      <div>
        <Input
          placeholder="Tên nhà cung cấp"
          value={form.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
        />
        {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
      </div>

      <Input
        placeholder="Email"
        value={form.email || ""}
        onChange={(e) => handleChange("email", e.target.value)}
      />
      <div>
        <Input
          placeholder="Số điện thoại"
          value={form.phone || ""}
          onChange={(e) => handleChange("phone", e.target.value)}
        />
        {errors.phone && <p className="text-red-600 text-xs mt-1">{errors.phone}</p>}
      </div>

      <div>
        <Input
          placeholder="Địa chỉ hiển thị"
          value={form.displayAddress || ""}
          onChange={(e) => handleChange("displayAddress", e.target.value)}
        />
        {errors.displayAddress && (
          <p className="text-red-600 text-xs mt-1">{errors.displayAddress}</p>
        )}
      </div>

      {/* LocationCore (form-state version) */}
      <Input
        placeholder="Google Maps link hoặc mô tả địa chỉ"
        value={form.location?.mapAddress || ""}
        onChange={(e) => handleLocationChange("mapAddress", e.target.value)}
      />
      <div>
        <Input
          placeholder="Lat,Lng (vd: 16.0613026,108.2110477)"
          value={form.location?.location || ""}
          onChange={(e) => handleLocationChange("location", e.target.value)}
        />
        {errors.location && <p className="text-red-600 text-xs mt-1">{errors.location}</p>}
      </div>

      {/* (Optional) Nếu bạn có UI chọn GeoPoint trực tiếp, bạn có thể set form.location.geo ở đây */}

      <div className="flex gap-2 pt-2">
        <Button onClick={handleSubmit}>Lưu</Button>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Hủy
          </Button>
        )}
      </div>
    </div>
  );
}
