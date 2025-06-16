'use client';

import { useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';
import { useServicePricings } from '@/src/hooks/useServicePricings';
import ServicePricingForm from '@/src/components/servicePricing/ServicePricingForm';
import ServicePricingTable from '@/src/components/servicePricing/ServicePricingTable';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function ServicePricingManagementPage() {
  const { user } = useUser();
  const {
    servicePricings,
    createServicePricing,
    updateServicePricing,
    deleteServicePricing,
    loading,
  } = useServicePricings();

  const [selected, setSelected] = useState<ServicePricing | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-4 py-10 max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🧾 Service Pricing Management
        </h1>

        <section className="bg-white p-6 rounded-2xl shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">➕ Add / Edit Service Pricing</h2>
          <ServicePricingForm
            key={selected?.id || 'new'}
            existing={selected}
            onSaved={() => setSelected(null)}
          />
        </section>

        <section className="bg-white p-6 rounded-2xl shadow border border-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">📋 All Service Pricings</h2>
          <ServicePricingTable
            servicePricings={servicePricings}
            onEdit={(item) => setSelected(item)}
            onDelete={deleteServicePricing}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
