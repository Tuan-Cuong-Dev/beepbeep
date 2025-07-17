'use client';

import Image from 'next/image';
import { useInsuranceProducts } from '@/src/hooks/useInsuranceProducts';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { cn } from '@/src/lib/utils';
import { useTranslation } from 'react-i18next';

export default function MyInsuranceProductsList() {
  const { t } = useTranslation('common');
  const { products, loading } = useInsuranceProducts();

  if (loading)
    return (
      <p className="text-sm text-gray-500">
        {t('my_insurance_products_list.loading')}
      </p>
    );

  if (!products || products.length === 0)
    return (
      <p className="text-sm text-gray-500">
        {t('my_insurance_products_list.no_products')}
      </p>
    );

  return (
    <div className="space-y-6">
      {/* Desktop Grid */}
      <div className="hidden md:grid grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border shadow-sm rounded-2xl p-4 flex flex-col justify-between"
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={240}
                className="rounded-md object-contain border"
              />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
                {t('my_insurance_products_list.no_image')}
              </div>
            )}

            <div className="mt-4 space-y-1 text-sm">
              <p className="font-semibold">{product.name}</p>
              <p className="text-gray-700">{product.coverageDetails}</p>
              <p className="text-gray-500">
                {t('my_insurance_products_list.duration')}: {product.durationInDays} {t('my_insurance_products_list.days')}
              </p>
              <p className="text-gray-800 font-medium">
                {t('my_insurance_products_list.price')}: {product.price.toLocaleString()}₫
              </p>
              <div className="flex gap-1 flex-wrap text-xs text-gray-600">
                {product.features?.map((f, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 px-2 py-1 rounded border"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <p
                className={cn(
                  'text-xs font-semibold inline-block mt-2',
                  product.isActive ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {product.isActive
                  ? t('my_insurance_products_list.active')
                  : t('my_insurance_products_list.inactive')}
              </p>
              <p className="text-xs text-gray-400">
                {t('my_insurance_products_list.created')}: {safeFormatDate(product.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile List */}
      <div className="md:hidden space-y-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border rounded-xl p-4 space-y-2 shadow-sm"
          >
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                width={400}
                height={240}
                className="rounded-md object-contain border"
              />
            ) : (
              <div className="w-full h-40 bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded">
                {t('my_insurance_products_list.no_image')}
              </div>
            )}

            <div className="text-sm space-y-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-gray-700">{product.coverageDetails}</p>
              <p className="text-gray-500">
                {t('my_insurance_products_list.duration')}: {product.durationInDays} {t('my_insurance_products_list.days')}
              </p>
              <p className="text-gray-800 font-medium">
                {t('my_insurance_products_list.price')}: {product.price.toLocaleString()}₫
              </p>
              <div className="flex gap-1 flex-wrap text-xs text-gray-600">
                {product.features?.map((f, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 px-2 py-1 rounded border"
                  >
                    {f}
                  </span>
                ))}
              </div>
              <p
                className={cn(
                  'text-xs font-semibold',
                  product.isActive ? 'text-green-600' : 'text-gray-400'
                )}
              >
                {product.isActive
                  ? t('my_insurance_products_list.active')
                  : t('my_insurance_products_list.inactive')}
              </p>
              <p className="text-xs text-gray-400">
                {t('my_insurance_products_list.created')}: {safeFormatDate(product.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
