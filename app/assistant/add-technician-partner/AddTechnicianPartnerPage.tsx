'use client';

import { useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import TechnicianPartnerForm from '@/src/components/techinicianPartner/TechnicianPartnerForm';
import TechnicianPartnerTable from '@/src/components/techinicianPartner/TechnicianPartnerTable';
import { useTechnicianPartners } from '@/src/hooks/useTechnicianPartners';
import { Wrench } from 'lucide-react';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

export default function AddTechnicianPartnerPage() {
  const { partners, loading, fetchPartners, addPartner, updatePartner, deletePartner } = useTechnicianPartners();
  const [editingPartner, setEditingPartner] = useState<TechnicianPartner | null>(null);

  const handleEdit = (partner: TechnicianPartner) => {
    setEditingPartner(partner);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this technician partner?')) {
      await deletePartner(id);
    }
  };

  const handleSave = async (data: Partial<TechnicianPartner>) => {
    if (editingPartner) {
      await updatePartner(editingPartner.id, data);
    } else {
      await addPartner(data as TechnicianPartner);
    }
    fetchPartners();
    setEditingPartner(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-4 md:p-8 space-y-10">
        <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Wrench className="w-6 h-6" />
          Manage Technician Partners
        </h1>

        <div>
          <h2 className="text-xl font-bold mb-4">Existing Technician Partners</h2>
          <TechnicianPartnerTable
            partners={partners}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">
            {editingPartner ? 'Edit Technician Partner' : 'Add New Technician Partner'}
          </h2>
          <TechnicianPartnerForm
            initialData={editingPartner || undefined}
            onSave={handleSave}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
