'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc,Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { useTechnicianPartners } from '@/src/hooks/useTechnicianPartners';
import { TechnicianPartner, VehicleType } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

interface Props {
  id: string;
  onClose: () => void;
}

export default function RepairShopEditForm({ id, onClose }: Props) {
  const { t } = useTranslation('common');
  const { updatePartner } = useTechnicianPartners();
  const [form, setForm] = useState<Partial<TechnicianPartner> | null>(null);
  const [saving, setSaving] = useState(false);
  const { coords, geocode } = useGeocodeAddress();

  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, 'technicianPartners', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setForm(snap.data() as TechnicianPartner);
      }
    };
    fetchData();
  }, [id]);

  useEffect(() => {
    if (form?.mapAddress) geocode(form.mapAddress);
  }, [form?.mapAddress]);

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        coordinates: coords,
      }));
    }
  }, [coords]);

  const handleChange = (field: keyof TechnicianPartner, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const updateData = {
        ...form,
        coordinates: form.coordinates ?? undefined,
        geo: form.coordinates ?? undefined,
        updatedAt: Timestamp.now(),
      };
      await updatePartner(id, updateData);
      onClose();
    } catch (err) {
      alert(t('repair_shop_edit_form.update_error') || 'Failed to update repair shop.');
    } finally {
      setSaving(false);
    }
  };


  if (!form) return <p className="p-4 text-center">{t('loading') || 'Loading...'}</p>;

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      <div>
        <Label>{t('repair_shop_edit_form.technician_name')}</Label>
        <Input value={form.name || ''} onChange={(e) => handleChange('name', e.target.value)} />
      </div>

      <div>
        <Label>{t('repair_shop_edit_form.phone_number')}</Label>
        <Input value={form.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />
      </div>

      <div>
        <Label>Email</Label>
        <Input value={form.email || ''} onChange={(e) => handleChange('email', e.target.value)} />
      </div>

      <div>
        <Label>{t('repair_shop_edit_form.shop_name_optional')}</Label>
        <Input value={form.shopName || ''} onChange={(e) => handleChange('shopName', e.target.value)} />
      </div>

      <div>
        <Label>{t('repair_shop_edit_form.shop_address')}</Label>
        <Textarea value={form.shopAddress || ''} onChange={(e) => handleChange('shopAddress', e.target.value)} />
      </div>

      <div>
        <Label>{t('repair_shop_edit_form.map_address')}</Label>
        <Textarea className="min-h-[180px]" value={form.mapAddress || ''} onChange={(e) => handleChange('mapAddress', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>{t('repair_shop_edit_form.latitude')}</Label>
          <Input
            value={form.coordinates?.lat ?? ''}
            onChange={(e) =>
              handleChange('coordinates', {
                ...form.coordinates,
                lat: parseFloat(e.target.value),
              })
            }
          />
        </div>
        <div>
          <Label>{t('repair_shop_edit_form.longitude')}</Label>
          <Input
            value={form.coordinates?.lng ?? ''}
            onChange={(e) =>
              handleChange('coordinates', {
                ...form.coordinates,
                lng: parseFloat(e.target.value),
              })
            }
          />
        </div>
      </div>

      {form.coordinates && (
        <div className="h-48 rounded overflow-hidden border mt-2">
          <MapPreview coords={form.coordinates} />
        </div>
      )}

      <div>
        <Label>{t('repair_shop_edit_form.select_vehicle_type')}</Label>
        <select
          className="w-full border rounded px-3 py-2"
          value={form.vehicleType || ''}
          onChange={(e) => handleChange('vehicleType', e.target.value as VehicleType)}
        >
          <option value="">{t('repair_shop_edit_form.select_vehicle_type')}</option>
          <option value="bike">{t('repair_shop_edit_form.vehicle_bike')}</option>
          <option value="motorbike">{t('repair_shop_edit_form.vehicle_motorbike')}</option>
          <option value="car">{t('repair_shop_edit_form.vehicle_car')}</option>
          <option value="van">Van</option>
          <option value="bus">Bus</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}
