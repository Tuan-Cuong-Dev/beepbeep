'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { db } from '@/src/firebaseConfig';
import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';

export default function ReportPublicIssueForm() {
  const { t } = useTranslation<'common'>('common');
  const { user } = useUser();
  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();

  const [form, setForm] = useState<Omit<PublicVehicleIssue, 'id' | 'status' | 'createdAt'>>({
    customerName: '',
    phone: '',
    issueDescription: '',
    vehicleId: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleLicensePlate: '',
    reportedBy: '',
    location: {
      mapAddress: '',
      coordinates: '',
      issueAddress: '',
    },
  });

  const [notice, setNotice] = useState({
    open: false,
    type: 'success' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  useEffect(() => {
    if (user?.uid) setForm((prev) => ({ ...prev, reportedBy: user.uid }));
  }, [user]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLocationChange = (field: keyof PublicVehicleIssue['location'], value: string) => {
    setForm((prev) => ({ ...prev, location: { ...prev.location, [field]: value } }));
  };

  const handleGeocode = () => {
    if (form.location.mapAddress?.trim()) geocode(form.location.mapAddress);
  };

  useEffect(() => {
    if (coords) handleLocationChange('coordinates', `${coords.lat},${coords.lng}`);
  }, [coords]);

  const handleSubmit = async () => {
    if (!form.issueDescription || !form.location.issueAddress) {
      setNotice({
        open: true,
        type: 'error',
        title: t('public_issue_form.error.missing_title'),
        description: t('public_issue_form.error.missing_desc'),
      });
      return;
    }

    try {
      const data: PublicVehicleIssue = {
        ...form,
        status: 'pending',
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'publicVehicleIssues'), data);

      setNotice({
        open: true,
        type: 'success',
        title: t('public_issue_form.success.title'),
        description: t('public_issue_form.success.desc'),
      });

      setForm({
        customerName: '',
        phone: '',
        issueDescription: '',
        vehicleId: '',
        vehicleBrand: '',
        vehicleModel: '',
        vehicleLicensePlate: '',
        reportedBy: user?.uid || '',
        location: { mapAddress: '', coordinates: '', issueAddress: '' },
      });
    } catch (error) {
      console.error(error);
      setNotice({
        open: true,
        type: 'error',
        title: t('public_issue_form.submit_fail.title'),
        description: t('public_issue_form.submit_fail.desc'),
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <h2 className="text-xl md:text-2xl font-bold">
        🚨 {t('public_issue_form.title')}
      </h2>

      {/* Grid 2 cột trên desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cột trái: Thông tin KH + xe + mô tả */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
            <h3 className="font-semibold text-gray-800">{t('public_issue_form.section.customer')}</h3>
            <Input
              placeholder={t('public_issue_form.placeholder.customer_name')}
              value={form.customerName}
              onChange={(e) => handleChange('customerName', e.target.value)}
            />
            <Input
              placeholder={t('public_issue_form.placeholder.phone')}
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
            <h3 className="font-semibold text-gray-800">{t('public_issue_form.section.vehicle')}</h3>
            <Input
              placeholder={t('public_issue_form.placeholder.vehicle_model')}
              value={form.vehicleModel}
              onChange={(e) => handleChange('vehicleModel', e.target.value)}
            />
            <Input
              placeholder={t('public_issue_form.placeholder.vehicle_brand')}
              value={form.vehicleBrand}
              onChange={(e) => handleChange('vehicleBrand', e.target.value)}
            />
            <Input
              placeholder={t('public_issue_form.placeholder.license_plate')}
              value={form.vehicleLicensePlate}
              onChange={(e) => handleChange('vehicleLicensePlate', e.target.value)}
            />
          </div>

          <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
            <h3 className="font-semibold text-gray-800">{t('public_issue_form.section.issue')}</h3>
            <Textarea
              placeholder={t('public_issue_form.placeholder.issue_description')}
              value={form.issueDescription}
              onChange={(e) => handleChange('issueDescription', e.target.value)}
              rows={5}
            />
          </div>
        </div>

        {/* Cột phải: Vị trí + preview bản đồ */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl border p-4 space-y-3 shadow-sm">
            <h3 className="font-semibold text-gray-800">{t('public_issue_form.section.location')}</h3>
            <Textarea
              placeholder={t('public_issue_form.placeholder.map_address')}
              value={form.location.mapAddress}
              onChange={(e) => handleLocationChange('mapAddress', e.target.value)}
              onBlur={handleGeocode}
              rows={3}
            />
            <Input
              placeholder={t('public_issue_form.placeholder.coordinates')}
              value={form.location.coordinates}
              readOnly={!!coords}
              onChange={(e) => handleLocationChange('coordinates', e.target.value)}
            />
            <Input
              placeholder={t('public_issue_form.placeholder.issue_address')}
              value={form.location.issueAddress}
              onChange={(e) => handleLocationChange('issueAddress', e.target.value)}
            />

            {coords && (
              <>
                <p className="text-sm text-gray-600">
                  {t('public_issue_form.detected_coords', {
                    lat: String(coords.lat),
                    lng: String(coords.lng),
                  })}
                </p>
                <iframe
                  title="Map Preview"
                  width="100%"
                  height="200"
                  className="rounded-xl"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=16&output=embed`}
                />
              </>
            )}

            {geoError && <p className="text-sm text-red-500">⚠️ {geoError}</p>}
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleSubmit} disabled={geoLoading}>
              {geoLoading ? t('public_issue_form.btn.processing') : t('public_issue_form.btn.submit')}
            </Button>
          </div>
        </div>
      </div>

      <NotificationDialog
        open={notice.open}
        type={notice.type}
        title={notice.title}
        description={notice.description}
        onClose={() => setNotice((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
}
