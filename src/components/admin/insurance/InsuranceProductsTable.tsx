'use client';

import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import { Button } from '@/src/components/ui/button';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import Image from 'next/image';
import { cn } from '@/src/lib/utils';
import { useState } from 'react';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { InsuranceProduct } from '@/src/lib/insuranceProducts/insuranceProductTypes';

export default function InsuranceProductsTable({
  onEdit,
}: {
  onEdit: (product: InsuranceProduct) => void;
}) {
  const { products, loading, remove } = useInsuranceProducts();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const confirmDelete = async () => {
    if (selectedProductId) {
      await remove(selectedProductId);
      setSelectedProductId(null);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  if (loading) {
    return <p className="text-gray-500 text-sm">Loading insurance products...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:block overflow-x-auto border rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left text-xs text-gray-600 uppercase">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Coverage</th>
              <th className="p-3">Duration</th>
              <th className="p-3">Features</th>
              <th className="p-3">Price</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition">
                <td className="p-3">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt="Product"
                      width={64}
                      height={40}
                      className="rounded border w-16 h-auto"
                    />
                  ) : (
                    <span className="text-xs text-gray-400 italic">No image</span>
                  )}
                </td>
                <td className="p-3 font-medium text-gray-900">{product.name}</td>
                <td className="p-3 text-gray-700">{product.coverageDetails}</td>
                <td className="p-3 text-gray-700">{product.durationInDays} days</td>
                <td className="p-3 text-gray-600 max-w-xs">
                  <ul className="list-disc pl-5 space-y-1">
                    {product.features?.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </td>
                <td className="p-3 text-gray-800 whitespace-nowrap">
                  {product.price.toLocaleString()}₫
                </td>
                <td className="p-3">
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-1 rounded-full',
                      product.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-gray-500">
                  {safeFormatDate(product.createdAt)}
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" onClick={() => onEdit(product)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm space-y-2">
            <div className="flex items-center gap-4">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt="Product"
                  width={60}
                  height={40}
                  className="rounded border w-16 h-auto"
                />
              ) : (
                <span className="text-xs text-gray-400 italic">No image</span>
              )}
              <div>
                <p className="font-semibold text-gray-800">{product.name}</p>
                <p className="text-xs text-gray-500">
                  {product.durationInDays} days
                </p>
              </div>
            </div>

            <div className="text-sm text-gray-700">{product.coverageDetails}</div>

            <div className="text-sm text-gray-600">
              <ul className="list-disc pl-5 space-y-1">
                {product.features?.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-800 font-semibold">
                {product.price.toLocaleString()}₫
              </span>
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-1 rounded-full',
                  product.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-200 text-gray-600'
                )}
              >
                {product.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="text-xs text-gray-500">
              Created: {safeFormatDate(product.createdAt)}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" onClick={() => onEdit(product)}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setSelectedProductId(product.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <NotificationDialog
        open={!!selectedProductId}
        type="confirm"
        title="Confirm delete"
        description={`Are you sure you want to delete "${
          selectedProduct?.name || 'this insurance product'
        }"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}
