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
import { serverTimestamp } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { useTranslation } from 'react-i18next';

export default function AddTechnicianPartnerPage() {
  const { t } = useTranslation('common');

  const {
    partners,
    loading,
    fetchPartners,
    addPartner,
    updatePartner,
    deletePartner,
  } = useTechnicianPartners();

  const [editingPartner, setEditingPartner] = useState<TechnicianPartner | null>(null);

  // Dialog state
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleEdit = (partner: TechnicianPartner) => {
    setEditingPartner(partner);
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deletePartner(deleteTargetId);
      fetchPartners();
      setDeleteTargetId(null);
      setShowDeleteDialog(false);
    }
  };

  const handleSave = async (
    data: Partial<TechnicianPartner & { email?: string; password?: string }>
  ) => {
    const isEditing = !!editingPartner?.id;

    const finalData: Partial<TechnicianPartner> = {
      ...data,
      role: 'technician_partner',
      updatedAt: serverTimestamp(),
    };

    if (isEditing) {
      await updatePartner(editingPartner.id, finalData);
      setSuccessMessage(t('add_technician_partner_page.updated_success'));
    } else {
      const hasLogin = !!data.email && !!data.password;
      await addPartner({
        ...finalData,
        ...(hasLogin && {
          email: data.email!,
          password: data.password!,
        }),
        createdAt: serverTimestamp(),
      });
      setSuccessMessage(t('add_technician_partner_page.created_success'));
    }

    fetchPartners();
    setEditingPartner(null);
    setShowSuccessDialog(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <UserTopMenu />

      <main className="flex-1 p-4 md:p-8 space-y-10">
        <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Wrench className="w-6 h-6" />
          {t('add_technician_partner_page.title')}
        </h1>

        <div>
          <h2 className="text-xl font-bold mb-4">
            {t('add_technician_partner_page.existing')}
          </h2>
          <TechnicianPartnerTable
            partners={partners}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        <div className="hidden md:block">
          <h2 className="text-xl font-bold mb-4">
            {editingPartner
              ? t('add_technician_partner_page.edit')
              : t('add_technician_partner_page.add')}
          </h2>
          <TechnicianPartnerForm
            initialData={editingPartner || undefined}
            onSave={handleSave}
          />
        </div>
      </main>

      <Footer />

      {/* ✅ Dialog xác nhận xoá */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add_technician_partner_page.delete_title')}</DialogTitle>
            <DialogDescription>
              {t('add_technician_partner_page.delete_confirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t('add_technician_partner_page.cancel')}
            </button>
            <button
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              onClick={confirmDelete}
            >
              {t('add_technician_partner_page.delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ Dialog thông báo thành công */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add_technician_partner_page.success')}</DialogTitle>
            <DialogDescription>{successMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              onClick={() => setShowSuccessDialog(false)}
            >
              OK
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
