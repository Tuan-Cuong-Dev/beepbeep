// 04/09/2025

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/src/components/landingpage/Header";
import Footer from "@/src/components/landingpage/Footer";
import UserTopMenu from "@/src/components/landingpage/UserTopMenu";
import NotificationDialog from "@/src/components/ui/NotificationDialog";
import { Button } from "@/src/components/ui/button";
import { useTranslation } from "react-i18next";

import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, orderBy, query,
} from "firebase/firestore";
import { db, auth } from "@/src/firebaseConfig";

import type { Agent } from "@/src/lib/agents/agentTypes";
import AgentForm from "@/src/components/agents/AgentForm";
import AgentTable from "@/src/components/agents/AgentTable";
import AgentSearch from "@/src/components/agents/AgentSearch";

async function fetchAgentsOnce(): Promise<Agent[]> {
  const q = query(collection(db, "agents"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as Agent[];
}

export default function AgentsManagementPage() {
  const { t } = useTranslation("common");

  const [agents, setAgents] = useState<Agent[]>([]);
  const [filtered, setFiltered] = useState<Agent[] | null>(null);
  const [editing, setEditing] = useState<Agent | null>(null);

  const [dialog, setDialog] = useState({
    open: false,
    type: "info" as "success" | "error" | "info" | "confirm",
    title: "",
    description: "",
    onConfirm: undefined as (() => void) | undefined,
  });

  const showDialog = (type: "success" | "error" | "info", title: string, description = "") =>
    setDialog({ open: true, type, title, description, onConfirm: undefined });

  const confirmDialog = (title: string, description: string, onConfirm: () => void) =>
    setDialog({ open: true, type: "confirm", title, description, onConfirm });

  useEffect(() => {
    (async () => {
      try {
        setAgents(await fetchAgentsOnce());
      } catch {
        showDialog("error", t("agents_page.messages.load_failed", "Tải dữ liệu thất bại"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = async () => {
    setAgents(await fetchAgentsOnce());
    setFiltered(null);
  };

  const handleSave = async (payload: Partial<Agent>) => {
    try {
      if (editing) {
        await updateDoc(doc(db, "agents", editing.id), { ...payload, updatedAt: serverTimestamp() });
        showDialog("success", t("agents_page.messages.update_success", "Cập nhật thành công"));
      } else {
        const uid = auth.currentUser?.uid;
        await addDoc(collection(db, "agents"), {
          ...payload,
          ownerId: uid || null,
          businessType: "agent",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        showDialog("success", t("agents_page.messages.add_success", "Thêm mới thành công"));
      }
      setEditing(null);
      await reload();
    } catch (e) {
      console.error(e);
      showDialog("error", t("agents_page.messages.save_failed", "Lưu thất bại"));
    }
  };

  const handleDelete = (id: string) => {
    confirmDialog(
      t("agents_page.confirm_delete.title", "Xóa đại lý này?"),
      t("agents_page.confirm_delete.description", "Hành động này không thể hoàn tác."),
      async () => {
        try {
          await deleteDoc(doc(db, "agents", id));
          showDialog("success", t("agents_page.messages.delete_success", "Đã xóa"));
          await reload();
        } catch {
          showDialog("error", t("agents_page.messages.delete_failed", "Xóa thất bại"));
        }
      }
    );
  };

  const data = useMemo(() => filtered ?? agents, [filtered, agents]);
  const formRef = useRef<HTMLDivElement | null>(null);
  const handleEdit = (a: Agent) => {
    setEditing(a);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth" }));
  };
  const startAdd = () => {
    setEditing(null);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth" }));
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold border-b-2 border-[#00d289] pb-2">
            {t("agents_page.title", "Quản lý đại lý")}
          </h1>
          <Button onClick={startAdd}>{t("agents_page.add_new", "Thêm mới")}</Button>
        </div>

        <AgentSearch agents={agents} onResult={setFiltered} />

        <AgentTable agents={data} onEdit={handleEdit} onDelete={handleDelete} />

        <section ref={formRef} className="scroll-mt-24">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">
              {editing ? t("agents_page.edit_title", "Chỉnh sửa đại lý") : t("agents_page.create_title", "Thêm đại lý")}
            </h2>
            {editing && <Button variant="outline" onClick={() => setEditing(null)}>{t("agents_page.cancel_edit", "Hủy chỉnh sửa")}</Button>}
          </div>

          <AgentForm
            key={editing?.id ?? "create"}
            initialData={editing ?? undefined}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
          />
        </section>
      </main>

      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog(prev => ({ ...prev, open: false }))}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
