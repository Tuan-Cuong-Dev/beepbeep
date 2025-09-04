'use client';

import type { PrivateProvider } from "@/src/lib/privateProviders/privateProviderTypes";
import Button from '@/src/components/ui/button';
import { useTranslation } from "react-i18next";

interface Props {
  providers: PrivateProvider[];
  onEdit: (provider: PrivateProvider) => void;
  onDelete: (id: string) => void;
}

export default function PrivateProviderList({ providers, onEdit, onDelete }: Props) {
  const { t } = useTranslation("common");

  const renderCoords = (p: PrivateProvider) =>
    p.location?.geo
      ? `${p.location.geo.latitude.toFixed(4)}, ${p.location.geo.longitude.toFixed(4)}`
      : p.location?.location || "-";

  /* ========== Mobile: Cards (block md:hidden) ========== */
  const MobileCards = () => (
    <div className="md:hidden space-y-3">
      {providers.length === 0 ? (
        <div className="rounded-md border p-4 text-center text-gray-500">
          {t("private_provider_table.no_data")}
        </div>
      ) : (
        providers.map((p) => (
          <div
            key={p.id}
            className="rounded-md border p-4 bg-white shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-base">{p.name}</h3>
                <p className="text-xs text-gray-500">{p.businessType === "private_provider" ? t("private_provider_table.private_provider_label", "Cá nhân") : ""}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(p)}
                  aria-label={`${t("private_provider_table.edit")} ${p.name}`}
                >
                  {t("private_provider_table.edit")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(p.id)}
                  aria-label={`${t("private_provider_table.delete")} ${p.name}`}
                >
                  {t("private_provider_table.delete")}
                </Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="min-w-20 text-gray-500">{t("private_provider_table.email")}:</span>
                <span className="break-all">{p.email || "-"}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="min-w-20 text-gray-500">{t("private_provider_table.phone")}:</span>
                <span>{p.phone || "-"}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="min-w-20 text-gray-500">{t("private_provider_table.address")}:</span>
                {p.location?.mapAddress ? (
                  <a
                    href={p.location.mapAddress}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00d289] hover:underline break-words"
                  >
                    {p.displayAddress || p.location.mapAddress}
                  </a>
                ) : (
                  <span className="break-words">{p.displayAddress || "-"}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="min-w-20 text-gray-500">{t("private_provider_table.coordinates")}:</span>
                <span>{renderCoords(p)}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  /* ========== Desktop: Table (hidden md:block) ========== */
  const DesktopTable = () => (
    <div className="hidden md:block overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="p-2 text-left">{t("private_provider_table.name")}</th>
            <th className="p-2 text-left">{t("private_provider_table.email")}</th>
            <th className="p-2 text-left">{t("private_provider_table.phone")}</th>
            <th className="p-2 text-left">{t("private_provider_table.address")}</th>
            <th className="p-2 text-left whitespace-nowrap">{t("private_provider_table.coordinates")}</th>
            <th className="p-2 text-center w-[180px]">{t("private_provider_table.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.id} className="border-t hover:bg-gray-50">
              <td className="p-2">{p.name}</td>
              <td className="p-2">{p.email}</td>
              <td className="p-2">{p.phone}</td>
              <td className="p-2">
                {p.location?.mapAddress ? (
                  <a
                    href={p.location.mapAddress}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#00d289] hover:underline"
                  >
                    {p.displayAddress || p.location.mapAddress}
                  </a>
                ) : (
                  p.displayAddress || "-"
                )}
              </td>
              <td className="p-2">{renderCoords(p)}</td>
              <td className="p-2">
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(p)}
                    aria-label={`${t("private_provider_table.edit")} ${p.name}`}
                  >
                    {t("private_provider_table.edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(p.id)}
                    aria-label={`${t("private_provider_table.delete")} ${p.name}`}
                  >
                    {t("private_provider_table.delete")}
                  </Button>
                </div>
              </td>
            </tr>
          ))}

          {providers.length === 0 && (
            <tr>
              <td className="p-4 text-center text-gray-500" colSpan={6}>
                {t("private_provider_table.no_data")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <MobileCards />
      <DesktopTable />
    </>
  );
}
