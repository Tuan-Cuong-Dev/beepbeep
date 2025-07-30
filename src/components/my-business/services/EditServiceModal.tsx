'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import NotificationDialog from '@/src/components/ui/NotificationDialog';
import DynamicServiceForm from './DynamicServiceForm';
import { UserService } from '@/src/lib/vehicle-services/userServiceTypes';
import { ServiceCategoryKey, SupportedServiceType } from '@/src/lib/vehicle-services/serviceTypes';

interface EditServiceModalProps {
  open: boolean;
  service: UserService | null;
  onClose: () => void;
  onSave: (data: Record<string, any>) => Promise<void>;
}

export default function EditServiceModal({
  open,
  service,
  onClose,
  onSave,
}: EditServiceModalProps) {
  const { t } = useTranslation('common');

  if (!service) return null;

  return (
    <NotificationDialog
      open={open}
      type="custom"
      title={t('my_service_list.edit_service')}
      onClose={onClose}
    >
      <div className="mt-4 w-full max-w-screen-md mx-auto px-2 sm:px-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-white rounded-xl p-3 sm:p-4">
          <DynamicServiceForm
            category={service.category as ServiceCategoryKey}
            serviceType={service.serviceType as SupportedServiceType}
            partnerType={service.partnerType ?? 'mobile'}
            initialValues={service}
            onSubmit={onSave}
          />
        </div>
      </div>
    </NotificationDialog>
  );
}
