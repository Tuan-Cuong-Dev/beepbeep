import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import {
  SubscriptionPackage,
  DurationType,
  ChargingMethod,
  SubscriptionPackageStatus,
} from '@/src/lib/subscriptionPackages/subscriptionPackagesType';

interface Props {
  initialData?: SubscriptionPackage;
  onSave: (data: Omit<SubscriptionPackage, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function SubscriptionPackageForm({ initialData, onSave, onCancel }: Props) {
  const isUpdateMode = Boolean(initialData);

  const [form, setForm] = useState<Omit<SubscriptionPackage, 'id' | 'createdAt' | 'updatedAt'>>({
    companyId: '',
    name: '',
    durationType: 'daily',
    kmLimit: null,
    chargingMethod: 'swap',
    basePrice: 0,
    overageRate: null,
    note: '',
    status: 'available', // ✅ mặc định là available
  });

  useEffect(() => {
    if (initialData) {
      const { id, createdAt, updatedAt, ...rest } = initialData;
      setForm(rest);
    }
  }, [initialData]);

  const handleChange = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!form.name || !form.durationType || !form.chargingMethod) {
      alert('Please fill in all required fields');
      return;
    }

    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      overageRate: form.overageRate !== null ? Number(form.overageRate) : null,
      kmLimit: form.kmLimit !== null ? Number(form.kmLimit) : null,
    };

    onSave(payload);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {isUpdateMode ? 'Edit Subscription Package' : 'Add New Subscription Package'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Package Name"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />

        <SimpleSelect
          value={form.durationType}
          onChange={(val) => handleChange('durationType', val as DurationType)}
          options={[
            { label: 'Daily', value: 'daily' },
            { label: 'Monthly', value: 'monthly' },
          ]}
          placeholder="Select Duration"
        />

        <SimpleSelect
          value={form.chargingMethod}
          onChange={(val) => handleChange('chargingMethod', val as ChargingMethod)}
          options={[
            { label: 'Swap Battery', value: 'swap' },
            { label: 'Self Charge', value: 'self' },
          ]}
          placeholder="Select Charging"
        />

        <Input
          type="number"
          placeholder="KM Limit (optional)"
          value={form.kmLimit !== null ? form.kmLimit : ''}
          onChange={(e) => {
            const val = e.target.value;
            handleChange('kmLimit', val === '' ? null : parseInt(val));
          }}
        />

        <Input
          type="number"
          placeholder="Base Price (VND)"
          value={form.basePrice === 0 ? '' : form.basePrice}
          onChange={(e) => {
            const val = e.target.value;
            handleChange('basePrice', val === '' ? 0 : parseInt(val));
          }}
        />

        <Input
          type="number"
          placeholder="Overage Rate (VND/km)"
          value={form.overageRate !== null ? form.overageRate : ''}
          onChange={(e) => {
            const val = e.target.value;
            handleChange('overageRate', val === '' ? null : parseInt(val));
          }}
        />

        <SimpleSelect
          value={form.status}
          onChange={(val) => handleChange('status', val as SubscriptionPackageStatus)}
          options={[
            { label: 'Available', value: 'available' },
            { label: 'Inactive', value: 'inactive' },
          ]}
          placeholder="Select Status"
        />

        <Textarea
          className="md:col-span-3"
          placeholder="Notes (optional)"
          value={form.note ?? ''}
          onChange={(e) => handleChange('note', e.target.value)}
        />
      </div>

      <div className="flex justify-start gap-2 mt-6">
        <Button type="button" onClick={handleSubmit}>
          {isUpdateMode ? 'Save Changes' : 'Add Package'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
