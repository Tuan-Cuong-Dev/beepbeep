'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import TechnicianPartnerCard from '@/src/components/techinicianPartner/TechnicianPartnerCard';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { Button } from '@/src/components/ui/button';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation'; // ✅ import hook

export default function TechnicianPartnerSection() {
  const { partners, loading } = usePublicTechnicianPartners();
  const [showNotice, setShowNotice] = useState(false);
  const { location: userLocation } = useCurrentLocation(); // ✅ lấy tọa độ
  const router = useRouter();

  return (
    <section className="font-sans pt-0 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          Need Help? Find a Technician
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading technician partners...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex gap-4 w-max pb-2">
                {partners.slice(0, 6).map((partner) => (
                  <div
                    key={partner.id}
                    className="min-w-[260px] max-w-[260px] flex-shrink-0"
                  >
                    <TechnicianPartnerCard
                      partner={partner}
                      onContact={() => setShowNotice(true)}
                      userLocation={userLocation} // ✅ truyền vị trí người dùng
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center">
              <Button
                size="sm"
                variant="default"
                onClick={() => router.push('/technician-partners')}
                className="text-white bg-[#00d289] hover:bg-[#00b47a] rounded-full px-6 py-2 text-sm shadow"
              >
                🔍 View All Technicians
              </Button>
            </div>
          </>
        )}
      </div>

      <NotificationDialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        type="info"
        title="📞 Contact Technician"
        description="We are building a contact system so you can reach technicians directly. Coming soon!"
      />
    </section>
  );
}
