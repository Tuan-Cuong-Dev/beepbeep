'use client';

import { useMemo, useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { PrivateProvider } from "@/src/lib/privateProviders/privateProviderTypes";
import type { PrivateProviderFormState } from "@/src/lib/privateProviders/privateProviderFormTypes";
import { GeoPoint, serverTimestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";

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
          geo: geo!, // sẽ validate trước khi submit
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
  const { t } = useTranslation("common");

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
        updatedAt: initialData.location?.updatedAt,
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

    if (!form.name || !form.name.trim()) e.name = t("private_provider_form.errors.name_required");
    if (!form.phone || !form.phone.trim()) e.phone = t("private_provider_form.errors.phone_required");
    if (!form.displayAddress || !form.displayAddress.trim())
      e.displayAddress = t("private_provider_form.errors.display_address_required");

    // Location: chấp nhận có geo sẵn, hoặc parse được từ "lat,lng"
    const loc = form.location;
    let geoOk = !!loc?.geo;
    if (!geoOk && loc?.location) {
      geoOk = !!parseLatLngString(loc.location);
    }
    if (!geoOk) {
      e.location = t("private_provider_form.errors.location_required");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const payload = buildSubmitPayload(form);
    // Đảm bảo location.geo có thật trước khi submit
    if (!payload.location?.geo) {
      setErrors((prev) => ({
        ...prev,
        location: t("private_provider_form.errors.missing_geopoint"),
      }));
      return;
    }
    onSubmit(payload);
  };

  /* ------ UI ------ */

  return (
    <div className="p-4 md:p-6 bg-white rounded-2xl border shadow-sm">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h2 className="text-lg md:text-xl font-semibold">
          {t("private_provider_form.title")}
        </h2>
        <p className="text-sm text-gray-500">
          {t("private_provider_form.subtitle")}
        </p>
      </div>

      {/* Grid 1c mobile / 2c desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            {t("private_provider_form.labels.name")} <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder={t("private_provider_form.placeholders.name")}
            value={form.name || ""}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          {errors.name && <p className="text-red-600 text-xs">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            {t("private_provider_form.labels.email")}
          </label>
          <Input
            placeholder={t("private_provider_form.placeholders.email")}
            value={form.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            {t("private_provider_form.labels.phone")} <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder={t("private_provider_form.placeholders.phone")}
            value={form.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
          {errors.phone && <p className="text-red-600 text-xs">{errors.phone}</p>}
        </div>

        {/* Display address */}
        <div className="space-y-1">
          <label className="text-sm font-medium">
            {t("private_provider_form.labels.display_address")} <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder={t("private_provider_form.placeholders.display_address")}
            value={form.displayAddress || ""}
            onChange={(e) => handleChange("displayAddress", e.target.value)}
          />
          {errors.displayAddress && (
            <p className="text-red-600 text-xs">{errors.displayAddress}</p>
          )}
        </div>

        {/* Location Group (span 2 cols) */}
        <div className="md:col-span-2 border rounded-xl p-3 md:p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">{t("private_provider_form.section_titles.location")}</h3>
          </div>

          {/* Map address */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t("private_provider_form.labels.map_address")}
            </label>
            <Input
              placeholder={t("private_provider_form.placeholders.map_address")}
              value={form.location?.mapAddress || ""}
              onChange={(e) => handleLocationChange("mapAddress", e.target.value)}
            />
            <p className="text-[11px] text-gray-500">
              {t("private_provider_form.helpers.map_address_hint")}
            </p>
          </div>

          {/* LatLng */}
          <div className="space-y-1">
            <label className="text-sm font-medium">
              {t("private_provider_form.labels.latlng")} <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={t("private_provider_form.placeholders.latlng")}
              value={form.location?.location || ""}
              onChange={(e) => handleLocationChange("location", e.target.value)}
            />
            <p className="text-[11px] text-gray-500">
              {t("private_provider_form.helpers.latlng_hint")}
            </p>
            {errors.location && <p className="text-red-600 text-xs">{errors.location}</p>}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 md:mt-6 flex flex-col-reverse md:flex-row md:justify-end gap-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full md:w-auto"
          >
            {t("private_provider_form.buttons.cancel")}
          </Button>
        )}
        <Button onClick={handleSubmit} className="w-full md:w-auto">
          {t("private_provider_form.buttons.save")}
        </Button>
      </div>
    </div>
  );
}
