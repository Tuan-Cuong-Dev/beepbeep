// src/components/public-issues/ReportVehicleIssueModal.tsx
// Modal báo "HỎNG XE"
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { SimpleSelect } from '@/src/components/ui/select';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

import { useUser } from '@/src/context/AuthContext';
import { usePersonalVehicles } from '@/src/hooks/usePersonalVehicles';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

import type { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import type { PersonalVehicle } from '@/src/lib/personalVehicles/personalVehiclesTypes';
import { useTranslation } from 'react-i18next';

// ✅ Thêm router để điều hướng sau khi submit
import { useRouter } from 'next/navigation';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ReportVehicleIssueModal({ open, onClose }: Props) {
  const { t } = useTranslation('common', { keyPrefix: 'report_issue' });
  const { user } = useUser();
  const uid = user?.uid;

  // ✅ Khởi tạo router
  const router = useRouter();

  // --- state ---
  const { vehicles, loading: loadingVehicles } = usePersonalVehicles(uid);
  const { location, loading: loadingGeo, error: geoError } = useCurrentLocation();
  const toCoordString = location ? `${location[0]},${location[1]}` : undefined;

  const [vehicleId, setVehicleId] = useState<string>('');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueAddress, setIssueAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // 🔁 NEW: Sync lại khi user đã load xong hoặc khi modal mở
  useEffect(() => {
    if (open) {
      setCustomerName(user?.name || '');
      setPhone(user?.phone || '');
    }
  }, [open, user?.name, user?.phone]);

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v: PersonalVehicle) => ({
        value: v.id,
        label: [v.name || v.model || t('vehicle_fallback'), v.licensePlate].filter(Boolean).join(' • '),
        raw: v,
      })),
    [vehicles, t]
  );

  useEffect(() => {
    if (!vehicleId && vehicleOptions.length > 0) {
      setVehicleId(vehicleOptions[0].value);
    }
  }, [vehicleOptions, vehicleId]);

  const resetForm = () => {
    setIssueDescription('');
    setIssueAddress('');
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    try {
      setErrorMsg(null);

      if (!uid) {
        setErrorMsg(t('errors.need_login'));
        return;
      }
      if (!vehicleId) {
        setErrorMsg(t('errors.no_vehicle'));
        return;
      }
      if (!issueDescription.trim()) {
        setErrorMsg(t('errors.no_description'));
        return;
      }

      const selected = vehicleOptions.find(o => o.value === vehicleId)?.raw;

      // ✅ Tạo payload KHÔNG chứa undefined; chỉ spread khi có giá trị
      const payload: PublicVehicleIssue = {
        // Bắt buộc
        customerName: customerName || t('customer_default'),
        phone: phone || '',
        issueDescription: issueDescription.trim(),
        status: 'pending',
        createdAt: serverTimestamp() as any,

        // Khuyến nghị có:
        reportedBy: uid,
        ...(selected?.id ? { vehicleId: selected.id } : {}),
        updatedAt: serverTimestamp() as any,

        // Thông tin vị trí
        location: {
          mapAddress: issueAddress || t('location.current'),
          ...(toCoordString ? { coordinates: toCoordString } : {}),
          ...(issueAddress ? { issueAddress } : {}),
        },

        // Trạng thái duyệt (optional): đặt pending ngay từ đầu
        approveStatus: 'pending',

        // Thông tin xe (optional)
        ...(selected?.brand ? { vehicleBrand: selected.brand } : {}),
        ...(selected?.model ? { vehicleModel: selected.model } : {}),
        ...(selected?.licensePlate ? { vehicleLicensePlate: selected.licensePlate } : {}),
      };

      setSubmitting(true);
      await addDoc(collection(db, 'publicVehicleIssues'), payload);

      // ✅ Điều hướng ngay sau khi submit thành công
      // Dùng absolute URL đúng như yêu cầu
      router.push('https://www.beepbeep.vn/profile?tab=issues');

      // (Tuỳ chọn) đóng modal và reset form — sẽ không thấy vì đã điều hướng
      resetForm();
      onClose();
    } catch (err: any) {
      setSubmitting(false);
      setErrorMsg(err?.message || t('errors.submit_failed'));
      return;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
        <DialogTitle>{t('title')}</DialogTitle>
        <DialogDescription className="text-sm text-gray-600">
          {t('subtitle')}
        </DialogDescription>
      </DialogHeader>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="text-sm font-medium">{t('name')}</label>
            <Input
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder={t('name_placeholder')}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('phone')}</label>
            <Input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder={t('phone_placeholder')}
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium block mb-1">{t('select_vehicle')}</label>
          <SimpleSelect
            value={vehicleId}
            onChange={setVehicleId}
            disabled={loadingVehicles || vehicleOptions.length === 0}
            options={vehicleOptions.map(o => ({ label: o.label, value: o.value }))}
            placeholder={loadingVehicles ? t('loading_vehicles') : t('choose_vehicle')}
            className="text-sm"
            maxVisible={10}
            maxMenuHeight={280}
          />
          {loadingVehicles && <p className="text-xs text-gray-500 mt-1">{t('loading_vehicles')}</p>}
          {!loadingVehicles && vehicleOptions.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">{t('no_vehicle')}</p>
          )}
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium">{t('issue_description')}</label>
          <Textarea
            value={issueDescription}
            onChange={e => setIssueDescription(e.target.value)}
            placeholder={t('issue_placeholder')}
            rows={3}
          />
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium">{t('issue_address')}</label>
          <Input
            value={issueAddress}
            onChange={e => setIssueAddress(e.target.value)}
            placeholder={t('issue_address_placeholder')}
          />
          <p className="text-xs text-gray-500 mt-1">
            {loadingGeo
              ? t('geo.loading')
              : toCoordString
                ? `${t('geo.coordinates')}: ${toCoordString}`
                : (geoError ? `${t('geo.error')}: ${geoError}` : t('geo.unavailable'))}
          </p>
        </div>

        {errorMsg && <p className="text-sm text-red-600 mt-2">{errorMsg}</p>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button
            disabled={submitting || !vehicleId || !issueDescription.trim()}
            onClick={handleSubmit}
            className="bg-[#00d289] hover:opacity-90"
          >
            {submitting ? t('submitting') : t('submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
