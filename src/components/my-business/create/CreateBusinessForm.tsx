"use client";

import { useState, useEffect } from "react";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { db, auth } from "@/src/firebaseConfig";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useGeocodeAddress } from "@/src/hooks/useGeocodeAddress";
import { BusinessType } from "@/src/lib/my-business/businessTypes";
import { useRouter } from "next/navigation";
import NotificationDialog from "@/src/components/ui/NotificationDialog";
import { useTranslation } from "react-i18next";

interface Props {
  businessType: BusinessType;
}

const businessTypeConfig: Record<BusinessType, {
  collection: string;
  role: string;
  redirect: string;
}> = {
  rental_company: {
    collection: "rentalCompanies",
    role: "company_owner",
    redirect: "/dashboard",
  },
  private_provider: {
    collection: "privateProviders",
    role: "private_owner",
    redirect: "/dashboard",
  },
  agent: {
    collection: "agents",
    role: "agent",
    redirect: "/dashboard",
  },
  technician_mobile: {
    collection: "technicianPartners",
    role: "technician_partner",
    redirect: "/dashboard",
  },
  technician_shop: {
    collection: "technicianPartners",
    role: "technician_partner",
    redirect: "/dashboard",
  },
  intercity_bus: {
    collection: "intercityBusCompanies",
    role: "intercity_bus",
    redirect: "/dashboard",
  },
  vehicle_transport: {
    collection: "vehicleTransporters",
    role: "vehicle_transport",
    redirect: "/dashboard",
  },
  tour_guide: {
    collection: "tourGuides",
    role: "tour_guide",
    redirect: "/dashboard",
  },
};

export default function CreateBusinessForm({ businessType }: Props) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    displayAddress: "",
    mapAddress: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: "info" as "success" | "error" | "info",
    title: "",
    description: "",
  });

  const showDialog = (type: "success" | "error" | "info", title: string, description = "") => {
    setDialog({ open: true, type, title, description });
  };

  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();
  const router = useRouter();

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({ ...prev, location: `${coords.lat},${coords.lng}` }));
    }
  }, [coords]);

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleBlur = () => {
    if (form.mapAddress.trim()) geocode(form.mapAddress);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return showDialog("error", t("create_business_form.not_logged_in_title"), t("create_business_form.not_logged_in_description"));

    const { name, email, phone, displayAddress, mapAddress, location } = form;
    if (!name || !phone || !displayAddress || !mapAddress || !location) {
      return showDialog("error", t("create_business_form.missing_fields_title"), t("create_business_form.missing_fields_description"));
    }

    const [latStr, lngStr] = location.split(",").map((s) => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) {
      return showDialog("error", t("create_business_form.error_title"), t("create_business_form.invalid_coordinates"));
    }

    const formattedLocation = `${lat}° N, ${lng}° E`;
    setLoading(true);

    try {
      const config = businessTypeConfig[businessType];
      const data: Record<string, any> = {
        name,
        email,
        phone,
        displayAddress,
        mapAddress,
        location: formattedLocation,
        ownerId: user.uid,
        businessType,
        createdAt: serverTimestamp(),
      };

      if (businessType === "technician_mobile") data.type = "mobile";
      if (businessType === "technician_shop") data.type = "shop";

      const docRef = await addDoc(collection(db, config.collection), data);

      await updateDoc(doc(db, "users", user.uid), {
        role: config.role,
        companyId: docRef.id,
        updatedAt: serverTimestamp(),
      });

      if (businessType === "rental_company") {
        await fetch("/api/setCustomClaims", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: user.uid, role: config.role }),
        });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await auth.currentUser?.getIdToken(true);
      }

      showDialog("success", t("create_business_form.success_title"), t("create_business_form.success_description"));
      setTimeout(() => router.push(config.redirect), 1000);
    } catch (err) {
      console.error("❌ Error:", err);
      showDialog("error", t("create_business_form.error_title"), t("create_business_form.error_description"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Input placeholder={t("create_business_form.name_placeholder")} value={form.name} onChange={handleChange("name")} />
        <Input placeholder={t("create_business_form.email_placeholder")} value={form.email} onChange={handleChange("email")} />
        <Input placeholder={t("create_business_form.phone_placeholder")} value={form.phone} onChange={handleChange("phone")} />
        <Input placeholder={t("create_business_form.display_address_placeholder")} value={form.displayAddress} onChange={handleChange("displayAddress")} />
        <Input placeholder={t("create_business_form.map_address_placeholder")} value={form.mapAddress} onChange={handleChange("mapAddress")} onBlur={handleBlur} />
        <Input placeholder={t("create_business_form.location_placeholder")} value={form.location} readOnly={!!coords} onChange={handleChange("location")} />

        {geoLoading && <p className="text-sm text-gray-500">{t("create_business_form.detecting_coordinates")}</p>}
        {geoError && <p className="text-sm text-red-500">{geoError}</p>}
        {coords && (
          <>
            <p className="text-sm text-gray-600">{t("create_business_form.detected_coordinates")} {coords.lat}, {coords.lng}</p>
            <iframe
              title="Map Preview"
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: "8px" }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=16&output=embed`}
            ></iframe>
          </>
        )}

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? t("create_business_form.creating_button") : t("create_business_form.create_button")}
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
