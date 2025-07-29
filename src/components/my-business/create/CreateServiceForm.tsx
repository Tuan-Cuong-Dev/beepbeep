'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CreateServiceFormProps {
  defaultName: string;
  onSubmit: (data: {
    name: string;
    description: string;
    vehicleTypes: string[];
    location: string;
  }) => void;
}

export default function CreateServiceForm({ defaultName, onSubmit }: CreateServiceFormProps) {
  const { t } = useTranslation('common');
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  const vehicleOptions = ['bike', 'motorbike', 'car', 'van', 'bus'];

  const toggleVehicle = (type: string) => {
    setVehicleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div>
        <label className="block text-sm font-medium">{t('service_form.name')}</label>
        <input
          className="w-full border rounded p-2 mt-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t('service_form.description')}</label>
        <textarea
          className="w-full border rounded p-2 mt-1"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder={t('my_service_list.description_placeholder', {
            defaultValue:
              'Optional description about your service (e.g. pricing, specialties, working hours...)',
          })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t('service_form.vehicle_types')}</label>
        <div className="flex gap-2 flex-wrap mt-1">
          {vehicleOptions.map((type) => (
            <button
              key={type}
              onClick={() => toggleVehicle(type)}
              className={`px-3 py-1 text-sm rounded border ${
                vehicleTypes.includes(type)
                  ? 'bg-[#00d289] text-white border-[#00d289]'
                  : 'bg-white text-gray-700'
              }`}
              type="button"
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">{t('service_form.location')}</label>
        <input
          className="w-full border rounded p-2 mt-1"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="text-right">
        <button
          className="px-4 py-2 bg-[#00d289] text-white rounded shadow text-sm"
          onClick={() => onSubmit({ name, description, vehicleTypes, location })}
        >
          {t('service_form.submit')}
        </button>
      </div>
    </div>
  );
}
