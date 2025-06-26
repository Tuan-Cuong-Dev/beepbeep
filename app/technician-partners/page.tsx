'use client';

import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

export default function TechnicianPartnerPage() {
  const { partners, loading } = usePublicTechnicianPartners();
  const [showNotice, setShowNotice] = useState(false);

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-8">
          All Technician Partners
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading technician partners...</p>
        ) : partners.length === 0 ? (
          <p className="text-center text-gray-500">No technicians available at the moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {partners.map((partner) => {
              const services = partner.serviceCategories ?? [];

              return (
                <div
                  key={partner.id}
                  className="bg-white text-gray-800 p-5 rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <h3 className="text-lg font-semibold">{partner.name}</h3>
                  <p className="text-sm text-gray-600 capitalize">{partner.type} technician</p>
                  <p className="text-sm mt-1 text-green-600">
                    {partner.assignedRegions?.join(', ') || 'N/A'}
                  </p>

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

                  <p className="text-sm mt-2 text-yellow-600">
                    ⭐ {partner.averageRating?.toFixed(1) || 'N/A'} ({partner.ratingCount || 0})
                  </p>

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
        )}
      </div>

      {/* Notification */}
      <NotificationDialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        type="info"
        title="📞 Contact Technician"
        description="We are building a contact system so you can reach technicians directly. Coming soon!"
      />
    </div>
  );
}
