// 04/09/2025
"use client";

import type { Agent } from "@/src/lib/agents/agentTypes";
import Button from "@/src/components/ui/button";
import { useTranslation } from "react-i18next";

export default function AgentTable({
  agents, onEdit, onDelete,
}: {
  agents: Agent[];
  onEdit: (a: Agent) => void;
  onDelete: (id: string) => void;
}) {
  const { t } = useTranslation("common");

  return (
    <div className="w-full">
      {/* Mobile cards */}
      <div className="grid gap-3 sm:hidden">
        {agents.map(a => (
          <div key={a.id} className="rounded-xl border p-3 bg-white shadow-sm">
            <div className="font-semibold">{a.name}</div>
            <div className="text-sm text-gray-600">{a.email || "—"}</div>
            <div className="text-sm">{a.phone || "—"}</div>
            <div className="text-sm text-gray-700">{a.displayAddress || "—"}</div>
            <div className="text-xs text-gray-500 mt-1">
              {a.location?.geo
                ? `${a.location.geo.latitude.toFixed(4)}, ${a.location.geo.longitude.toFixed(4)}`
                : a.location?.location || "—"}
            </div>
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" onClick={() => onEdit(a)}>
                {t("agent_table.edit", "Sửa")}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(a.id)}>
                {t("agent_table.delete", "Xóa")}
              </Button>
            </div>
          </div>
        ))}
        {agents.length === 0 && <p className="text-center text-sm text-gray-500">{t("agent_table.no_data", "Không có dữ liệu")}</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">{t("agent_table.name", "Tên")}</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">{t("agent_table.phone", "Điện thoại")}</th>
              <th className="p-2 text-left">{t("agent_table.address", "Địa chỉ")}</th>
              <th className="p-2 text-left">{t("agent_table.coordinates", "Tọa độ")}</th>
              <th className="p-2 text-center w-[160px]">{t("agent_table.actions", "Hành động")}</th>
            </tr>
          </thead>
          <tbody>
            {agents.map(a => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.email}</td>
                <td className="p-2">{a.phone}</td>
                <td className="p-2">{a.displayAddress}</td>
                <td className="p-2">
                  {a.location?.geo
                    ? `${a.location.geo.latitude.toFixed(4)}, ${a.location.geo.longitude.toFixed(4)}`
                    : a.location?.location || "—"}
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(a)}>
                      {t("agent_table.edit", "Sửa")}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(a.id)}>
                      {t("agent_table.delete", "Xóa")}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {agents.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  {t("agent_table.no_data", "Không có dữ liệu")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
