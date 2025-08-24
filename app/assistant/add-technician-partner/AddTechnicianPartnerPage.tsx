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
import type { LocationCore } from '@/src/lib/locations/locationTypes';
import { GeoPoint } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { Button } from '@/src/components/ui/button';

// -------- Helpers --------
type LatLng = { lat: number; lng: number };
function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// Khớp đúng kiểu onSave của TechnicianPartnerForm
type FormSavePayload = Partial<
  Omit<TechnicianPartner, 'location'> & {
    location?: Partial<Pick<LocationCore, 'address' | 'location' | 'mapAddress'>>;
    email?: string;
    password?: string;
    role: 'technician_partner';
  }
>;

export default function AddTechnicianPartnerPage() {
  const { t } = useTranslation('common');

  const {
    partners,
    loading,
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
    if (!deleteTargetId) return;
    await deletePartner(deleteTargetId);
    setDeleteTargetId(null);
    setShowDeleteDialog(false);
  };

  const handleSave = async (data: FormSavePayload) => {
    const isEditing = !!editingPartner?.id;

    // Chuẩn hoá role
    const base: FormSavePayload = { ...data, role: 'technician_partner' };

    // Từ location “lite” -> LocationCore (nếu có lat,lng)
    let locationCore: LocationCore | undefined;
    const latlng = parseLatLngString(base.location?.location);
    if (latlng) {
      locationCore = {
        geo: new GeoPoint(latlng.lat, latlng.lng),
        location: `${latlng.lat},${latlng.lng}`,
        address: base.location?.address,
        mapAddress: base.location?.mapAddress,
      };
    } else if (base.location?.address) {
      // Chưa có toạ độ nhưng có address: để undefined, tránh ép kiểu sai.
      // (update có thể merge address; add thì nên yêu cầu toạ độ)
    }

    const finalData: Partial<TechnicianPartner> = {
      ...base,
      location: locationCore, // chỉ set khi build được
    };

    if (isEditing) {
      await updatePartner(editingPartner!.id!, finalData);
      setSuccessMessage(t('add_technician_partner_page.updated_success'));
    } else {
      // addPartner yêu cầu location.geo hợp lệ
      if (!locationCore?.geo) {
        alert(t('add_technician_partner_page.missing_coordinates') || 'Vui lòng nhập toạ độ hợp lệ cho đối tác.');
        return;
      }
      await addPartner(finalData);
      setSuccessMessage(t('add_technician_partner_page.created_success'));
    }

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">
              {t('add_technician_partner_page.existing')}
            </h2>
            {loading && (
              <span className="text-sm text-gray-500">
                {t('loading', 'Loading...')}
              </span>
            )}
          </div>

          <TechnicianPartnerTable
            partners={partners}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>

        {/* Form desktop */}
        <div className="hidden md:block">
          <h2 className="text-xl font-bold mb-4">
            {editingPartner
              ? t('add_technician_partner_page.edit')
              : t('add_technician_partner_page.add')}
          </h2>

          <TechnicianPartnerForm
            initialData={editingPartner || undefined}
            onSave={handleSave} // <-- đã khớp kiểu
          />
        </div>

        {/* Gợi ý trên mobile */}
        <div className="md:hidden">
          <p className="text-sm text-gray-600">
            {t(
              'add_technician_partner_page.mobile_hint',
              'For the best experience, please open on desktop to add or edit partners.'
            )}
          </p>
        </div>
      </main>

      <Footer />

      {/* Dialog xác nhận xoá */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add_technician_partner_page.delete_title')}</DialogTitle>
            <DialogDescription>
              {t('add_technician_partner_page.delete_confirm')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteDialog(false)}
            >
              {t('add_technician_partner_page.cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              {t('add_technician_partner_page.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thông báo thành công */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add_technician_partner_page.success')}</DialogTitle>
            <DialogDescription>{successMessage}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
