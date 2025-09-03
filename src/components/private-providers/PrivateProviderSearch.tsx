"use client";

import { useState } from "react";
import { Input } from "@/src/components/ui/input";
import type { PrivateProvider } from "@/src/lib/privateProviders/privateProviderTypes";

interface Props {
  providers: PrivateProvider[];
  onResult: (filtered: PrivateProvider[]) => void;
}

export default function PrivateProviderSearch({ providers, onResult }: Props) {
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
      placeholder="Tìm theo tên, email, điện thoại hoặc địa chỉ..."
      value={term}
      onChange={(e) => handleSearch(e.target.value)}
      className="max-w-md"
    />
  );
}
