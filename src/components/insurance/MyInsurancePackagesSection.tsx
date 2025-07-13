'use client';

import Image from 'next/image';
import { useInsurancePackages } from '@/src/hooks/useInsurancePackages';
import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { cn } from '@/src/lib/utils';

export default function MyInsurancePackagesSection() {
  const { packages, loading: loadingPackages } = useInsurancePackages();
  const { products, loading: loadingProducts } = useInsuranceProducts();
  const router = useRouter();

  const isLoading = loadingPackages || loadingProducts;

  if (isLoading) {
    return <p className="text-sm text-gray-500">Loading your insurance packages...</p>;
  }

  if (packages.length === 0) {
    return <p className="text-sm text-gray-500">You haven't purchased any insurance packages yet.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">🛡️ My Insurance Packages</h2>

      {packages.map((pkg) => {
        const product = products.find((p) => p.id === pkg.productId);
        const createdDate = pkg.createdAt?.toDate?.() || pkg.createdAt;
        const expiredDate = pkg.expiredAt?.toDate?.() || pkg.expiredAt;

        const isExpired = expiredDate && expiredDate < new Date();
        const isApproved = pkg.approvalStatus === 'approved';
        const isPending = pkg.approvalStatus === 'pending';
        const isRejected = pkg.approvalStatus === 'rejected';
        const isActive = pkg.isActive && isApproved && !isExpired;

        // Trạng thái gói bảo hiểm
        let statusLabel = '';
        let statusColor = 'text-gray-500';

        if (isPending) {
          statusLabel = '⏳ Pending Approval';
          statusColor = 'text-yellow-600';
        } else if (isRejected) {
          statusLabel = '❌ Rejected';
          statusColor = 'text-red-600';
        } else if (isExpired) {
          statusLabel = '📅 Expired';
          statusColor = 'text-gray-500';
        } else if (isActive) {
          statusLabel = '✅ Active';
          statusColor = 'text-green-600';
        } else {
          statusLabel = '⛔ Inactive';
          statusColor = 'text-gray-500';
        }

        return (
          <div
            key={pkg.id}
            className={cn(
              'flex flex-col md:flex-row gap-4 border p-4 rounded-xl shadow-sm bg-white hover:shadow-md transition',
              !isActive && 'opacity-80'
            )}
          >
            {/* Image */}
            <div className="flex-shrink-0 w-full md:w-[260px]">
              {product?.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt="Insurance"
                  width={400}
                  height={220}
                  className="rounded-md object-contain border w-full h-auto"
                />
              ) : (
                <div className="w-full h-[140px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
                  No image available
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div className="space-y-1 text-sm">
                <p className="text-base font-semibold text-gray-800">{product?.name || 'Unnamed Product'}</p>
                {product?.description && <p className="text-gray-700">{product.description}</p>}

                {product?.coverageDetails && (
                  <p className="text-gray-600">
                    <span className="font-medium">Coverage:</span> {product.coverageDetails}
                  </p>
                )}

                {Array.isArray(product?.features) && product.features.length > 0 && (
                <ul className="text-gray-500 list-disc list-inside text-xs">
                  {product.features.map((f, idx) => (
                    <li key={idx}>{f}</li>
                  ))}
                </ul>
              )}
                <p className="text-gray-600">
                  <span className="font-medium">Duration:</span> {product?.durationInDays} days
                </p>

                <p className="text-gray-600">
                  <span className="font-medium">Price:</span> {product?.price?.toLocaleString()}₫
                </p>

                {expiredDate && (
                  <p className="text-gray-600">
                    <span className="font-medium">Expires:</span> {safeFormatDate(expiredDate)}
                  </p>
                )}

                <p className={cn('text-sm font-semibold', statusColor)}>{statusLabel}</p>

                {createdDate && (
                  <p className="text-[11px] text-gray-400">
                    Created: {safeFormatDate(createdDate)}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/insurance/${pkg.productId}`)}
                >
                  View Details
                </Button>
                <Button size="sm" onClick={() => router.push(`/insurance/${pkg.id}/extend`)}>
                  Extend Insurance
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
