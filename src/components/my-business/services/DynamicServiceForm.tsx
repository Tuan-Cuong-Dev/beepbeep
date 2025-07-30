'use client';

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  serviceFieldConfig,
  ServiceFieldConfig,
} from '@/src/lib/vehicle-services/serviceFieldConfig';
import { ServiceCategoryKey, SupportedServiceType } from '@/src/lib/vehicle-services/serviceTypes';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

type PartnerType = TechnicianPartner['type'] | 'mobile' | 'shop';

interface Props {
  category: ServiceCategoryKey;
  serviceType: SupportedServiceType;
  partnerType?: PartnerType;
  onSubmit: (data: Record<string, any>) => void;
}

const defaultFields: ServiceFieldConfig[] = [
  { name: 'name', label: 'fields.name.label', placeholder: 'fields.name.placeholder', type: 'text', required: true },
  { name: 'description', label: 'fields.description.label', placeholder: 'fields.description.placeholder', type: 'textarea' },
  { name: 'location', label: 'fields.location.label', placeholder: 'fields.location.placeholder', type: 'text', required: true },
  { name: 'workingHours', label: 'fields.workingHours.label', placeholder: 'fields.workingHours.placeholder', type: 'text' },
  {
    name: 'vehicleTypes',
    label: 'fields.vehicleTypes.label',
    type: 'multi-select',
    options: [
      'options.vehicleType.motorbike',
      'options.vehicleType.car',
      'options.vehicleType.van',
    ],
  },
];

export default function DynamicServiceForm({
  category,
  serviceType,
  partnerType = 'mobile',
  onSubmit,
}: Props) {
  const { t } = useTranslation('common');

  // 📌 Lấy cấu hình từ serviceFieldConfig
  const config = serviceFieldConfig[category]?.[serviceType];
  const userDefinedFields: ServiceFieldConfig[] = Array.isArray(config)
    ? config
    : config?.[partnerType] ?? [];

  // 📌 Gộp defaultFields với userFields (tránh duplicate)
  const allFieldsMap = new Map<string, ServiceFieldConfig>();
  [...defaultFields, ...userDefinedFields].forEach((field) =>
    allFieldsMap.set(field.name, field)
  );
  const fields = Array.from(allFieldsMap.values());

  // 📌 Khởi tạo state
  const initialFormState = fields.reduce((acc, field) => {
    acc[field.name] =
      field.type === 'multi-select' ? [] : field.type === 'checkbox' ? false : '';
    return acc;
  }, {} as Record<string, any>);

  const [formData, setFormData] = useState<Record<string, any>>(initialFormState);

  useEffect(() => {
    setFormData(initialFormState);
  }, [category, serviceType, partnerType]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const missingFields = fields.filter(
      (field) =>
        field.required &&
        (!formData[field.name] ||
          (Array.isArray(formData[field.name]) && formData[field.name].length === 0))
    );

    if (missingFields.length > 0) {
      alert(t('dynamic_service_form.missing_required_fields'));
      return;
    }

    onSubmit(formData);
  };

  const renderField = (field: ServiceFieldConfig) => {
    const value = formData[field.name];
    const label = field.label ? t(field.label) : field.name;
    const placeholder = field.placeholder ? t(field.placeholder) : '';

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <input
            type={field.type}
            className="w-full border rounded px-3 py-2"
            placeholder={placeholder}
            value={value}
            onChange={(e) =>
              handleChange(
                field.name,
                field.type === 'number' ? parseFloat(e.target.value) : e.target.value
              )
            }
          />
        );

      case 'textarea':
        return (
          <textarea
            className="w-full border rounded px-3 py-2"
            rows={3}
            placeholder={placeholder}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case 'checkbox':
        return (
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleChange(field.name, e.target.checked)}
            />
            <span>{placeholder}</span>
          </label>
        );

      case 'multi-select':
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const selected = (value ?? []).includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  className={`px-3 py-1 border rounded ${
                    selected ? 'bg-[#00d289] text-white border-[#00d289]' : ''
                  }`}
                  onClick={() => {
                    const updated = selected
                      ? value.filter((v: string) => v !== opt)
                      : [...(value ?? []), opt];
                    handleChange(field.name, updated);
                  }}
                >
                  {t(opt)}
                </button>
              );
            })}
          </div>
        );

      default:
        return <p className="text-red-500">Unsupported field type: {field.type}</p>;
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-1">
            {t(field.label)} {field.required && <span className="text-red-500">*</span>}
          </label>
          {renderField(field)}
        </div>
      ))}

      <div className="text-right mt-6">
        <button
          className="px-4 py-2 bg-[#00d289] text-white rounded"
          onClick={handleSubmit}
        >
          {t('dynamic_service_form.submit')}
        </button>
      </div>
    </div>
  );
}
