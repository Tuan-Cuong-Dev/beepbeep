'use client';

import Image from 'next/image';
import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/ui/button';

export default function AvailableInsuranceProductsSection() {
  const { products, loading } = useInsuranceProducts();
  const router = useRouter();

  if (loading) {
    return <p className="text-sm text-gray-500">Loading insurance products...</p>;
  }

  if (products.length === 0) {
    return <p className="text-sm text-gray-500">No insurance products available at the moment.</p>;
  }

  return (
    <div className="space-y-4 mt-6">
      <h2 className="text-lg font-semibold">🛒 Available Insurance Products</h2>
      <div className="space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="flex flex-col md:flex-row items-start gap-4 border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white"
          >
            {/* Left: Image */}
            <div className="w-full md:w-[260px]">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  width={400}
                  height={220}
                  className="rounded-md object-contain border w-full h-auto"
                />
              ) : (
                <div className="h-[140px] bg-gray-100 flex items-center justify-center text-sm text-gray-400 rounded">
                  No image
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="flex-1 space-y-1 text-sm">
              <h3 className="text-base font-semibold text-gray-800">{product.name}</h3>
              <p className="text-gray-600">{product.description}</p>
              <p className="text-gray-500 text-sm mt-1">
                Duration: {product.durationInDays} days – Price:{' '}
                {product.price?.toLocaleString()}₫
              </p>
              <Button
                size="sm"
                className="mt-2"
                onClick={() => router.push(`/insurance/${product.id}`)}
              >
                View & Buy
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
