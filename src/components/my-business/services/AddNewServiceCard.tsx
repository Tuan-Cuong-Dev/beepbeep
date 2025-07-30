'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ServiceCategorySelector from '@/src/components/vehicle-services/ServiceCategorySelector';
import ServiceTypeSelector from '@/src/components/vehicle-services/ServiceTypeSelector';
import DynamicServiceForm from './DynamicServiceForm';
import { SupportedServiceType, ServiceCategoryKey } from '@/src/lib/vehicle-services/serviceTypes';
import {
  OrganizationType,
  TechnicianSubtype,
  serviceCategoriesByOrgType,
  serviceCategoriesByTechnicianSubtype,
} from '@/src/lib/organizations/serviceCategoryMapping';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

interface Props {
  orgType: OrganizationType;
  technicianSubtype?: TechnicianSubtype;
  onCreateNewService: (
    category: ServiceCategoryKey,
    serviceType: SupportedServiceType,
    data: {
      name: string;
      description: string;
      vehicleTypes: string[];
      location: string;
    }
  ) => void | Promise<void>;
}

export default function AddNewServiceCard({
  orgType,
  technicianSubtype,
  onCreateNewService,
}: Props) {
  const { t } = useTranslation('common');

  const allowedCategories: ServiceCategoryKey[] =
    orgType === 'technician_partner' && technicianSubtype
      ? serviceCategoriesByTechnicianSubtype[technicianSubtype]
      : serviceCategoriesByOrgType[orgType] || [];

  const [selectedCategory, setSelectedCategory] = useState<ServiceCategoryKey>();
  const [selectedServiceType, setSelectedServiceType] = useState<SupportedServiceType>();
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdServiceName, setCreatedServiceName] = useState<string>('');

  const handleSelectCategory = (cat: ServiceCategoryKey) => {
    setSelectedCategory(cat);
    setSelectedServiceType(undefined);
  };

  const handleSubmitForm = (formData: Record<string, any>) => {
    if (!selectedCategory || !selectedServiceType) return;

    // Dịch tên mặc định nếu không nhập
    const defaultName = t(
      `service_type_selector.${selectedCategory}.${selectedServiceType}.label`,
      { defaultValue: selectedServiceType }
    );
    const name = formData.name || defaultName;

    const payload: {
      name: string;
      description: string;
      vehicleTypes: string[];
      location: string;
    } = {
      name,
      description: formData.description || '',
      vehicleTypes: formData.vehicleTypes || [],
      location: formData.location || '',
    };


    onCreateNewService(selectedCategory, selectedServiceType, payload);
    setCreatedServiceName(name);
    setShowSuccess(true);
  };

  return (
    <>
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-6">
        <h3 className="text-base font-semibold">{t('my_service_list.add_new')}</h3>

        {/* Bước 1: Chọn danh mục */}
        <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t('my_service_list.step1')}
          </p>
          <ServiceCategorySelector
            selectedCategory={selectedCategory}
            onSelect={handleSelectCategory}
            allowedCategories={allowedCategories}
          />
        </section>

        {/* Bước 2: Chọn loại dịch vụ */}
        {selectedCategory && (
          <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {t('my_service_list.step2')}
            </p>
            <ServiceTypeSelector
              selectedCategory={selectedCategory}
              selectedService={selectedServiceType}
              onSelect={setSelectedServiceType}
            />
          </section>
        )}

        {/* Bước 3: Nhập form */}
        {selectedCategory && selectedServiceType && (
          <section className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t('my_service_list.selected')}:{' '}
              <strong>
                {t(`service_type_selector.${selectedCategory}.${selectedServiceType}.label`, {
                  defaultValue: selectedServiceType,
                })}
              </strong>
            </p>
            <DynamicServiceForm
              category={selectedCategory}
              serviceType={selectedServiceType}
              onSubmit={handleSubmitForm}
            />
          </section>
        )}
      </div>

      {/* Thông báo thành công */}
      <NotificationDialog
        open={showSuccess}
        type="success"
        title={t('my_service_list.success_title')}
        description={t('my_service_list.success_description', { name: createdServiceName })}
        onClose={() => {
          setShowSuccess(false);
          setSelectedCategory(undefined);
          setSelectedServiceType(undefined);
        }}
      />
    </>
  );
}
