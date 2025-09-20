'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import NotificationDialog from "@/src/components/ui/NotificationDialog";
import { useGeocodeAddress } from "@/src/hooks/useGeocodeAddress";
import { db, auth } from "@/src/firebaseConfig";
import {
  collection,
  doc,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import type { BusinessType } from "@/src/lib/my-business/businessTypes";
import { BUSINESS_ROUTE_CONFIG } from "@/src/lib/my-business/routeConfig";
import { useTranslation } from "react-i18next";
import { buildLocationCore, parseLatLng } from "@/src/lib/locations/locationUtils";

interface Props {
  businessType: BusinessType;
}

type LatLng = { lat: number; lng: number };

/** Parse "lat,lng" fallback cho preview */
function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Helper: loại bỏ toàn bộ field undefined (deep) */
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj as T;
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined).filter((v) => v !== undefined) as unknown as T;
  }
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj as Record<string, any>)) {
    if (v === undefined) continue;
    out[k] = stripUndefined(v);
  }
  return out as T;
}

export default function CreateBusinessForm({ businessType }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // subtype chỉ áp dụng cho technician_partner
  const subtypeParam = (searchParams?.get("subtype") || "").toLowerCase();
  const technicianSubtype = useMemo<"mobile" | "shop" | undefined>(() => {
    if (businessType !== "technician_partner") return undefined;
    return subtypeParam === "mobile" || subtypeParam === "shop"
      ? subtypeParam
      : "mobile";
  }, [businessType, subtypeParam]);

  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();
  const geocodeRef = useRef(geocode);
  geocodeRef.current = geocode;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    displayAddress: "",
    mapAddress: "",
    location: "", // "lat,lng" – để UX; server build LocationCore
  });

  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: "info" as "success" | "error" | "info",
    title: "",
    description: "",
  });

  // 🆕 Toggle & state cho GPS
  const [useCurrentPos, setUseCurrentPos] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "getting" | "ok" | "error">("idle");
  const [gpsError, setGpsError] = useState("");
  const [currentPos, setCurrentPos] = useState<LatLng | null>(null);

  /** Lấy vị trí hiện tại (GPS) */
  const getGps = useCallback(() => {
    setGpsStatus("getting");
    setGpsError("");

    if (!("geolocation" in navigator)) {
      setGpsStatus("error");
      setGpsError("Trình duyệt không hỗ trợ Geolocation.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const latlng: LatLng = { lat: latitude, lng: longitude };
        setCurrentPos(latlng);
        setForm((prev) => ({ ...prev, location: `${latitude},${longitude}` }));
        setGpsStatus("ok");
      },
      (err) => {
        setGpsStatus("error");
        setGpsError(err.message || "Không lấy được vị trí hiện tại.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Prefill từ current user
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {});
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setForm((p) => ({
          ...p,
          email: u.email || "",
          phone: p.phone || u.phoneNumber || "",
        }));
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Khi bật dùng GPS → gọi getGps()
  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // Khi geocode xong → ghi vào input location (chỉ khi KHÔNG dùng GPS)
  useEffect(() => {
    if (!coords || useCurrentPos) return;
    setForm((prev) => ({ ...prev, location: `${coords.lat},${coords.lng}` }));
  }, [coords, useCurrentPos]);

  const showDialog = (type: "success" | "error" | "info", title: string, description = "") =>
    setDialog({ open: true, type, title, description });

  const handleChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleBlur = () => {
    if (!useCurrentPos && form.mapAddress.trim()) {
      geocodeRef.current(form.mapAddress.trim());
    }
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      return showDialog(
        "error",
        t("create_business_form.not_logged_in_title"),
        t("create_business_form.not_logged_in_description")
      );
    }

    const { name, phone, displayAddress, mapAddress, location } = form;

    if (
      !name ||
      !phone ||
      !displayAddress ||
      (!useCurrentPos && !mapAddress) ||
      !location
    ) {
      return showDialog(
        "error",
        t("create_business_form.missing_fields_title"),
        t("create_business_form.missing_fields_description")
      );
    }

    // Ưu tiên GPS → geocode → parse
    const parsed = currentPos ?? coords ?? parseLatLng(location);
    if (!parsed) {
      return showDialog(
        "error",
        t("create_business_form.error_title"),
        t("create_business_form.invalid_coordinates")
      );
    }

    const cfg = BUSINESS_ROUTE_CONFIG[businessType];
    setLoading(true);

    try {
      const locationCore = buildLocationCore({
        coords: parsed,
        mapAddress: useCurrentPos ? null : (form.mapAddress?.trim() || null),
        address: form.displayAddress?.trim() || "",
      });

      const userMeta = {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        emailVerified: !!user.emailVerified,
      };

      const batch = writeBatch(db);
      const docRef = doc(collection(db, cfg.collection));

      let baseDoc: Record<string, any>;

      if (businessType === "private_provider") {
        baseDoc = {
          id: docRef.id,
          ownerId: user.uid,
          name: form.name,
          email: form.email,
          phone: form.phone,
          displayAddress: form.displayAddress,
          location: locationCore,
          businessType: "private_provider",
          status: "active" as const,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
      } else {
        baseDoc = {
          id: docRef.id,
          name: form.name,
          email: form.email,
          phone: form.phone,
          displayAddress: form.displayAddress,
          location: locationCore,
          businessType,
          ownerId: user.uid,
          owners: [user.uid],
          members: [user.uid],
          ownerMeta: userMeta,
          status: "active" as const,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          ...(cfg.additionalData || {}),
        };

        if (businessType === "technician_partner") {
          baseDoc.subtype = technicianSubtype ?? "mobile";
          baseDoc.type = technicianSubtype ?? "mobile";
          baseDoc.vehicleType = baseDoc.vehicleType || "motorbike";
          baseDoc.isActive = baseDoc.isActive ?? true;
        }
      }

      const safeDoc = stripUndefined(baseDoc);
      batch.set(docRef, safeDoc);

      const userRef = doc(db, "users", user.uid);
      const userPatch = stripUndefined({
        role: cfg.role,
        business: {
          id: docRef.id,
          type: businessType,
          collection: cfg.collection,
          ...(businessType === "technician_partner" && technicianSubtype
            ? { subtype: technicianSubtype }
            : {}),
        },
        updatedAt: serverTimestamp(),
      });
      batch.set(userRef, userPatch, { merge: true });

      await batch.commit();

      if (businessType === "rental_company") {
        await fetch("/api/setCustomClaims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, role: cfg.role }),
        });
        await new Promise((r) => setTimeout(r, 1000));
        await auth.currentUser?.getIdToken(true);
      }

      showDialog(
        "success",
        t("create_business_form.success_title"),
        t("create_business_form.success_description")
      );
      setTimeout(() => router.push(cfg.redirect), 1000);
    } catch (err) {
      console.error("❌ Error creating business:", err);
      showDialog(
        "error",
        t("create_business_form.error_title"),
        t("create_business_form.error_description")
      );
    } finally {
      setLoading(false);
    }
  };

  // Quyết định toạ độ nào để preview map
  const previewCoords: LatLng | null = (() => {
    if (currentPos) return currentPos;
    if (coords && !useCurrentPos) return coords;
    return parseLatLngString(form.location);
  })();

  return (
    <>
      <div className="space-y-4">
        <Input
          placeholder={t("create_business_form.name_placeholder")}
          value={form.name}
          onChange={handleChange("name")}
        />
        <Input
          placeholder={t("create_business_form.email_placeholder")}
          value={form.email}
          readOnly
          className="bg-gray-100 cursor-not-allowed"
        />
        <Input
          placeholder={t("create_business_form.phone_placeholder")}
          value={form.phone}
          onChange={handleChange("phone")}
        />
        <Input
          placeholder={t("create_business_form.display_address_placeholder")}
          value={form.displayAddress}
          onChange={handleChange("displayAddress")}
        />

        {/* ✅ Toggle GPS */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useCurrentPos}
            onChange={(e) => setUseCurrentPos(e.target.checked)}
          />
          <span>
            {t(
              "use_current_location_label",
              "Dùng vị trí hiện tại (GPS) — không cần dán link Google Maps"
            )}
          </span>
        </label>

        {!useCurrentPos && (
          <Input
            placeholder={t("create_business_form.map_address_placeholder")}
            value={form.mapAddress}
            onChange={handleChange("mapAddress")}
            onBlur={handleBlur}
          />
        )}

        <Input
          placeholder={t("create_business_form.location_placeholder")}
          value={form.location}
          readOnly={useCurrentPos}
          onChange={handleChange("location")}
        />

        {businessType === "technician_partner" && (
          <p className="text-xs text-gray-600">
            {t("create_business_form.technician_subtype_hint", {
              subtype: t(
                `create_business_form.subtype.${technicianSubtype ?? "mobile"}`
              ),
            })}
          </p>
        )}

        {geoLoading && !useCurrentPos && (
          <p className="text-sm text-gray-500">
            {t("create_business_form.detecting_coordinates")}
          </p>
        )}
        {geoError && !useCurrentPos && (
          <p className="text-sm text-red-500">{geoError}</p>
        )}

        {/* Trạng thái GPS */}
        {useCurrentPos && (
          <p className="text-xs text-gray-600">
            {gpsStatus === "getting" && t("gps.getting", "Đang lấy vị trí…")}
            {gpsStatus === "ok" && t("gps.ok", "Đã lấy vị trí từ GPS.")}
            {gpsStatus === "error" && (
              <span className="text-red-600">
                {t("gps.error_prefix", "Lỗi:")} {gpsError}
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              className="ml-2"
              onClick={getGps}
            >
              {t("gps.refresh", "Lấy lại vị trí")}
            </Button>
          </p>
        )}

        {previewCoords && (
          <>
            <p className="text-sm text-gray-600">
              {t("create_business_form.detected_coordinates")}{" "}
              {previewCoords.lat}, {previewCoords.lng}
            </p>
            <iframe
              title="Map Preview"
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: "8px" }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${previewCoords.lat},${previewCoords.lng}&hl=vi&z=16&output=embed`}
            />
          </>
        )}

        <Button onClick={handleSubmit} disabled={loading || !authReady}>
          {loading
            ? t("create_business_form.creating_button")
            : !authReady
            ? t("common.loading")
            : t("create_business_form.create_button")}
        </Button>
      </div>

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
