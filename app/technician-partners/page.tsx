'use client';

import dynamic from 'next/dynamic';
import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import { useState, useMemo } from 'react';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';
import { SimpleSelect } from '@/src/components/ui/select';

// Dynamic import để tắt SSR cho bản đồ
const TechnicianPartnerMap = dynamic(() => import('@/src/components/techinicianPartner/TechnicianPartnerMap'), {
  ssr: false,
});

export default function TechnicianPartnerPage() {
  const { partners, loading } = usePublicTechnicianPartners();
  const [showNotice, setShowNotice] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');

  const regions = useMemo(() => {
    const allRegions = partners.flatMap((p) => p.assignedRegions || []);
    return Array.from(new Set(allRegions)).sort();
  }, [partners]);

  const services = useMemo(() => {
    const allServices = partners.flatMap((p) => p.serviceCategories || []);
    return Array.from(new Set(allServices)).sort();
  }, [partners]);

  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.assignedRegions?.some((r) =>
          r.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchRegion = regionFilter
        ? p.assignedRegions?.includes(regionFilter)
        : true;

      const matchService = serviceFilter
        ? p.serviceCategories?.includes(serviceFilter)
        : true;

      return matchSearch && matchRegion && matchService;
    });
  }, [partners, searchTerm, regionFilter, serviceFilter]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2">
          Find a Technician Partner
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Our trusted technician partners are ready to assist you across regions.
        </p>

        {/* Bộ lọc */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Input
            placeholder="🔍 Search by name or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3"
          />
          <SimpleSelect
            value={regionFilter}
            onChange={setRegionFilter}
            placeholder="🌍 Filter by region"
            options={[{ label: 'All regions', value: '' }, ...regions.map(r => ({ label: r, value: r }))]}
            className="w-full md:w-1/4"
          />
          <SimpleSelect
            value={serviceFilter}
            onChange={setServiceFilter}
            placeholder="🛠️ Filter by service"
            options={[{ label: 'All services', value: '' }, ...services.map(s => ({ label: s, value: s }))]}
            className="w-full md:w-1/4"
          />
        </div>

        {/* Bản đồ kỹ thuật viên */}
        <TechnicianPartnerMap partners={filteredPartners} />

        {/* Danh sách kỹ thuật viên */}
        {loading ? (
          <p className="text-center text-gray-500 text-lg mt-10">⏳ Loading technician partners...</p>
        ) : filteredPartners.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">
            No matching technicians found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPartners.map((partner) => {
              const services = partner.serviceCategories ?? [];

              return (
                <div
                  key={partner.id}
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition p-5 flex flex-col items-center text-center"
                >
                  <h3 className="text-lg font-semibold">{partner.name}</h3>
                  <p className="text-sm text-gray-600 capitalize mb-1">
                    {partner.type === 'shop' ? 'Shop Technician' : 'Mobile Technician'}
                  </p>

                  <p className="text-sm text-green-700 mb-2">
                    {partner.assignedRegions?.join(', ') || 'N/A'}
                  </p>

                  {services.length > 0 && (
                    <div className="text-xs text-gray-600 mb-2 w-full">
                      <p className="font-medium text-gray-700 mb-1">Services:</p>
                      <ul className="list-disc list-inside text-left">
                        {services.slice(0, 3).map((cat, i) => (
                          <li key={i}>{cat}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p className="text-sm text-yellow-600 mb-4">
                    ⭐ {partner.averageRating?.toFixed(1) || 'N/A'} ({partner.ratingCount || 0})
                  </p>

                  <Button
                    size="sm"
                    variant="greenOutline"
                    onClick={() => setShowNotice(true)}
                    className="px-4 py-2 text-sm font-semibold text-[#00d289] border-[#00d289] hover:bg-[#00d289]/10 rounded-full"
                  >
                    📞 Contact
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />

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
