'use client';

import { useTranslation } from 'react-i18next';
import { serviceFieldConfig } from '@/src/lib/vehicle-services/serviceFieldConfig';
import { SupportedServiceType, SERVICE_TYPE_ICONS } from '@/src/lib/vehicle-services/serviceTypes';
import { UserService } from '@/src/lib/vehicle-services/userServiceTypes';
import { Button } from '@/src/components/ui/button'; // ✅ Button bạn đã tạo

interface Props {
  service: UserService;
  onEdit: (service: UserService) => void;
  onDelete: (id: string) => void;
}

export default function ServiceListItem({ service, onEdit, onDelete }: Props) {
  const { t } = useTranslation('common');

  const statusStyle = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    inactive: 'bg-gray-200 text-gray-600',
  }[service.status];

  const rawConfig = serviceFieldConfig?.[service.category]?.[service.serviceType];
  const resolvedFields = Array.isArray(rawConfig)
    ? rawConfig
    : service.technicianType && rawConfig?.[service.technicianType]
    ? rawConfig[service.technicianType] ?? []
    : [];

  const translateValue = (value: string) =>
    value.startsWith('options.')
      ? t(value, { defaultValue: value.split('.').pop() })
      : t(value, { defaultValue: value });

  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white">
      <div className="flex justify-between items-start">
        {/* LEFT */}
        <div className="flex-1 space-y-2">
          {/* Icon + Title */}
          <div className="flex items-center gap-2">
            {SERVICE_TYPE_ICONS[service.serviceType as SupportedServiceType]}
            <h4 className="text-base font-semibold text-gray-800">{service.name}</h4>
          </div>

          {/* Subtitle */}
          <p className="text-sm text-gray-500">
            {t(`service_labels.${service.serviceType}`, {
              defaultValue: service.serviceType,
            })}{' '}
            •{' '}
            {service.vehicleTypes
              .map((v) => t(v, { defaultValue: v.split('.').pop() }))
              .join(', ')}
          </p>

          {/* Description */}
          <p className="text-sm text-gray-600">
            {service.description?.trim()
              ? service.description
              : t('my_service_list.description_placeholder', {
                  defaultValue:
                    'Optional description about your service (e.g. pricing, specialties, working hours...)',
                })}
          </p>

          {/* Dynamic Fields */}
          {resolvedFields.map((field) => {
            const value = service[field.name];
            if (value === undefined || value === '') return null;

            const label = t(field.label, { defaultValue: field.name });
            const displayValue = Array.isArray(value)
              ? value.map((v: string) => translateValue(v)).join(', ')
              : translateValue(String(value));

            return (
              <div key={field.name} className="text-sm text-gray-600">
                <span className="font-medium">{label}:</span> {displayValue}
              </div>
            );
          })}

          {/* Creator */}
          {service.creatorName && (
            <div className="flex items-center gap-2 pt-2">
              {service.creatorPhotoURL ? (
                <img
                  src={service.creatorPhotoURL}
                  alt={service.creatorName}
                  className="w-6 h-6 rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200" />
              )}
              <span className="text-sm text-gray-500">{service.creatorName}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(service)}
            >
              {t('common.edit')}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(service.id)}
            >
              {t('common.delete')}
            </Button>
          </div>
        </div>

        {/* RIGHT: Status */}
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ml-4 ${statusStyle}`}
        >
          {t(`my_service_list.status.${service.status}`, {
            defaultValue: service.status,
          })}
        </span>
      </div>
    </div>
  );
}
