'use client';

import dynamic from 'next/dynamic';
import { usePublicTechnicianPartners } from '@/src/hooks/usePublicTechnicianPartners';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation'; // ✅ mới
import { useState, useMemo } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';
import { SimpleSelect } from '@/src/components/ui/select';
import TechnicianPartnerCard from '@/src/components/techinicianPartner/TechnicianPartnerCard';

const TechnicianPartnerMap = dynamic(
  () => import('@/src/components/techinicianPartner/TechnicianPartnerMap'),
  { ssr: false }
);

export default function TechnicianPartnerPage() {
  const { partners, loading } = usePublicTechnicianPartners();
  const { location: userLocation } = useCurrentLocation(); // ✅ dùng vị trí người dùng
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
            options={[{ label: 'All regions', value: '' }, ...regions.map((r) => ({ label: r, value: r }))]}
            className="w-full md:w-1/4"
          />
          <SimpleSelect
            value={serviceFilter}
            onChange={setServiceFilter}
            placeholder="🛠️ Filter by service"
            options={[{ label: 'All services', value: '' }, ...services.map((s) => ({ label: s, value: s }))]}
            className="w-full md:w-1/4"
          />
        </div>

        <TechnicianPartnerMap partners={filteredPartners} />

        {loading ? (
          <p className="text-center text-gray-500 text-lg mt-10">⏳ Loading technician partners...</p>
        ) : filteredPartners.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">
            No matching technicians found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredPartners.map((partner) => (
              <TechnicianPartnerCard
                key={partner.id}
                partner={partner}
                onContact={() => setShowNotice(true)}
                userLocation={userLocation} // ✅ truyền userLocation vào đây
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
