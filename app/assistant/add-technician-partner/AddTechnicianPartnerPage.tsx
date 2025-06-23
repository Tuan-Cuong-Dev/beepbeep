'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import AddTechnicianPartnerForm from '@/src/components/techinicianPartner/AddTechnicianPartnerForm';
import TechnicianPartnerTable from '@/src/components/techinicianPartner/TechnicianPartnerTable';
import { useTechnicianPartners } from '@/src/hooks/useTechnicianPartners';

export default function AddTechnicianPartnerPage() {
  const { partners, loading, fetchPartners, addPartner } = useTechnicianPartners();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-4 md:p-8 space-y-10">
        <div>
          <h2 className="text-xl font-bold mb-4">Existing Technician Partners</h2>
          <TechnicianPartnerTable
            partners={partners}
            onEdit={() => {}}
          />
        </div>

        <AddTechnicianPartnerForm onCreated={fetchPartners} />

      </main>

      <Footer />
    </div>
  );
}