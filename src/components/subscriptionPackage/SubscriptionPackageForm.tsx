'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
    status: 'available',
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
      alert(t('subscription_package_form.required_fields_warning'));
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
        {isUpdateMode
          ? t('subscription_package_form.edit_title')
          : t('subscription_package_form.add_title')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder={t('subscription_package_form.package_name')}
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />

        <SimpleSelect
          value={form.durationType}
          onChange={(val) => handleChange('durationType', val as DurationType)}
          options={[
            { label: t('subscription_package_form.options.durationType.daily'), value: 'daily' },
            { label: t('subscription_package_form.options.durationType.monthly'), value: 'monthly' },
          ]}
          placeholder={t('subscription_package_form.select_duration')}
        />

        <SimpleSelect
          value={form.chargingMethod}
          onChange={(val) => handleChange('chargingMethod', val as ChargingMethod)}
          options={[
            { label: t('subscription_package_form.options.chargingMethod.swap'), value: 'swap' },
            { label: t('subscription_package_form.options.chargingMethod.self'), value: 'self' },
          ]}
          placeholder={t('subscription_package_form.select_charging')}
        />

        <Input
          type="number"
          placeholder={t('subscription_package_form.km_limit')}
          value={form.kmLimit !== null ? form.kmLimit : ''}
          onChange={(e) => {
            const val = e.target.value;
            handleChange('kmLimit', val === '' ? null : parseInt(val));
          }}
        />

        <Input
          type="text"
          placeholder={t('subscription_package_form.base_price')}
          value={form.basePrice ? formatCurrency(form.basePrice) : ''}
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d]/g, '');
            handleChange('basePrice', val === '' ? 0 : parseInt(val));
          }}
        />

        <Input
          type="text"
          placeholder={t('subscription_package_form.overage_rate')}
          value={form.overageRate !== null ? formatCurrency(form.overageRate) : ''}
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d]/g, '');
            handleChange('overageRate', val === '' ? null : parseInt(val));
          }}
        />

        <SimpleSelect
          value={form.status}
          onChange={(val) => handleChange('status', val as SubscriptionPackageStatus)}
          options={[
            { label: t('subscription_package_form.options.status.available'), value: 'available' },
            { label: t('subscription_package_form.options.status.inactive'), value: 'inactive' },
          ]}
          placeholder={t('subscription_package_form.select_status')}
        />

        <Textarea
          className="md:col-span-3"
          placeholder={t('subscription_package_form.notes')}
          value={form.note ?? ''}
          onChange={(e) => handleChange('note', e.target.value)}
        />
      </div>

      <div className="flex justify-start gap-2 mt-6">
        <Button type="button" onClick={handleSubmit}>
          {isUpdateMode
            ? t('subscription_package_form.save_changes')
            : t('subscription_package_form.add_package')}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('subscription_package_form.cancel')}
        </Button>
      </div>
    </div>
  );
}
