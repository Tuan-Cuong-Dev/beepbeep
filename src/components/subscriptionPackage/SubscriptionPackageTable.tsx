'use client';

import { useEffect, useState } from 'react';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { Button } from '@/src/components/ui/button';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { useTranslation } from 'react-i18next';

interface Props {
  packages: SubscriptionPackage[];
  onEdit: (pkg: SubscriptionPackage) => void;
  onDelete: (id: string) => void;
}

export default function SubscriptionPackageTable({ packages, onEdit, onDelete }: Props) {
  const { t } = useTranslation('common');
  const [companyMap, setCompanyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCompanyNames = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'rentalCompanies'));
        const map: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          map[docSnap.id] = (data as any).name || 'Unknown Company';
        });
        setCompanyMap(map);
      } catch (err) {
        console.error('❌ Error fetching company names:', err);
      }
    };
    fetchCompanyNames();
  }, []);

  const sortedPackages = [...packages].sort((a, b) =>
    a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' })
  );

  // ------ MOBILE (cards) ------
  const MobileCards = (
    <div className="md:hidden space-y-3">
      {sortedPackages.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 bg-white border border-dashed border-gray-300 rounded-xl">
          <div className="text-3xl">📦</div>
          <p className="text-sm text-gray-600">{t('subscription_package_table.no_packages')}</p>
        </div>
      ) : (
        sortedPackages.map((pkg) => {
          const companyName = pkg.companyId ? companyMap[pkg.companyId] || pkg.companyId : 'Unknown Company';
          const statusBadge =
            pkg.status === 'inactive'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700';

          return (
            <div
              key={pkg.id}
              className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm transition hover:shadow-md"
            >
              {/* Header: name + status */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{pkg.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate">
                    {t('subscription_package_table.company')}: {companyName}
                  </div>
                </div>
                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge}`}>
                  {pkg.status
                    ? t(`subscription_package_table.${pkg.status}`)
                    : t('subscription_package_table.available')}
                </span>
              </div>

              {/* Meta grid */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-gray-500">{t('subscription_package_table.duration')}</div>
                  <div className="text-gray-900 capitalize">
                    {t(`subscription_package_table.duration_type.${pkg.durationType}`)}
                  </div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-gray-500">{t('subscription_package_table.charging')}</div>
                  <div className="text-gray-900 capitalize">
                    {t(`subscription_package_table.charging_method.${pkg.chargingMethod}`)}
                  </div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-gray-500">{t('subscription_package_table.km_limit')}</div>
                  <div className="text-gray-900">
                    {pkg.kmLimit ?? t('subscription_package_table.unlimited')}
                  </div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-gray-500">{t('subscription_package_table.base_price')}</div>
                  <div className="text-gray-900">{formatCurrency(pkg.basePrice)}</div>
                </div>
                <div className="rounded-lg border p-2 col-span-2">
                  <div className="text-xs text-gray-500">{t('subscription_package_table.overage_rate')}</div>
                  <div className="text-gray-900">
                    {pkg.overageRate != null ? `${formatCurrency(pkg.overageRate)}/km` : '-'}
                  </div>
                </div>
              </div>

              {/* Note */}
              {pkg.note ? (
                <div className="mt-3 text-sm text-gray-800">
                  <span className="text-xs text-gray-500">{t('subscription_package_table.note')}</span>
                  <div className="mt-1 whitespace-pre-line break-words">{pkg.note}</div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" className="w-full" onClick={() => onEdit(pkg)}>
                  {t('subscription_package_table.edit')}
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => onDelete(pkg.id!)}>
                  {t('subscription_package_table.delete')}
                </Button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ------ DESKTOP (table) ------
  const DesktopTable = (
    <div className="hidden md:block bg-white p-6 rounded-xl shadow mt-6 overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4">
        {t('subscription_package_table.title')}
      </h2>
      <table className="min-w-full text-sm border border-gray-200">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 border">{t('subscription_package_table.company')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.name')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.duration')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.km_limit')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.charging')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.base_price')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.overage_rate')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.note')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.status')}</th>
            <th className="px-3 py-2 border">{t('subscription_package_table.actions')}</th>
          </tr>
        </thead>
        <tbody>
          {sortedPackages.map((pkg) => (
            <tr key={pkg.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border text-gray-700 font-semibold">
                {pkg.companyId ? (companyMap[pkg.companyId] || pkg.companyId) : 'Unknown Company'}
              </td>
              <td className="px-3 py-2 border font-medium">{pkg.name}</td>
              <td className="px-3 py-2 border capitalize">
                {t(`subscription_package_table.duration_type.${pkg.durationType}`)}
              </td>
              <td className="px-3 py-2 border text-center">
                {pkg.kmLimit ?? t('subscription_package_table.unlimited')}
              </td>
              <td className="px-3 py-2 border capitalize">
                {t(`subscription_package_table.charging_method.${pkg.chargingMethod}`)}
              </td>
              <td className="px-3 py-2 border text-right">{formatCurrency(pkg.basePrice)}</td>
              <td className="px-3 py-2 border text-right">
                {pkg.overageRate !== undefined && pkg.overageRate !== null
                  ? `${formatCurrency(pkg.overageRate)}/km`
                  : '-'}
              </td>
              <td className="px-3 py-2 border">{pkg.note ?? '-'}</td>
              <td className="px-3 py-2 border text-center">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    pkg.status === 'inactive'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
                  {pkg.status
                    ? t(`subscription_package_table.${pkg.status}`)
                    : t('subscription_package_table.available')}
                </span>
              </td>
              <td className="px-3 py-2 border">
                <div className="flex gap-2 justify-center">
                  <Button size="sm" onClick={() => onEdit(pkg)}>
                    {t('subscription_package_table.edit')}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(pkg.id!)}>
                    {t('subscription_package_table.delete')}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {packages.length === 0 && (
            <tr>
              <td colSpan={10} className="text-center py-6 text-gray-500">
                {t('subscription_package_table.no_packages')}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Mobile cards */}
      {MobileCards}
      {/* Desktop table */}
      {DesktopTable}
    </div>
  );
}
