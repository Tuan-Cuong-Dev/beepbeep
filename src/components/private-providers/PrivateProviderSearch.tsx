'use client';

import { useState } from "react";
import { Input } from "@/src/components/ui/input";
import type { PrivateProvider } from "@/src/lib/privateProviders/privateProviderTypes";
import { useTranslation } from "react-i18next";

interface Props {
  providers: PrivateProvider[];
  onResult: (filtered: PrivateProvider[]) => void;
}

export default function PrivateProviderSearch({ providers, onResult }: Props) {
  const { t } = useTranslation("common");
  const [term, setTerm] = useState("");

  const handleSearch = (value: string) => {
    setTerm(value);
    if (!value) {
      onResult(providers);
      return;
    }
    const filtered = providers.filter((p) =>
      [p.name, p.email, p.phone, p.displayAddress]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(value.toLowerCase()))
    );
    onResult(filtered);
  };

  return (
    <Input
      placeholder={t("private_provider_search.placeholder")}
      value={term}
      onChange={(e) => handleSearch(e.target.value)}
      className="max-w-md"
    />
  );
}
