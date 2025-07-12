'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { useInsurancePackages } from '@/src/hooks/useInsurancePackages';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { useAuth } from '@/src/hooks/useAuth';

export default function MyInsurancePackagesList() {
  const { currentUser, loading: authLoading } = useAuth();
  const { packages, loading: dataLoading } = useInsurancePackages();

  if (authLoading || dataLoading) return <p>Loading insurance packages...</p>;
  if (!packages || packages.length === 0) return <p>You have no insurance packages yet.</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {packages.map((pkg) => (
        <div
          key={pkg.id}
          className="bg-white rounded-2xl shadow-md border p-4 flex flex-col justify-between"
        >
          {/* Insurance card image */}
          {pkg.imageUrl ? (
            <Image
              src={pkg.imageUrl}
              alt="Insurance Card"
              width={400}
              height={240}
              className="rounded-md object-contain"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-sm">
              No card image available
            </div>
          )}

          {/* Package code and status */}
          <div className="mt-4 space-y-1 text-sm">
            <p className="font-medium">Package Code: {pkg.packageCode}</p>
            {pkg.isActive && pkg.activatedAt && pkg.expiredAt ? (
              <p className="text-green-600">
                Activated until: {safeFormatDate(pkg.expiredAt)}
              </p>
            ) : (
              <p className="text-yellow-600">Not activated</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            <Button asChild variant="outline">
              <Link href={`/insurance-packages/info/${pkg.packageCode.toLowerCase()}`}>
                View Package
              </Link>
            </Button>

            {!pkg.isActive && (
              <Button
                variant="default"
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('open-activate-insurance-modal', {
                      detail: { insurancePackageId: pkg.id },
                    })
                  )
                }
              >
                Activate Package
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
