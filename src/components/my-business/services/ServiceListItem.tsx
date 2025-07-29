// 📁 components/my-business/ServiceListItem.tsx
'use client';

import { UserService } from './MyServiceList';
import { useTranslation } from 'react-i18next';

interface Props {
  service: UserService;
}

export default function ServiceListItem({ service }: Props) {
  const { t } = useTranslation('common');

  return (
    <div className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-base font-semibold text-gray-800">{service.name}</h4>
          <p className="text-sm text-gray-500 capitalize">
            {t(`service_labels.${service.category}`, { defaultValue: service.category })} •{' '}
            {service.vehicleTypes.join(', ')}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {service.description ||
              t('my_service_list.description_placeholder', {
                defaultValue:
                  'Optional description about your service (e.g. pricing, specialties, working hours...)',
              })}
          </p>
        </div>
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            service.status === 'active'
              ? 'bg-green-100 text-green-700'
              : service.status === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {t(`my_service_list.status.${service.status}`, {
            defaultValue: service.status,
          })}
        </span>
      </div>
    </div>
  );
}
