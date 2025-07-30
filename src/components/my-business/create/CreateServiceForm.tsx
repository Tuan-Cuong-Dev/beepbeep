'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { serviceFieldConfig } from '@/src/lib/vehicle-services/serviceFieldConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

interface CreateServiceFormProps {
  category: string;
  serviceType: string;
  technicianType?: TechnicianPartner; // object full
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

  // 👉 Chỉ lấy 'mobile' | 'shop'
  const technicianFormType = technicianType?.type;

  const fields = serviceFieldConfig?.[category]?.[serviceType] ?? [];

  const resolvedFields = Array.isArray(fields)
    ? fields
    : technicianFormType && fields?.[technicianFormType]
    ? fields[technicianFormType] ?? []
    : [];

  const [formData, setFormData] = useState<Record<string, any>>({
    name: defaultName,
    vehicleTypes: [],
  });

  const handleChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const toggleVehicleType = (type: string) => {
    setFormData((prev) => {
      const current = prev.vehicleTypes || [];
      return {
        ...prev,
        vehicleTypes: current.includes(type)
          ? current.filter((v: string) => v !== type)
          : [...current, type],
      };
    });
  };

  return (
    <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
      {resolvedFields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium mb-1">{t(field.label)}</label>

          {field.type === 'text' || field.type === 'number' ? (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              className="w-full border rounded p-2"
              required={field.required}
              placeholder={field.placeholder ? t(field.placeholder) : ''}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          ) : field.type === 'textarea' ? (
            <textarea
              className="w-full border rounded p-2"
              rows={3}
              placeholder={field.placeholder ? t(field.placeholder) : ''}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
            />
          ) : field.type === 'multi-select' && field.options ? (
            <div className="flex gap-2 flex-wrap">
              {field.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`px-3 py-1 text-sm rounded border ${
                    (formData[field.name] || []).includes(opt)
                      ? 'bg-[#00d289] text-white border-[#00d289]'
                      : 'bg-white text-gray-700'
                  }`}
                  onClick={() =>
                    handleChange(
                      field.name,
                      (formData[field.name] || []).includes(opt)
                        ? formData[field.name].filter((v: string) => v !== opt)
                        : [...(formData[field.name] || []), opt]
                    )
                  }
                >
                  {t(opt)}
                </button>
              ))}
            </div>
          ) : field.type === 'checkbox' ? (
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={!!formData[field.name]}
              onChange={(e) => handleChange(field.name, e.target.checked)}
            />
          ) : null}
        </div>
      ))}

      <div className="text-right pt-2">
        <button
          type="button"
          className="px-4 py-2 bg-[#00d289] text-white rounded shadow text-sm"
          onClick={() =>
            onSubmit({
              ...formData,
              category,
              serviceType,
              technicianType: technicianFormType,
            })
          }
        >
          {t('service_form.submit')}
        </button>
      </div>
    </div>
  );
}
