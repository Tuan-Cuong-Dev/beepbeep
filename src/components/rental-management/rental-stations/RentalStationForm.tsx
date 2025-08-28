// src/components/rental-management/rental-stations/RentalStationForm.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { RentalStation } from '@/src/hooks/useRentalData';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useTranslation } from 'react-i18next';

interface Props {
  companies: { id: string; name: string }[];
  editingStation: RentalStation | null;
  onSave: (data: Omit<RentalStation, 'id'>) => void;
  onCancel: () => void;
}

export default function RentalStationForm({ companies, editingStation, onSave, onCancel }: Props) {
  const { t } = useTranslation('common');

  const [form, setForm] = useState<Omit<RentalStation, 'id'>>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
    totalEbikes: 0,
    companyId: '',
    contactPhone: '',
  });

  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        location: `${coords.lat}° N, ${coords.lng}° E`,
      }));
    }
  }, [coords]);

  useEffect(() => {
    if (editingStation) {
      const { id, ...rest } = editingStation;
      setForm({ ...rest, contactPhone: rest.contactPhone || '' });
    }
  }, [editingStation]);

  const handleChange = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress.trim()) geocode(form.mapAddress);
  };

  const canSubmit = useMemo(() => {
    return (
      form.name.trim().length > 0 &&
      form.displayAddress.trim().length > 0 &&
      form.companyId.trim().length > 0
    );
  }, [form.name, form.displayAddress, form.companyId]);

  return (
    <div className="w-full rounded-2xl border bg-white p-4 md:p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold tracking-tight">
          {editingStation ? t('rental_station_form.update_title') : t('rental_station_form.add_title')}
        </h3>
        {editingStation && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {t('rental_station_form.editing')}
          </span>
        )}
      </div>

      {/* Mobile stacked */}
      <div className="space-y-3 md:hidden">
        <LabelInput label={t('rental_station_form.name')}>
          <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.contact_phone')}>
          <Input value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.display_address')}>
          <Input value={form.displayAddress} onChange={(e) => handleChange('displayAddress', e.target.value)} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.map_address')}>
          <Input value={form.mapAddress} onChange={(e) => handleChange('mapAddress', e.target.value)} onBlur={handleMapAddressBlur} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.location')}>
          <Input value={form.location} readOnly />
        </LabelInput>
        {loading && <p className="text-sm text-gray-500">{t('rental_station_form.detecting')}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <LabelInput label={t('rental_station_form.company')}>
          <select className="border rounded px-3 py-2 w-full" value={form.companyId} onChange={(e) => handleChange('companyId', e.target.value)}>
            <option value="">{t('rental_station_form.select_company')}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </LabelInput>
        <LabelInput label={t('rental_station_form.total_ebikes')}>
          <Input type="number" value={form.totalEbikes} onChange={(e) => handleChange('totalEbikes', Number(e.target.value))} />
        </LabelInput>
        <div className="flex gap-2 pt-2">
          <Button onClick={() => onSave(form)} disabled={!canSubmit}>
            {editingStation ? t('rental_station_form.update') : t('rental_station_form.add')}
          </Button>
          {editingStation && <Button variant="outline" onClick={onCancel}>{t('rental_station_form.cancel')}</Button>}
        </div>
      </div>

      {/* Desktop 2-column */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4">
        <LabelInput label={t('rental_station_form.name')}>
          <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.contact_phone')}>
          <Input value={form.contactPhone} onChange={(e) => handleChange('contactPhone', e.target.value)} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.display_address')}>
          <Input value={form.displayAddress} onChange={(e) => handleChange('displayAddress', e.target.value)} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.map_address')}>
          <Input value={form.mapAddress} onChange={(e) => handleChange('mapAddress', e.target.value)} onBlur={handleMapAddressBlur} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.location')}>
          <Input value={form.location} readOnly />
        </LabelInput>
        <LabelInput label={t('rental_station_form.total_ebikes')}>
          <Input type="number" value={form.totalEbikes} onChange={(e) => handleChange('totalEbikes', Number(e.target.value))} />
        </LabelInput>
        <LabelInput label={t('rental_station_form.company')}>
          <select className="border rounded px-3 py-2 w-full" value={form.companyId} onChange={(e) => handleChange('companyId', e.target.value)}>
            <option value="">{t('rental_station_form.select_company')}</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </LabelInput>
        <div className="flex gap-2">
          <Button onClick={() => onSave(form)} disabled={!canSubmit}>
            {editingStation ? t('rental_station_form.update') : t('rental_station_form.add')}
          </Button>
          {editingStation && <Button variant="outline" onClick={onCancel}>{t('rental_station_form.cancel')}</Button>}
        </div>
      </div>
    </div>
  );
}

function LabelInput({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
