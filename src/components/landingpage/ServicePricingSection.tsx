'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePublicServicePricing } from '@/src/hooks/usePublicServicePricing';
import ServiceCard from '@/src/components/servicePricing/ServiceCard';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { Button } from '@/src/components/ui/button';

export default function ServicePricingSection() {
  const { services, loading } = usePublicServicePricing();
  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();

  return (
    <section className="font-sans pt-0 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center pt-6">
        <span className="text-3xl font-extrabold">🛠️ Bíp Bíp 365</span>
        <br />
        <span className="text-2xl text-gray-700">Your 24/7 Vehicles Lifesaver</span>
      </h2>


        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading services...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex gap-4 w-max pb-2">
                {services.slice(0, 6).map((service) => (
                  <div
                    key={service.id}
                    className="min-w-[260px] max-w-[260px] flex-shrink-0"
                  >
                    <ServiceCard service={service} onContact={() => setShowNotice(true)} />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center">
              <Button
                size="sm"
                variant="default"
                onClick={() => router.push('/services')}
                className="text-white bg-[#00d289] hover:bg-[#00b47a] rounded-full px-6 py-2 text-sm shadow"
              >
                📋 View All Services
              </Button>
            </div>
          </>
        )}
      </div>

      <NotificationDialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        type="info"
        title="📞 Book Service"
        description="We're launching service booking soon! Stay tuned."
      />
    </section>
  );
}
