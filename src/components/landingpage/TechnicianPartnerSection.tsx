'use client';

import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { Button } from '@/src/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TechnicianPartnerSection() {
  const { partners, loading } = usePublicTechnicianPartners();
  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();

  return (
    <section className="font-sans py-10 px-4 bg-gray-100">
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
                {partners.slice(0, 6).map((partner) => {
                  const services = partner.serviceCategories ?? [];

                  return (
                    <div
                      key={partner.id}
                      className="bg-white text-gray-800 p-5 rounded-2xl shadow-md min-w-[260px] max-w-[260px] flex-shrink-0 hover:shadow-xl transition-shadow duration-300"
                    >
                      {/* 🖼️ Avatar */}
                      <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-3 border border-gray-300">
                        <img
                          src={partner.avatarUrl || '/assets/images/technician.png'}
                          alt={`${partner.name}'s avatar`}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* 👤 Tên và loại */}
                      <h3 className="text-lg font-semibold text-center">{partner.name}</h3>
                      <p className="text-sm text-gray-600 capitalize text-center">
                        {partner.type === 'shop' ? 'Shop Technician' : 'Mobile Technician'}
                      </p>

                      {/* 📍 Khu vực */}
                      <p className="text-sm mt-1 text-green-600 text-center">
                        {partner.assignedRegions?.join(', ') || 'N/A'}
                      </p>

                      {/* 🛠️ Dịch vụ */}
                      {services.length > 0 && (
                        <div className="text-xs text-gray-600 mt-2 space-y-1">
                          <p className="font-medium text-gray-700">Services:</p>
                          <ul className="list-disc list-inside">
                            {services.slice(0, 3).map((cat, i) => (
                              <li key={i}>{cat}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* ⭐ Đánh giá */}
                      <p className="text-sm mt-2 text-yellow-600 text-center">
                        ⭐ {partner.averageRating?.toFixed(1) || 'N/A'} ({partner.ratingCount || 0})
                      </p>

                      {/* 📞 Nút liên hệ */}
                      <div className="mt-4 flex justify-center">
                        <Button
                          size="sm"
                          variant="greenOutline"
                          onClick={() => setShowNotice(true)}
                          className="py-2 text-lg rounded-sm shadow-lg"
                        >
                          📞 Contact
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🔍 Nút "Xem tất cả" */}
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

      {/* 🔔 Thông báo */}
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
