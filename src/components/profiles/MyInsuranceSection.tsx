'use client';

import Image from 'next/image';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { cn } from '@/src/lib/utils';
import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';

export default function MyInsuranceSection() {
  const { products, loading } = useInsuranceProducts();

  return (
    <div className="p-4 border-t space-y-4">
      <h2 className="text-lg font-semibold">🛡️ My Insurance Products</h2>

      {loading ? (
        <p className="text-sm text-gray-500">Loading your insurance products...</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-gray-500">
          You haven't created any insurance products yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((product, idx) => {
            const isActive = product.isActive;
            const createdDate = product.createdAt?.toDate?.() || product.createdAt;

            return (
              <div
                key={product.id}
                className={cn(
                  'border p-4 rounded-xl shadow-sm space-y-3 bg-white transition hover:shadow-md',
                  !isActive && 'opacity-70'
                )}
              >
                {/* Image */}
                {product.imageUrl ? (
                  <Image
                    src={product.imageUrl}
                    alt="Insurance Product"
                    width={400}
                    height={220}
                    className="rounded-md object-contain border"
                  />
                ) : (
                  <div className="w-full h-[140px] bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
                    No image available
                  </div>
                )}

                {/* Info */}
                <div className="space-y-1 text-sm">
                  <p className="font-medium text-gray-800">{product.name}</p>
                  <p className="text-gray-600 text-xs">{product.coverageDetails}</p>
                  <p className="text-gray-500 text-xs">
                    Duration: {product.durationInDays} days
                  </p>
                  <p className="text-gray-700 font-medium text-sm">
                    Price: {product.price.toLocaleString()}₫
                  </p>
                  <p
                    className={cn(
                      'text-xs font-semibold',
                      isActive ? 'text-green-600' : 'text-red-500'
                    )}
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </p>
                  {createdDate && (
                    <p className="text-[11px] text-gray-400">
                      Created: {safeFormatDate(createdDate)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
