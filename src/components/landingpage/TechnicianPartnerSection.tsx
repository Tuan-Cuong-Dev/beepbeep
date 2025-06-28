'use client';

import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { Button } from '@/src/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import TechnicianPartnerCard from '@/src/components/techinicianPartner/TechnicianPartnerCard';

export default function TechnicianPartnerSection() {
  const { partners, loading } = usePublicTechnicianPartners();
  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();

  return (
    <section className="font-sans pt-4 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 text-center">
          Need Help? Find a Technician
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading technician partners...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex gap-6 pb-4 md:pb-6 w-max">
                {partners.slice(0, 6).map((partner) => (
                  <div key={partner.id} className="min-w-[260px] max-w-[260px] flex-shrink-0">
                    <TechnicianPartnerCard partner={partner} onContact={() => setShowNotice(true)} />
                  </div>
                ))}
              </div>
            </div>

            {/* 🔍 View All Button */}
            <div className="mt-6 text-center">
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

      {/* 🔔 Contact Notice */}
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