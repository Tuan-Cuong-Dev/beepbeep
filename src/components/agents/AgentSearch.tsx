// 04/09/2025
"use client";

import type { Agent } from "@/src/lib/agents/agentTypes";
import { Input } from "@/src/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export default function AgentSearch({
  agents, onResult,
}: {
  agents: Agent[];
  onResult: (rows: Agent[] | null) => void; // null = reset
}) {
  const { t } = useTranslation("common");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q.trim()) return null;
    const s = q.toLowerCase();
    return agents.filter(a =>
      [a.name, a.email, a.phone, a.displayAddress]
        .filter(Boolean)
        .some(v => (v as string).toLowerCase().includes(s))
    );
  }, [agents, q]);

  useEffect(() => {
    onResult(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, agents]);

  return (
    <div className="flex items-center gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("agent_search.placeholder", "Tìm theo tên, sđt, email, địa chỉ...")}
        className="max-w-md"
      />
    </div>
  );
}
