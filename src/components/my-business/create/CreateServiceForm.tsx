'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { serviceFieldConfig } from '@/src/lib/vehicle-services/serviceFieldConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

interface CreateServiceFormProps {
  category: string;
  serviceType: string;
  technicianType?: TechnicianPartner;
  defaultName: string;
  onSubmit: (data: Record<string, any>) => void;
}

export default function CreateServiceForm({
  category,
  serviceType,
  technicianType,
  defaultName,
  onSubmit,
}: CreateServiceFormProps) {
  const { t } = useTranslation('common');
  const technicianFormType = technicianType?.type; // 'mobile' | 'shop'

  const fields = serviceFieldConfig?.[category]?.[serviceType];
  const resolvedFields =
    Array.isArray(fields) ? fields :
    technicianFormType && fields?.[technicianFormType]
      ? fields[technicianFormType]
      : [];

  const [formData, setFormData] = useState<Record<string, any>>({
    name: defaultName,
    vehicleTypes: [],
  });

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleMultiSelectToggle = (fieldName: string, option: string) => {
    const current = formData[fieldName] || [];
    const updated = current.includes(option)
      ? current.filter((v: string) => v !== option)
      : [...current, option];
    setFormData((prev) => ({ ...prev, [fieldName]: updated }));
  };

  const renderField = (field: any) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <input
            type={field.type}
            className="w-full border rounded p-2"
            required={field.required}
            placeholder={field.placeholder ? t(field.placeholder) : ''}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case 'textarea':
        return (
          <textarea
            className="w-full border rounded p-2"
            rows={3}
            placeholder={field.placeholder ? t(field.placeholder) : ''}
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
          />
        );

      case 'multi-select':
        return (
          <div className="flex gap-2 flex-wrap">
            {field.options?.map((opt: string) => {
              const isSelected = (formData[field.name] || []).includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  className={`px-3 py-1 text-sm rounded border ${
                    isSelected
                      ? 'bg-[#00d289] text-white border-[#00d289]'
                      : 'bg-white text-gray-700'
                  }`}
                  onClick={() => handleMultiSelectToggle(field.name, opt)}
                >
                  {t(opt)}
                </button>
              );
            })}
          </div>
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={!!formData[field.name]}
            onChange={(e) => handleChange(field.name, e.target.checked)}
          />
        );

      default:
        return null;
    }
  };

  const handleSubmit = () => {
    onSubmit({
      ...formData,
      category,
      serviceType,
      technicianType: technicianFormType,
    });
  };

  return (
    <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
      {resolvedFields.map((field: any) => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-1">
            {t(field.label)}
          </label>
          {renderField(field)}
        </div>
      ))}

      <div className="text-right pt-2">
        <button
          type="button"
          className="px-4 py-2 bg-[#00d289] text-white rounded shadow text-sm"
          onClick={handleSubmit}
        >
          {t('service_form.submit')}
        </button>
      </div>
    </div>
  );
}
