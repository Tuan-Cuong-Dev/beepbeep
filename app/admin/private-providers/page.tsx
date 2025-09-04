"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/src/components/landingpage/Header";
import Footer from "@/src/components/landingpage/Footer";
import UserTopMenu from "@/src/components/landingpage/UserTopMenu";
import NotificationDialog from "@/src/components/ui/NotificationDialog";
import { useTranslation } from "react-i18next";
import { Button } from "@/src/components/ui/button"; // dùng Button hệ thống ở top page

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/src/firebaseConfig";

import type { PrivateProvider } from "@/src/lib/privateProviders/privateProviderTypes";
import PrivateProviderForm from "@/src/components/private-providers/PrivateProviderForm";
import PrivateProviderTable from "@/src/components/private-providers/PrivateProviderTable";
import PrivateProviderSearch from "@/src/components/private-providers/PrivateProviderSearch";

/** Fetch 1 lần danh sách Private Providers */
async function fetchPrivateProvidersOnce(): Promise<PrivateProvider[]> {
  const q = query(collection(db, "privateProviders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as PrivateProvider[];
}

export default function PrivateProvidersManagementPage() {
  const { t } = useTranslation("common");

  // ======= Data =======
  const [providers, setProviders] = useState<PrivateProvider[]>([]);
  const [filtered, setFiltered] = useState<PrivateProvider[] | null>(null);
  const [editingProvider, setEditingProvider] = useState<PrivateProvider | null>(null);

  // ======= Dialog =======
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

  const confirmDialog = (title: string, description: string, onConfirm: () => void) =>
    setDialog({ open: true, type: "confirm", title, description, onConfirm });

  // ======= Fetch initial (once) =======
  useEffect(() => {
    (async () => {
      try {
        const rows = await fetchPrivateProvidersOnce();
        setProviders(rows);
      } catch {
        showDialog("error", t("private_providers_page.messages.load_failed", "Load failed"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async () => {
    const rows = await fetchPrivateProvidersOnce();
    setProviders(rows);
    setFiltered(null); // reset filter sau khi CRUD
  };

  // ======= CRUD =======
  const handleSaveProvider = async (
    data: Omit<PrivateProvider, "id"> | Partial<PrivateProvider>
  ) => {
    try {
      if (editingProvider) {
        await updateDoc(doc(db, "privateProviders", editingProvider.id), {
          ...data,
          updatedAt: serverTimestamp(),
        });
        showDialog(
          "success",
          t("private_providers_page.messages.update_success", "Updated successfully")
        );
      } else {
        await addDoc(collection(db, "privateProviders"), {
          ...data,
          businessType: "private_provider",
          createdAt: serverTimestamp(),
        });
        showDialog(
          "success",
          t("private_providers_page.messages.add_success", "Added successfully")
        );
      }
      setEditingProvider(null);
      await reload();
    } catch (err) {
      console.error("❌ Error saving provider:", err);
      showDialog(
        "error",
        t("private_providers_page.messages.save_failed", "Save failed")
      );
    }
  };

  const handleDeleteProvider = (id: string) => {
    confirmDialog(
      t("private_providers_page.confirm_delete.title", "Delete this provider?"),
      t(
        "private_providers_page.confirm_delete.description",
        "This action cannot be undone."
      ),
      async () => {
        try {
          await deleteDoc(doc(db, "privateProviders", id));
          showDialog(
            "success",
            t("private_providers_page.messages.delete_success", "Deleted successfully")
          );
          await reload();
        } catch (err) {
          console.error("❌ Error deleting provider:", err);
          showDialog(
            "error",
            t("private_providers_page.messages.delete_failed", "Delete failed")
          );
        }
      }
    );
  };

  // ======= Scroll to form when editing =======
  const formRef = useRef<HTMLDivElement | null>(null);
  const handleEdit = (p: PrivateProvider) => {
    setEditingProvider(p);
    // scroll mượt tới form
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const startAddNew = () => {
    setEditingProvider(null);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  // ======= Data hiển thị (ưu tiên filtered) =======
  const data = useMemo(() => filtered ?? providers, [filtered, providers]);

  // ======= UI =======
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-6 py-10 space-y-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold border-b-2 border-[#00d289] pb-2">
            {t("private_providers_page.title", "Private Providers Management")}
          </h1>
          <Button onClick={startAddNew}>
            {t("private_providers_page.add_new", "Thêm mới")}
          </Button>
        </div>

        {/* Search */}
        <PrivateProviderSearch providers={providers} onResult={setFiltered} />

        {/* List (cards mobile, table desktop) */}
        <PrivateProviderTable
          providers={data}
          onEdit={handleEdit}
          onDelete={handleDeleteProvider}
        />

        {/* Form khu vực chỉnh sửa / thêm */}
        <section ref={formRef} className="scroll-mt-24">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">
              {editingProvider
                ? t("private_providers_page.edit_title", "Chỉnh sửa cá nhân cho thuê xe")
                : t("private_providers_page.create_title", "Thêm cá nhân cho thuê xe")}
            </h2>
            {editingProvider && (
              <Button variant="outline" onClick={() => setEditingProvider(null)}>
                {t("private_providers_page.cancel_edit", "Hủy chỉnh sửa")}
              </Button>
            )}
          </div>

          {/* Key giúp reset form khi đổi chế độ add/edit */}
          <PrivateProviderForm
            key={editingProvider?.id ?? "create"}
            initialData={editingProvider ?? undefined}
            onSubmit={handleSaveProvider}
            onCancel={() => setEditingProvider(null)}
          />
        </section>
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
