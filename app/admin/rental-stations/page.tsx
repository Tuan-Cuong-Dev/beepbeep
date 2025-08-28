// app/admin/rental-stations/page.tsx
"use client";

import { useMemo, useState } from "react";
import Header from "@/src/components/landingpage/Header";
import Footer from "@/src/components/landingpage/Footer";
import UserTopMenu from "@/src/components/landingpage/UserTopMenu";
import {
  useRentalData,
  type RentalCompany,
  type RentalStation,
} from "@/src/hooks/useRentalData";
import RentalStationForm from "@/src/components/rental-management/rental-stations/RentalStationForm";
import RentalStationTable from "@/src/components/rental-management/rental-stations/RentalStationTable";
import NotificationDialog from "@/src/components/ui/NotificationDialog";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/src/firebaseConfig";
import { useTranslation } from "react-i18next";

export default function RentalStationsPage() {
  const { t } = useTranslation("common");
  const { rentalCompanies, rentalStations, fetchCompanies, fetchStations } =
    useRentalData();

  // 🔎 Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [companyFilter, setCompanyFilter] = useState<string>("");

  // ✏️ Editing state
  const [editingStation, setEditingStation] = useState<RentalStation | null>(
    null
  );

  // 🔔 Dialog state
  const [dialog, setDialog] = useState({
    open: false,
    type: "info" as "success" | "error" | "info" | "confirm",
    title: "",
    description: "",
    onConfirm: undefined as (() => void) | undefined,
  });

  const showDialog = (
    type: "success" | "error" | "info",
    title: string,
    description = ""
  ) => setDialog({ open: true, type, title, description, onConfirm: undefined });

  const confirmDialog = (
    title: string,
    description: string,
    onConfirm: () => void
  ) => setDialog({ open: true, type: "confirm", title, description, onConfirm });

  // 💾 Save / Update station
  const handleSaveStation = async (data: Omit<RentalStation, "id">) => {
    try {
      if (editingStation) {
        await updateDoc(doc(db, "rentalStations", editingStation.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showDialog("success", t("rental_stations_page.messages.station_update_success"));
      } else {
        await addDoc(collection(db, "rentalStations"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        showDialog("success", t("rental_stations_page.messages.station_add_success"));
      }
      setEditingStation(null);
      fetchStations();
    } catch (err) {
      console.error("❌ Error saving station:", err);
      showDialog("error", t("rental_stations_page.messages.station_save_failed"));
    }
  };

  // 🗑️ Delete station
  const handleDeleteStation = (id: string) => {
    confirmDialog(
      t("rental_stations_page.confirm_delete_station.title"),
      t("rental_stations_page.confirm_delete_station.description"),
      async () => {
        try {
          await deleteDoc(doc(db, "rentalStations", id));
          showDialog("success", t("rental_stations_page.messages.station_delete_success"));
          fetchStations();
        } catch (err) {
          console.error("❌ Error deleting station:", err);
          showDialog("error", t("rental_stations_page.messages.station_delete_failed"));
        }
      }
    );
  };

  // 🧮 Derived list with filters
  const filteredStations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return rentalStations.filter((s) => {
      const matchTerm = term
        ? [s.name, s.displayAddress, s.location, s.contactPhone]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(term))
        : true;
      const matchCompany = companyFilter ? s.companyId === companyFilter : true;
      return matchTerm && matchCompany;
    });
  }, [rentalStations, searchTerm, companyFilter]);

  const companyOptions: { id: string; name: string }[] = useMemo(
    () => rentalCompanies.map((c) => ({ id: c.id, name: c.name })),
    [rentalCompanies]
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold border-b-2 border-[#00d289] pb-2">
            {t("rental_stations_page.title")}
          </h1>
        </div>

        {/* 🔎 Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl shadow">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t("rental_stations_page.filters.search")}
            </label>
            <Input
              placeholder={t("rental_stations_page.search_placeholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t("rental_stations_page.filters.company")}
            </label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
            >
              <option value="">{t("rental_stations_page.filters.all_companies")}</option>
              {companyOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm("");
                setCompanyFilter("");
              }}
            >
              {t("rental_stations_page.filters.clear")}
            </Button>
          </div>
        </div>

        {/* 📋 Table */}
        <RentalStationTable
          rentalCompanies={rentalCompanies}
          rentalStations={filteredStations}
          onEditStation={(s) => setEditingStation(s)}
          onDeleteStation={handleDeleteStation}
        />

        {/* 📝 Form */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="text-lg font-semibold mb-3">
            {editingStation
              ? t("rental_stations_page.edit_title")
              : t("rental_stations_page.add_title")}
          </h2>
          <RentalStationForm
            companies={companyOptions}
            editingStation={editingStation}
            onSave={handleSaveStation}
            onCancel={() => setEditingStation(null)}
          />
        </div>
      </main>

      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
