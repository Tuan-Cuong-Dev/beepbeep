'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePublicServicePricing } from '@/src/hooks/usePublicServicePricing';
import ServiceCard from '@/src/components/servicePricing/ServiceCard';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import SkeletonCard from '@/src/components/skeletons/SkeletonCard';
import { useTranslation } from 'react-i18next';

export default function ServicePricingSection() {
  const { services, loading } = usePublicServicePricing();
  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();
  const { t, i18n } = useTranslation();

  // 👉 Ẩn nếu ngôn ngữ hiện tại không phải tiếng Việt
  if (i18n.language !== 'vi') return null;

  return (
    <section className="font-sans pt-0 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {!loading && (
          <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center pt-6">
            <span className="sm:text-2xl md:text-3xl font-extrabold">
              {t('serviceSection.title')}
            </span>
            <br />
            <span className="sm:text-lg md:text-xl text-gray-700">
              {t('serviceSection.subtitle')}
            </span>
          </h2>
        )}

        <div className="overflow-x-auto">
          <div className="flex gap-4 w-max pb-2">
            {loading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : services.slice(0, 6).map((service) => (
                  <div
                    key={service.id}
                    className="min-w-[260px] max-w-[260px] flex-shrink-0"
                  >
                    <ServiceCard
                      service={service}
                      onContact={() => setShowNotice(true)}
                    />
                  </div>
                ))}

            {!loading && (
              <div
                onClick={() => router.push('/services')}
                className="min-w-[260px] max-w-[260px] flex-shrink-0 cursor-pointer"
              >
                <div className="border rounded-xl shadow bg-white h-full flex flex-col items-center justify-center p-6 text-center hover:shadow-md transition">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {t('serviceSection.view_all')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('serviceSection.see_all_services')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NotificationDialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        type="info"
        title={t('serviceSection.notification_title')}
        description={t('serviceSection.notification_description')}
      />
    </section>
  );
}
