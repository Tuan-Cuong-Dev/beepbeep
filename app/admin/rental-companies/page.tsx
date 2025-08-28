// Dành cho Admin quản lí doanh nghiệp cho thuê

"use client";

import { useState } from "react";
import Header from "@/src/components/landingpage/Header";
import Footer from "@/src/components/landingpage/Footer";
import UserTopMenu from "@/src/components/landingpage/UserTopMenu";
import {
  useRentalData,
  RentalCompany,
  RentalStation,
} from "@/src/hooks/useRentalData";
import RentalCompanyForm from "@/src/components/rental-management/rental-companies/RentalCompanyForm";
import RentalSearchImportExport from "@/src/components/rental-management/rental-companies/RentalSearchImportExport";
import RentalCompanyTable from "@/src/components/rental-management/rental-companies/RentalCompanyTable";
import NotificationDialog from "@/src/components/ui/NotificationDialog";

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

export default function RentalCompaniesPage() {
  const { t } = useTranslation("common");
  const { rentalCompanies, rentalStations, fetchCompanies, fetchStations } =
    useRentalData();

  const [searchTerm, setSearchTerm] = useState("");
  const [editingCompany, setEditingCompany] = useState<RentalCompany | null>(
    null
  );
  const [editingStation, setEditingStation] = useState<RentalStation | null>(
    null
  );

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
  ) => {
    setDialog({ open: true, type, title, description, onConfirm: undefined });
  };

  const confirmDialog = (
    title: string,
    description: string,
    onConfirm: () => void
  ) => {
    setDialog({ open: true, type: "confirm", title, description, onConfirm });
  };

  const handleSaveCompany = async (data: Omit<RentalCompany, "id">) => {
    try {
      if (editingCompany) {
        await updateDoc(doc(db, "rentalCompanies", editingCompany.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showDialog("success", t("rental_companies_page.messages.update_success"));
      } else {
        await addDoc(collection(db, "rentalCompanies"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        showDialog("success", t("rental_companies_page.messages.add_success"));
      }
      setEditingCompany(null);
      fetchCompanies();
    } catch (err) {
      console.error("❌ Error saving company:", err);
      showDialog("error", t("rental_companies_page.messages.save_failed"));
    }
  };

  const handleDeleteCompany = (id: string) => {
    confirmDialog(
      t("rental_companies_page.confirm_delete.title"),
      t("rental_companies_page.confirm_delete.description"),
      async () => {
        try {
          await deleteDoc(doc(db, "rentalCompanies", id));
          showDialog("success", t("rental_companies_page.messages.delete_success"));
          fetchCompanies();
        } catch (err) {
          console.error("❌ Error deleting company:", err);
          showDialog("error", t("rental_companies_page.messages.delete_failed"));
        }
      }
    );
  };

  const handleSaveStation = async (data: Omit<RentalStation, "id">) => {
    try {
      if (editingStation) {
        await updateDoc(doc(db, "rentalStations", editingStation.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showDialog("success", t("rental_companies_page.messages.station_update_success"));
      } else {
        await addDoc(collection(db, "rentalStations"), {
          ...data,
          createdAt: serverTimestamp(),
        });
        showDialog("success", t("rental_companies_page.messages.station_add_success"));
      }
      setEditingStation(null);
      fetchStations();
    } catch (err) {
      console.error("❌ Error saving station:", err);
      showDialog("error", t("rental_companies_page.messages.station_save_failed"));
    }
  };

  const handleDeleteStation = (id: string) => {
    confirmDialog(
      t("rental_companies_page.confirm_delete_station.title"),
      t("rental_companies_page.confirm_delete_station.description"),
      async () => {
        try {
          await deleteDoc(doc(db, "rentalStations", id));
          showDialog("success", t("rental_companies_page.messages.station_delete_success"));
          fetchStations();
        } catch (err) {
          console.error("❌ Error deleting station:", err);
          showDialog("error", t("rental_companies_page.messages.station_delete_failed"));
        }
      }
    );
  };

  const filteredCompanies = rentalCompanies.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-6 py-10 space-y-10">
        <h1 className="text-2xl font-bold border-b-2 border-[#00d289] pb-2">
          {t("rental_companies_page.title")}
        </h1>

        <RentalSearchImportExport
          companies={rentalCompanies}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
        />
        <RentalCompanyTable
          rentalCompanies={filteredCompanies}
          rentalStations={rentalStations}
          onEditCompany={(c) => setEditingCompany(c)}
          onDeleteCompany={handleDeleteCompany}
        />
        <div>
          <RentalCompanyForm
            editingCompany={editingCompany}
            onSave={handleSaveCompany}
            onCancel={() => setEditingCompany(null)}
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
