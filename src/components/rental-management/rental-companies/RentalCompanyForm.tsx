// Chuẩn hóa ngày 28/08/2025
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { RentalCompany } from '../../../hooks/useRentalData';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { Label } from '@/src/components/ui/label';
import { useTranslation } from 'react-i18next';

interface Props {
  editingCompany: RentalCompany | null;
  onSave: (data: Omit<RentalCompany, 'id'>) => void;
  onCancel: () => void;
}

export default function RentalCompanyForm({ editingCompany, onSave, onCancel }: Props) {
  const { t } = useTranslation('common');

  const [form, setForm] = useState<Omit<RentalCompany, 'id'>>({
    name: '',
    email: '',
    phone: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
  });

  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setForm(prev => ({ ...prev, location: `${coords.lat}° N, ${coords.lng}° E` }));
    }
  }, [coords]);

  useEffect(() => {
    if (editingCompany) {
      const { id, ...rest } = editingCompany;
      setForm(rest);
    }
  }, [editingCompany]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress.trim()) geocode(form.mapAddress);
  };

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 1 && form.displayAddress.trim().length > 3;
  }, [form.name, form.displayAddress]);

  return (
    <div className="w-full">
      {/* Card container */}
      <div className="rounded-2xl border bg-white shadow-sm">
        {/* Header */}
        <div className="border-b p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-semibold">
            {editingCompany ? t('rental_company_form.update_title') : t('rental_company_form.add_title')}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {t('rental_company_form.subtitle')}
          </p>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Company name */}
            <div className="space-y-1.5">
              <Label htmlFor="company-name" className="text-sm">{t('rental_company_form.name_label')}</Label>
              <Input
                id="company-name"
                placeholder={t('rental_company_form.name_placeholder')}
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
              <p className="text-xs text-gray-500">{t('rental_company_form.name_hint')}</p>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="company-email" className="text-sm">{t('rental_company_form.email_label')}</Label>
              <Input
                id="company-email"
                placeholder={t('rental_company_form.email_placeholder')}
                type="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="company-phone" className="text-sm">{t('rental_company_form.phone_label')}</Label>
              <Input
                id="company-phone"
                placeholder={t('rental_company_form.phone_placeholder')}
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            {/* Display Address */}
            <div className="space-y-1.5">
              <Label htmlFor="display-address" className="text-sm">{t('rental_company_form.display_address_label')}</Label>
              <Input
                id="display-address"
                placeholder={t('rental_company_form.display_address_placeholder')}
                value={form.displayAddress}
                onChange={(e) => handleChange('displayAddress', e.target.value)}
              />
              <p className="text-xs text-gray-500">{t('rental_company_form.display_address_hint')}</p>
            </div>

            {/* Map Address */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="map-address" className="text-sm">{t('rental_company_form.map_address_label')}</Label>
              <Input
                id="map-address"
                placeholder={t('rental_company_form.map_address_placeholder')}
                value={form.mapAddress}
                onChange={(e) => handleChange('mapAddress', e.target.value)}
                onBlur={handleMapAddressBlur}
              />
              <div className="flex items-center gap-2 text-xs">
                {loading && <span className="animate-pulse text-gray-500">{t('rental_company_form.locating')}</span>}
                {error && <span className="text-red-500">{error}</span>}
                {!loading && !error && form.location && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                    {form.location}
                  </span>
                )}
              </div>
            </div>

            {/* Location (readonly) */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="location" className="text-sm">{t('rental_company_form.location_label')}</Label>
              <Input id="location" placeholder={t('rental_company_form.location_placeholder')} value={form.location} readOnly />
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="h-16" />
      <div className="fixed inset-x-0 bottom-0 z-10 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 md:static md:border-0 md:bg-transparent md:backdrop-blur-0">
        <div className="mx-auto max-w-screen-lg p-3 md:p-0">
          <div className="flex items-center gap-2 md:justify-end">
            {editingCompany && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 md:flex-none"
              >
                {t('rental_company_form.cancel')}
              </Button>
            )}
            <Button
              type="button"
              onClick={() => onSave(form)}
              disabled={!canSubmit}
              className="flex-1 md:flex-none"
            >
              {editingCompany ? t('rental_company_form.update_btn') : t('rental_company_form.add_btn')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
