'use client';

import Image from 'next/image';
import { safeFormatDate } from '@/src/utils/safeFormatDate';

interface Insurance {
  name: string;              // ví dụ: Gói Bíp Bíp 365K
  packageCode: string;       // mã như BIP365-DE01-9023-X7F2
  imageUrl?: string;         // link ảnh thẻ PNG
  expiredAt?: string | Date; // ISO string hoặc Date object
}

interface MyInsuranceSectionProps {
  insurances: Insurance[];
}

export default function MyInsuranceSection({ insurances }: MyInsuranceSectionProps) {
  return (
    <div className="p-4 border-t space-y-4">
      <h2 className="text-lg font-semibold">My Insurance Packages</h2>
      {insurances.length === 0 ? (
        <p className="text-sm text-gray-500">
          You haven't purchased any insurance packages yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {insurances.map((pkg, idx) => (
            <div
              key={idx}
              className="border p-4 rounded-xl shadow-sm space-y-2 bg-white"
            >
              {/* Ảnh thẻ nếu có */}
              {pkg.imageUrl ? (
                <Image
                  src={pkg.imageUrl}
                  alt="Insurance Card"
                  width={400}
                  height={220}
                  className="rounded-md object-contain"
                />
              ) : (
                <div className="w-full h-[140px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
                  No image available
                </div>
              )}

              {/* Tên + mã + ngày hết hạn */}
              <div className="space-y-1 text-sm">
                <p className="font-medium">{pkg.name}</p>
                <p className="text-gray-600">Code: {pkg.packageCode}</p>
                <p className="text-gray-500">
                  Valid Until: {safeFormatDate(pkg.expiredAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
