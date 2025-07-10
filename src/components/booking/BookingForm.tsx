'use client';

import { useEffect } from 'react';
import { useBookingForm } from '@/src/hooks/useBookingForm';
import { useUser } from '@/src/context/AuthContext';
import { Ebike } from '@/src/lib/vehicles/vehicleTypes';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { format } from 'date-fns';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import { sanitizeFirestoreData } from '@/src/utils/sanitizeFirestoreData';

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
      alert('Please fill Full Name, Phone, and Vehicle Model.');
      return;
    }
    onSave(sanitizeFirestoreData(form));
  };

  const handleCurrencyChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(key, parseCurrencyString(e.target.value));
  };

  return (
    <div className="w-full max-w-[100vw] mx-auto px-6 py-8 bg-white rounded-lg shadow overflow-y-auto max-h-[90vh] space-y-10">
      <Section title="Customer Information">
        <GridCols>{[
          <Input key="name" placeholder="Full Name" value={form.fullName || ''} onChange={(e) => handleChange('fullName', e.target.value)} />,
          <Input key="phone" placeholder="Phone" value={form.phone || ''} onChange={(e) => handleChange('phone', e.target.value)} />,
          <Input key="idnum" placeholder="ID Number" value={form.idNumber || ''} onChange={(e) => handleChange('idNumber', e.target.value)} />,
          <Input key="addr" placeholder="Address" value={form.address || ''} onChange={(e) => handleChange('address', e.target.value)} />,
        ]}</GridCols>
      </Section>

      <Section title="Vehicle Information">
        <GridCols>{[
          <Input key="model" placeholder="Vehicle Model" value={form.vehicleModel || ''} onChange={(e) => handleChange('vehicleModel', e.target.value)} />,
          <Input key="color" placeholder="Vehicle Color" value={form.vehicleColor || ''} onChange={(e) => handleChange('vehicleColor', e.target.value)} />,
          <Input key="vin" placeholder="VIN" value={form.vin || ''} onChange={(e) => handleChange('vin', e.target.value)} />,
          <Input key="plate" placeholder="License Plate" value={form.licensePlate || ''} onChange={(e) => handleChange('licensePlate', e.target.value)} />,
        ]}</GridCols>
      </Section>

      <Section title="Rental Period">
        <GridCols>{[
          <Input
            key="date"
            type="date"
            value={form.rentalStartDate || ''}
            onChange={(e) => handleChange('rentalStartDate', e.target.value)}
          />,
          <Input
            key="hour"
            placeholder="Rental Start Hour"
            value={form.rentalStartHour || ''}
            onChange={(e) => handleChange('rentalStartHour', e.target.value)}
          />,
          <Input
            key="days"
            type="number"
            placeholder="Rental Days"
            value={form.rentalDays || 1}
            onChange={(e) => handleChange('rentalDays', Number(e.target.value))}
          />,
          <Input
            key="end"
            type="date"
            value={form.rentalEndDate || ''}
            readOnly
          />,
        ]}</GridCols>
      </Section>


      <Section title="Pricing & Deposit">
        <GridCols>{[
          <div key="pkg" className="space-y-1">
            <label className="text-sm text-gray-600 font-medium">Rental package</label>
            <select
              className="border p-2 rounded w-full"
              value={form.package || ''}
              onChange={(e) => handleChange('package', e.target.value)}
            >
              <option value="">Select Package</option>
              {Object.entries(packageNames).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>,

          <div key="base" className="space-y-1">
            <label className="text-sm text-gray-600 font-medium">Base rental price (₫/day)</label>
            <Input value={formatCurrency(form.basePrice)} onChange={handleCurrencyChange('basePrice')} />
          </div>,

          <div key="fee" className="space-y-1">
            <label className="text-sm text-gray-600 font-medium">Battery rental fee (₫)</label>
            <Input value={formatCurrency(form.batteryFee || 0)} onChange={handleCurrencyChange('batteryFee')} />
          </div>,

          <div key="total" className="space-y-1">
            <label className="text-sm text-gray-600 font-medium">Total amount (auto-calculated)</label>
            <Input value={formatCurrency(form.totalAmount)} readOnly className="bg-gray-100 text-gray-600 font-semibold" />
          </div>,

          <div key="deposit" className="space-y-1">
            <label className="text-sm text-gray-600 font-medium">Deposit amount (₫)</label>
            <Input value={formatCurrency(form.deposit)} onChange={handleCurrencyChange('deposit')} />
          </div>,

          <div key="remain" className="space-y-1">
            <label className="text-sm text-gray-600 font-medium">Remaining balance (auto-calculated)</label>
            <Input value={formatCurrency(form.remainingBalance)} readOnly className="bg-gray-100 text-gray-600 font-semibold" />
          </div>,
        ]}</GridCols>
      </Section>


      <Section title="Accessories">
        <GridCols>{[
          <Checkbox label="Helmet" value={form.helmet} onChange={(v) => handleChange('helmet', v)} />,
          <Checkbox label="Charger" value={form.charger} onChange={(v) => handleChange('charger', v)} />,
          <Checkbox label="Rear Rack" value={form.rearRack} onChange={(v) => handleChange('rearRack', v)} />,
          <Checkbox label="Phone Holder" value={form.phoneHolder} onChange={(v) => handleChange('phoneHolder', v)} />,
          <Checkbox label="Raincoat" value={form.raincoat} onChange={(v) => handleChange('raincoat', v)} />,
        ]}</GridCols>
      </Section>

      <Section title="Battery Info">
        <GridCols>{[
          <Input key="b1" placeholder="Battery Code 1" value={form.batteryCode1 || ''} onChange={(e) => handleChange('batteryCode1', e.target.value)} />,
          <Input key="b2" placeholder="Battery Code 2" value={form.batteryCode2 || ''} onChange={(e) => handleChange('batteryCode2', e.target.value)} />,
          <Input key="b3" placeholder="Battery Code 3" value={form.batteryCode3 || ''} onChange={(e) => handleChange('batteryCode3', e.target.value)} />,
          <Input key="b4" placeholder="Battery Code 4" value={form.batteryCode4 || ''} onChange={(e) => handleChange('batteryCode4', e.target.value)} />,
        ]}</GridCols>
      </Section>

      <Section title="Rental Method">
        <GridCols>{[
          <select key="method" className="border p-2 rounded" value={form.deliveryMethod || ''} onChange={(e) => handleChange('deliveryMethod', e.target.value)}>
            <option value="">Select Method</option>
            <option value="Pickup at Shop">Pickup at Shop</option>
            <option value="Deliver to Address">Deliver to Address</option>
          </select>,
          form.deliveryMethod === 'Deliver to Address' && (
            <Textarea key="addr" placeholder="Delivery Address" value={form.deliveryAddress || ''} onChange={(e) => handleChange('deliveryAddress', e.target.value)} />
          ),
        ]}</GridCols>
      </Section>

      <Section title="Station">
        <GridCols>
          {stationsLoading
            ? [<p key="loading">Loading stations...</p>]
            : [
                <select
                  key="stationSelect"
                  className="border p-2 rounded w-full"
                  value={form.stationId || ''}
                  onChange={(e) => handleChange('stationId', e.target.value)}
                >
                  <option value="">Select Station</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name}
                    </option>
                  ))}
                </select>,
              ]}
        </GridCols>
      </Section>


      <Section title="Notes">
        <Textarea placeholder="Additional Notes" value={form.note || ''} onChange={(e) => handleChange('note', e.target.value)} />
      </Section>

      <Section title="Update Status For The Booking (Company Admin & Company Owner)">
        <GridCols>{[
          <div key="status" className="space-y-1">
            <label className="text-sm text-gray-600 font-medium">Status</label>
            <select
              className="border p-2 rounded w-full"
              value={form.bookingStatus || 'draft'}
              onChange={(e) => handleChange('bookingStatus', e.target.value)}
            >
              <option value="draft">Draft</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>,

          <div key="statusNote" className="space-y-1 col-span-3">
            <label className="text-sm text-gray-600 font-medium">Status Note (optional)</label>
            <Textarea
              placeholder="Enter comment for status change..."
              value={form.statusComment || ''}
              onChange={(e) => handleChange('statusComment', e.target.value)}
            />
          </div>,
        ]}</GridCols>
      </Section>


      <div className="flex justify-end gap-4 pt-4">
        <Button onClick={handleSubmit}>Save</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function GridCols({ children }: { children: React.ReactNode | React.ReactNode[] }) {
  const arrayChildren = Array.isArray(children) ? children : [children];

  return (
    <div className="grid grid-cols-4 gap-4">
      {arrayChildren.filter(Boolean).map((child, index) => (
        <div key={index}>{child}</div>
      ))}
    </div>
  );
}



function Checkbox({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={value || false} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
