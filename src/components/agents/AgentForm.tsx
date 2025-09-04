"use client";

import { useMemo, useState, useEffect } from "react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import type { Agent } from "@/src/lib/agents/agentTypes";
import { GeoPoint, serverTimestamp } from "firebase/firestore";
import { useTranslation } from "react-i18next";
import { useGeocodeAddress } from "@/src/hooks/useGeocodeAddress";

/* ============== Types ============== */
type LocationForm = {
  geo?: GeoPoint;
  location?: string;     // "lat,lng"
  mapAddress?: string;   // link/text
  address?: string;      // địa chỉ mô tả
  updatedAt?: any;
};

type AgentFormState = {
  name?: string;
  email?: string;
  phone?: string;
  displayAddress?: string;
  location?: LocationForm;
};

/* ============== Build payload ============== */
function buildSubmitPayload(form: AgentFormState): Partial<Agent> {
  const loc: LocationForm = form.location ?? {};
  let geo = loc.geo;

  if (!geo && loc.location) {
    const parts = loc.location.split(",").map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && parts.every((n) => Number.isFinite(n))) {
      geo = new GeoPoint(parts[0], parts[1]);
    }
  }

  return {
    name: form.name!,
    email: form.email!,
    phone: form.phone!,
    displayAddress: form.displayAddress!,
    businessType: "agent",
    location:
      geo || loc.location || loc.mapAddress || loc.address
        ? {
            geo: geo!, // đã validate trước khi submit
            location: loc.location,
            mapAddress: loc.mapAddress,
            address: loc.address,
            updatedAt: serverTimestamp(),
          } as Agent["location"]
        : (undefined as any),
    updatedAt: serverTimestamp() as any,
  };
}

/* ============== Component ============== */
export default function AgentForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: Agent;
  onSubmit: (payload: Partial<Agent>) => void;
  onCancel?: () => void;
}) {
  const { t } = useTranslation("common");
  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();

  // Map từ Agent (doc) -> AgentFormState (form mềm dẻo)
  const initialForm: AgentFormState = useMemo(() => {
    if (!initialData) return {};
    return {
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
    };
  }, [initialData]);

  const [form, setForm] = useState<AgentFormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // set field top-level
  const setTop = <K extends keyof AgentFormState>(k: K, v: NonNullable<AgentFormState[K]>) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  // set field trong location
  const setLoc = (k: keyof LocationForm, v: string) =>
    setForm((prev) => ({ ...prev, location: { ...(prev.location ?? {}), [k]: v } }));

  /* ============== Auto geocode khi mapAddress thay đổi ============== */
  useEffect(() => {
    if (form.location?.mapAddress?.trim()) {
      geocode(form.location.mapAddress.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.location?.mapAddress]);

  // khi có coords → update form.location.location
  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        location: {
          ...(prev.location ?? {}),
          location: `${coords.lat},${coords.lng}`,
        },
      }));
    }
  }, [coords]);

  /* ============== Validate & Submit ============== */
  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.name?.trim()) e.name = t("agent_form.errors.name_required");
    if (!form.phone?.trim()) e.phone = t("agent_form.errors.phone_required");
    if (!form.displayAddress?.trim())
      e.displayAddress = t("agent_form.errors.display_address_required");

    const loc = form.location;
    if (!loc?.location) {
      e.location = t("agent_form.errors.location_required");
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const payload = buildSubmitPayload(form);
    if (!payload.location?.geo) {
      setErrors((prev) => ({
        ...prev,
        location: t("agent_form.errors.missing_geopoint"),
      }));
      return;
    }
    onSubmit(payload);
  };

  /* ============== UI ============== */
  return (
    <div className="p-4 md:p-6 bg-white rounded-2xl border shadow-sm">
      <h2 className="text-lg md:text-xl font-semibold mb-4">
        {t("agent_form.title", "Thông tin đại lý")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic fields */}
        <Input
          placeholder={t("agent_form.placeholders.name")}
          value={form.name || ""}
          onChange={(e) => setTop("name", e.target.value)}
        />
        <Input
          placeholder="email@example.com"
          value={form.email || ""}
          onChange={(e) => setTop("email", e.target.value)}
        />
        <Input
          placeholder="090..."
          value={form.phone || ""}
          onChange={(e) => setTop("phone", e.target.value)}
        />
        <Input
          placeholder="166 Nguyễn Hoàng, Đà Nẵng"
          value={form.displayAddress || ""}
          onChange={(e) => setTop("displayAddress", e.target.value)}
        />

        {/* Location group */}
        <div className="md:col-span-2 border rounded-xl p-3 md:p-4 space-y-3">
          <Input
            placeholder={t("agent_form.labels.map_address")}
            value={form.location?.mapAddress || ""}
            onChange={(e) => setLoc("mapAddress", e.target.value)}
          />

          <Input
            placeholder="16.0613,108.2110"
            value={form.location?.location || ""}
            onChange={(e) => setLoc("location", e.target.value)}
          />
          {errors.location && <p className="text-xs text-red-600">{errors.location}</p>}

          {geoLoading && <p className="text-xs text-gray-500">⏳ Đang phân tích địa chỉ...</p>}
          {geoError && <p className="text-xs text-red-600">{geoError}</p>}

          {coords && (
            <iframe
              title="Map Preview"
              width="100%"
              height="240"
              style={{ border: 0 }}
              loading="lazy"
              src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=16&output=embed`}
            />
          )}
        </div>
      </div>

      <div className="mt-4 flex gap-2 justify-end">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            {t("agent_form.buttons.cancel")}
          </Button>
        )}
        <Button onClick={handleSubmit}>{t("agent_form.buttons.save")}</Button>
      </div>
    </div>
  );
}
