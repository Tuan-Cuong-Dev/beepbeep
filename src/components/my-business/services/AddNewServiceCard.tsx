'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ServiceCategorySelector from '@/src/components/vehicle-services/ServiceCategorySelector';
import ServiceTypeSelector from '@/src/components/vehicle-services/ServiceTypeSelector';
import DynamicServiceForm from './DynamicServiceForm';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import {
  SupportedServiceType,
  ServiceCategoryKey,
} from '@/src/lib/vehicle-services/serviceTypes';
import {
  OrganizationType,
  TechnicianSubtype,
  serviceCategoriesByOrgType,
  serviceCategoriesByTechnicianSubtype,
} from '@/src/lib/organizations/serviceCategoryMapping';

interface Props {
  orgType: OrganizationType;
  technicianSubtype?: TechnicianSubtype;
  onCreateNewService: (
    category: ServiceCategoryKey,
    serviceType: SupportedServiceType,
    data: Record<string, any> // 👈 nhận full payload
  ) => void | Promise<void>;
}

export default function AddNewServiceCard({
  orgType,
  technicianSubtype,
  onCreateNewService,
}: Props) {
  const { t } = useTranslation('common');

  const [category, setCategory] = useState<ServiceCategoryKey>();
  const [serviceType, setServiceType] = useState<SupportedServiceType>();
  const [successOpen, setSuccessOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');

  const allowedCategories: ServiceCategoryKey[] =
    orgType === 'technician_partner' && technicianSubtype
      ? serviceCategoriesByTechnicianSubtype[technicianSubtype]
      : serviceCategoriesByOrgType[orgType] || [];

  // Xác định partnerType cho form (nếu là technician_partner)
  const partnerType = (orgType === 'technician_partner' &&
    (technicianSubtype === 'mobile' || technicianSubtype === 'shop'
      ? technicianSubtype
      : undefined)) as 'mobile' | 'shop' | undefined;

  // Chuẩn hoá array: ['options.vehicleType.motorbike'] -> ['motorbike']
  const normalizeArray = (val: unknown) =>
    Array.isArray(val)
      ? val.map((v) =>
          typeof v === 'string' && v.includes('.') ? v.split('.').pop() : v
        )
      : val;

  const handleSubmit = async (formData: Record<string, any>) => {
    if (!category || !serviceType) return;

    const defaultName = t(
      `service_type_selector.${category}.${serviceType}.label`,
      { defaultValue: serviceType }
    );

    // ✅ Giữ nguyên toàn bộ field từ form + chuẩn hoá nhẹ
    const payload: Record<string, any> = {
      ...formData,
      name: (formData.name?.trim?.() || defaultName) as string,
    };

    // Fallback location nếu dùng storeLocation (shop)
    if (!payload.location && typeof payload.storeLocation === 'string') {
      payload.location = payload.storeLocation;
    }

    // Chuẩn hoá các mảng phổ biến về giá trị ngắn
    ['vehicleTypes', 'supportedVehicles', 'insuranceTypes', 'languages'].forEach((k) => {
      if (k in payload) payload[k] = normalizeArray(payload[k]);
    });

    await onCreateNewService(category, serviceType, payload);
    setNewServiceName(payload.name);
    setSuccessOpen(true);
  };

  const resetForm = () => {
    setCategory(undefined);
    setServiceType(undefined);
    setSuccessOpen(false);
  };

  return (
    <>
      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-6">
        <h3 className="text-base font-semibold">{t('my_service_list.add_new')}</h3>

        {/* Step 1: Select Category */}
        <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t('my_service_list.step1')}
          </p>
          <ServiceCategorySelector
            selectedCategory={category}
            onSelect={(cat) => {
              setCategory(cat);
              setServiceType(undefined);
            }}
            allowedCategories={allowedCategories}
          />
        </section>

        {/* Step 2: Select Service Type */}
        {category && (
          <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <p className="text-sm font-medium text-gray-700 mb-3">
              {t('my_service_list.step2')}
            </p>
            <ServiceTypeSelector
              selectedCategory={category}
              selectedService={serviceType}
              onSelect={setServiceType}
            />
          </section>
        )}

        {/* Step 3: Fill Form */}
        {category && serviceType && (
          <section className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {t('my_service_list.selected')}:&nbsp;
              <strong>
                {t(`service_type_selector.${category}.${serviceType}.label`, {
                  defaultValue: serviceType,
                })}
              </strong>
            </p>
            <DynamicServiceForm
              category={category}
              serviceType={serviceType}
              partnerType={partnerType} 
              onSubmit={handleSubmit}
            />
          </section>
        )}
      </div>

      {/* ✅ Notification */}
      <NotificationDialog
        open={successOpen}
        type="success"
        title={t('my_service_list.success_title')}
        description={t('my_service_list.success_description', { name: newServiceName })}
        onClose={resetForm}
      />
    </>
  );
}
