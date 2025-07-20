'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { useInsurancePackages } from '@/src/hooks/useInsurancePackages';
import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import { useMyPersonalVehicles } from '@/src/hooks/useMyPersonalVehicles';

export default function MyInsurancePackagesSection() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { packages, loading: loadingPackages } = useInsurancePackages();
  const { products, loading: loadingProducts } = useInsuranceProducts();
  const { vehicles, loading: loadingVehicles } = useMyPersonalVehicles();

  const isLoading = loadingPackages || loadingProducts || loadingVehicles;

  if (isLoading) {
    return <p className="text-sm text-gray-500">{t('my_insurance_packages_section.loading')}</p>;
  }

  if (packages.length === 0) {
    return <p className="text-sm text-gray-500">{t('my_insurance_packages_section.no_packages')}</p>;
  }

  const getStatusInfo = (pkg: typeof packages[number]) => {
    const expiredDate = pkg.expiredAt?.toDate?.() || pkg.expiredAt;
    const isExpired = expiredDate && expiredDate < new Date();
    const isApproved = pkg.approvalStatus === 'approved';
    const isPending = pkg.approvalStatus === 'pending';
    const isRejected = pkg.approvalStatus === 'rejected';
    const isActive = pkg.isActive && isApproved && !isExpired;

    if (isPending) return { label: t('my_insurance_packages_section.status.pending'), color: 'text-yellow-600' };
    if (isRejected) return { label: t('my_insurance_packages_section.status.rejected'), color: 'text-red-600' };
    if (isExpired) return { label: t('my_insurance_packages_section.status.expired'), color: 'text-gray-500' };
    if (isActive) return { label: t('my_insurance_packages_section.status.active'), color: 'text-green-600' };

    return { label: t('my_insurance_packages_section.status.inactive'), color: 'text-gray-500' };
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">🛡️ {t('my_insurance_packages_section.title')}</h2>

      {packages.map((pkg) => {
        const product = products.find((p) => p.id === pkg.productId);
        const vehicle = vehicles.find((v) => v.id === pkg.vehicleId);
        const createdDate = pkg.createdAt?.toDate?.() || pkg.createdAt;
        const expiredDate = pkg.expiredAt?.toDate?.() || pkg.expiredAt;
        const status = getStatusInfo(pkg);

        return (
          <div
            key={pkg.id}
            className={cn(
              'flex flex-col md:flex-row gap-4 border p-4 rounded-xl shadow-sm bg-white hover:shadow-md transition',
              status.label !== t('my_insurance_packages_section.status.active') && 'opacity-80'
            )}
          >
            {/* Image section */}
            <div className="flex-shrink-0 w-full md:w-[260px]">
              {pkg.imageUrl ? (
                <Image
                  src={pkg.imageUrl}
                  alt="Insurance Card"
                  width={400}
                  height={220}
                  className="rounded-md object-contain border w-full h-auto"
                />
              ) : (
                <div className="w-full h-[140px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
                  {t('my_insurance_packages_section.no_image')}
                </div>
              )}
            </div>

            {/* Info section */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-1 text-sm">
                <p className="text-base font-semibold text-gray-800">
                  {product?.name || t('my_insurance_packages_section.unnamed_product')}
                </p>
                <p className="text-xs text-gray-600">
                  {t('my_insurance_packages_section.code')}: {pkg.packageCode}
                </p>
                {vehicle && (
                  <p className="text-xs text-gray-600">
                    {t('my_insurance_packages_section.vehicle')}: {vehicle.name}
                  </p>
                )}
                {pkg.frameNumber && (
                  <p className="text-xs text-gray-600">
                    {t('my_insurance_packages_section.frame')}: {pkg.frameNumber}
                  </p>
                )}
                {pkg.engineNumber && (
                  <p className="text-xs text-gray-600">
                    {t('my_insurance_packages_section.engine')}: {pkg.engineNumber}
                  </p>
                )}
                {pkg.plateNumber && (
                  <p className="text-xs text-gray-600">
                    {t('my_insurance_packages_section.plate')}: {pkg.plateNumber}
                  </p>
                )}
                {expiredDate && (
                  <p className="text-xs text-gray-600">
                    {t('my_insurance_packages_section.expires')}: {safeFormatDate(expiredDate)}
                  </p>
                )}
                <p className={cn('text-sm font-semibold', status.color)}>{status.label}</p>
                {createdDate && (
                  <p className="text-[11px] text-gray-400">
                    {t('my_insurance_packages_section.created')}: {safeFormatDate(createdDate)}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/insurance-packages/${pkg.id}`)}
                >
                  {t('my_insurance_packages_section.view')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => router.push(`/insurance/${pkg.id}/extend`)}
                  disabled={status.label !== t('my_insurance_packages_section.status.active')}
                >
                  {t('my_insurance_packages_section.extend')}
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
