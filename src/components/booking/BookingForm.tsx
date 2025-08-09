'use client';

import { useEffect } from 'react';
import { useBookingForm } from '@/src/hooks/useBookingForm';
import { useUser } from '@/src/context/AuthContext';
import { Ebike } from '@/src/lib/vehicles/ebikeTypes';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import { sanitizeFirestoreData } from '@/src/utils/sanitizeFirestoreData';
import { useTranslation } from 'react-i18next';

interface Props {
  editingBooking: Record<string, any> | null;
  companyNames: Record<string, string>;
  userNames: Record<string, string>;
  packageNames: Record<string, string>;
  packages: SubscriptionPackage[];
  ebikes: Ebike[];
  onSave: (data: Record<string, any>) => void;
  onCancel: () => void;
}

const formatDateInput = (date: any) => {
  if (!date) return '';
  let realDate: Date | null = null;
  if (date instanceof Date) realDate = date;
  else if (typeof date?.toDate === 'function') realDate = date.toDate();
  else if (typeof date === 'string' || typeof date === 'number') realDate = new Date(date);
  if (!realDate || isNaN(realDate.getTime())) return '';
  return format(realDate, 'yyyy-MM-dd');
};

export default function BookingForm({
  editingBooking,
  companyNames,
  userNames,
  packageNames,
  packages,
  ebikes,
  onSave,
  onCancel,
}: Props) {
  const { t } = useTranslation('common');
  const { companyId, user } = useUser();
  const {
    formData: form,
    handleChange,
    resetForm,
    setFormData,
    stations,
    stationsLoading,
  } = useBookingForm(companyId ?? '', user?.uid ?? '');

  useEffect(() => {
    if (editingBooking) {
      const { id, createdAt, updatedAt, rentalStartDate, rentalEndDate, ...rest } = editingBooking;
      setFormData({
        ...rest,
        rentalStartDate: formatDateInput(rentalStartDate),
        rentalEndDate: formatDateInput(rentalEndDate),
      });
    } else {
      resetForm();
    }
  }, [editingBooking]);

  const handleSubmit = () => {
    if (!form.fullName || !form.phone || !form.vehicleModel) {
      alert(t('booking_form.validation_required'));
      return;
    }
    onSave(sanitizeFirestoreData(form));
  };

  const handleCurrencyChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(key, parseCurrencyString(e.target.value));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="w-full max-w-[100vw] mx-auto px-4 sm:px-6 py-6 bg-white rounded-lg shadow overflow-y-auto max-h-[90vh] space-y-10"
    >
      <Section title={t('booking_form.section_customer')}>
        <GridCols>{[
          <Input key="name" placeholder={t('booking_form.full_name')} value={form.fullName || ''} onChange={(e) => handleChange('fullName', e.target.value)} />,
          <Input key="phone" placeholder={t('booking_form.phone')} value={form.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />,
          <Input key="idnum" placeholder={t('booking_form.id_number')} value={form.idNumber || ''} onChange={(e) => handleChange('idNumber', e.target.value)} />,
          <Input key="addr" placeholder={t('booking_form.address')} value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} />,
        ]}</GridCols>
      </Section>

      <Section title={t('booking_form.section_vehicle')}>
        <GridCols>{[
          <Input key="model" placeholder={t('booking_form.vehicle_model')} value={form.vehicleModel || ''} onChange={(e) => handleChange('vehicleModel', e.target.value)} />,
          <Input key="color" placeholder={t('booking_form.vehicle_color')} value={form.vehicleColor || ''} onChange={(e) => handleChange('vehicleColor', e.target.value)} />,
          <Input key="vin" placeholder={t('booking_form.vin')} value={form.vin || ''} onChange={(e) => handleChange('vin', e.target.value)} />,
          <Input key="plate" placeholder={t('booking_form.license_plate')} value={form.licensePlate || ''} onChange={(e) => handleChange('licensePlate', e.target.value)} />,
        ]}</GridCols>
      </Section>

      <Section title={t('booking_form.section_rental_period')}>
        <GridCols>{[
          <Input key="date" type="date" value={form.rentalStartDate || ''} onChange={(e) => handleChange('rentalStartDate', e.target.value)} />,
          <Input key="hour" placeholder={t('booking_form.rental_start_hour')} value={form.rentalStartHour || ''} onChange={(e) => handleChange('rentalStartHour', e.target.value)} />,
          <Input key="days" type="number" placeholder={t('booking_form.rental_days')} value={form.rentalDays || 1} onChange={(e) => handleChange('rentalDays', Number(e.target.value))} />,
          <Input key="end" type="date" value={form.rentalEndDate || ''} readOnly />,
        ]}</GridCols>
      </Section>

      <Section title={t('booking_form.section_pricing')}>
        <GridCols>{[
          <Dropdown label={t('booking_form.package')} value={form.package} onChange={(e) => handleChange('package', e.target.value)} options={packageNames} />,
          <LabeledInput label={t('booking_form.base_price')} value={formatCurrency(form.basePrice)} onChange={handleCurrencyChange('basePrice')} />,
          <LabeledInput label={t('booking_form.battery_fee')} value={formatCurrency(form.batteryFee)} onChange={handleCurrencyChange('batteryFee')} />,
          <LabeledInput label={t('booking_form.total_amount')} value={formatCurrency(form.totalAmount)} readOnly />,
          <LabeledInput label={t('booking_form.deposit')} value={formatCurrency(form.deposit)} onChange={handleCurrencyChange('deposit')} />,
          <LabeledInput label={t('booking_form.remaining_balance')} value={formatCurrency(form.remainingBalance)} readOnly />,
        ]}</GridCols>
      </Section>

      <Section title={t('booking_form.section_accessories')}>
        <GridCols>{[
          <Checkbox label={t('booking_form.helmet')} value={form.helmet} onChange={(v) => handleChange('helmet', v)} />,
          <Checkbox label={t('booking_form.charger')} value={form.charger} onChange={(v) => handleChange('charger', v)} />,
          <Checkbox label={t('booking_form.rear_rack')} value={form.rearRack} onChange={(v) => handleChange('rearRack', v)} />,
          <Checkbox label={t('booking_form.phone_holder')} value={form.phoneHolder} onChange={(v) => handleChange('phoneHolder', v)} />,
          <Checkbox label={t('booking_form.raincoat')} value={form.raincoat} onChange={(v) => handleChange('raincoat', v)} />,
        ]}</GridCols>
      </Section>

      <Section title={t('booking_form.section_battery')}>
        <GridCols>{[
          <Input key="b1" placeholder="Battery Code 1" value={form.batteryCode1 || ''} onChange={(e) => handleChange('batteryCode1', e.target.value)} />,
          <Input key="b2" placeholder="Battery Code 2" value={form.batteryCode2 || ''} onChange={(e) => handleChange('batteryCode2', e.target.value)} />,
          <Input key="b3" placeholder="Battery Code 3" value={form.batteryCode3 || ''} onChange={(e) => handleChange('batteryCode3', e.target.value)} />,
          <Input key="b4" placeholder="Battery Code 4" value={form.batteryCode4 || ''} onChange={(e) => handleChange('batteryCode4', e.target.value)} />,
        ]}</GridCols>
      </Section>

      <Section title={t('booking_form.section_method')}>
        <GridCols>{[
          <select key="method" className="border p-2 rounded w-full" value={form.deliveryMethod || ''} onChange={(e) => handleChange('deliveryMethod', e.target.value)}>
            <option value="">{t('booking_form.select_method')}</option>
            <option value="Pickup at Shop">{t('booking_form.pickup_shop')}</option>
            <option value="Deliver to Address">{t('booking_form.deliver_address')}</option>
          </select>,
          form.deliveryMethod === 'Deliver to Address' && (
            <Textarea key="addr" placeholder={t('booking_form.delivery_address')} value={form.deliveryAddress || ''} onChange={(e) => handleChange('deliveryAddress', e.target.value)} />
          ),
        ]}</GridCols>
      </Section>

      <Section title={t('booking_form.section_station')}>
        <GridCols>{[
          stationsLoading ? <p key="loading">{t('booking_form.loading_station')}</p> : (
            <Dropdown key="station" label={t('booking_form.select_station')} value={form.stationId} onChange={(e) => handleChange('stationId', e.target.value)} options={Object.fromEntries(stations.map(s => [s.id, s.name]))} />
          ),
        ]}</GridCols>
      </Section>

      <Section title={t('booking_form.section_notes')}>
        <Textarea placeholder={t('booking_form.additional_notes')} value={form.note || ''} onChange={(e) => handleChange('note', e.target.value)} />
      </Section>

      <Section title={t('booking_form.section_status')}>
        <GridCols>{[
          <Dropdown
            key="status"
            label={t('booking_form.status')}
            value={form.bookingStatus || 'draft'}
            onChange={(e) => handleChange('bookingStatus', e.target.value)}
            options={{
              draft: t('booking_form.status_draft'),
              confirmed: t('booking_form.status_confirmed'),
              completed: t('booking_form.status_completed'),
              cancelled: t('booking_form.status_cancelled'),
            }}
          />,
          <div key="statusNote" className="col-span-full">
            <label className="block text-sm font-medium mb-1 text-gray-700">{t('booking_form.status_comment')}</label>
            <Textarea
              placeholder={t('booking_form.status_comment')}
              value={form.statusComment || ''}
              onChange={(e) => handleChange('statusComment', e.target.value)}
            />
          </div>,
        ]}</GridCols>
      </Section>

      <div className="flex justify-end gap-4 pt-6 sticky bottom-0 bg-white z-10">
        <Button type="submit">{t('booking_form.save')}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>{t('booking_form.cancel')}</Button>
      </div>
    </form>
  );
}

// Shared Layout Components

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

export function GridCols({ children }: { children: React.ReactNode | React.ReactNode[] }) {
  const arrayChildren = Array.isArray(children) ? children : [children];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {arrayChildren.filter(Boolean).map((child, index) => (
        <div key={index}>{child}</div>
      ))}
    </div>
  );
}

function Checkbox({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={value || false} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function LabeledInput({ label, value, onChange, readOnly = false }: { label: string; value: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void; readOnly?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <Input value={value} onChange={onChange} readOnly={readOnly} className={readOnly ? 'bg-gray-100 text-gray-600 font-semibold' : ''} />
    </div>
  );
}

function Dropdown({ label, value, onChange, options }: { label: string; value?: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: Record<string, string> }) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <select className="border p-2 rounded w-full" value={value || ''} onChange={onChange}>
        <option value="">{label}</option>
        {Object.entries(options).map(([val, label]) => (
          <option key={val} value={val}>{label}</option>
        ))}
      </select>
    </div>
  );
}
