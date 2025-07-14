'use client';

import { useParams } from 'next/navigation';
import { useInsurancePackages } from '@/src/hooks/useInsurancePackages';
import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import { useMyPersonalVehicles } from '@/src/hooks/useMyPersonalVehicles';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import Image from 'next/image';
import { cn } from '@/src/lib/utils';
import { Button } from '@/src/components/ui/button';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function InsurancePackageDetailPage() {
  const params = useParams();
  const packageId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const { packages } = useInsurancePackages();
  const { products } = useInsuranceProducts();
  const { vehicles } = useMyPersonalVehicles();

  if (!packageId) return <p className="text-sm text-gray-500">Invalid package ID.</p>;

  const pkg = packages.find((p) => p.id === packageId);
  const product = products.find((p) => p.id === pkg?.productId);
  const vehicle = vehicles.find((v) => v.id === pkg?.vehicleId);

  if (!pkg || !product) {
    return <p className="text-sm text-gray-500">Insurance package not found.</p>;
  }

  const createdAt = pkg.createdAt?.toDate?.() || pkg.createdAt;
  const expiredAt = pkg.expiredAt?.toDate?.() || pkg.expiredAt;
  const activatedAt = pkg.activatedAt?.toDate?.() || pkg.activatedAt;

  const isExpired = expiredAt && expiredAt < new Date();
  const isApproved = pkg.approvalStatus === 'approved';
  const isPending = pkg.approvalStatus === 'pending';
  const isRejected = pkg.approvalStatus === 'rejected';
  const isActive = pkg.isActive && isApproved && !isExpired;

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
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800 text-center md:text-left">
          🛡️ Insurance Package Details
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl shadow-sm">
          {/* LEFT: IMAGE CARD */}
          <div>
            {pkg.imageUrl || product.imageUrl ? (
              <Image
                src={pkg.imageUrl ?? product.imageUrl ?? ''}
                alt="Insurance Image"
                width={600}
                height={400}
                className="rounded-xl object-contain w-full border bg-white"
              />
            ) : (
              <div className="h-[160px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
                No image available
              </div>
            )}
          </div>

          {/* RIGHT: INFORMATION */}
          <div className="space-y-3 text-sm">
            <p className="text-base font-semibold text-gray-800">{product.name}</p>
            <p className="text-gray-700">{product.description}</p>

            {product.coverageDetails && (
              <p className="text-gray-700">
                <span className="font-medium">Coverage:</span> {product.coverageDetails}
              </p>
            )}

            {Array.isArray(product.features) && (
              <ul className="list-disc list-inside text-gray-600 text-xs">
                {product.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            )}

            <hr />

            <div className="space-y-1 text-gray-700 text-sm">
              <p><span className="font-medium">Duration:</span> {product.durationInDays} days</p>
              <p><span className="font-medium">Price:</span> {product.price?.toLocaleString()}₫</p>
              <p><span className="font-medium">Package Code:</span> {pkg.packageCode}</p>
              {vehicle?.name && (
                <p><span className="font-medium">Vehicle:</span> {vehicle.name}</p>
              )}
              {pkg.frameNumber && (
                <p><span className="font-medium">Frame Number:</span> {pkg.frameNumber}</p>
              )}
              {pkg.engineNumber && (
                <p><span className="font-medium">Engine Number:</span> {pkg.engineNumber}</p>
              )}
              {pkg.plateNumber && (
                <p><span className="font-medium">Plate:</span> {pkg.plateNumber}</p>
              )}
              {pkg.note && (
                <p><span className="font-medium">Note:</span> {pkg.note}</p>
              )}
              {activatedAt && (
                <p><span className="font-medium">Activated At:</span> {safeFormatDate(activatedAt)}</p>
              )}
              {expiredAt && (
                <p><span className="font-medium">Expires:</span> {safeFormatDate(expiredAt)}</p>
              )}
              <p className={cn('font-medium', statusColor)}>{statusLabel}</p>
              {createdAt && (
                <p className="text-[11px] text-gray-400">
                  Created: {safeFormatDate(createdAt)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => history.back()}>
            Back
          </Button>
          <Button size="sm" disabled={!isActive}>
            Extend Insurance
          </Button>
        </div>
      </div>
      <Footer />
    </>
  );
}
