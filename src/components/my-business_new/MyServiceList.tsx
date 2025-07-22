'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/src/hooks/useAuth';
import { SupportedServiceType } from '@/src/lib/rentalCompanies/rentalCompaniesTypes_new';
import { useTranslation } from 'react-i18next';
import ServiceCategorySelector from '@/src/components/vehicle-services/ServiceCategorySelector';
import ServiceTypeSelector from '@/src/components/vehicle-services/ServiceTypeSelector';

interface UserService {
  id: string;
  name: string;
  category: SupportedServiceType;
  vehicleTypes: string[];
  location: string;
  status: 'active' | 'pending' | 'inactive';
  description?: string;
}

export default function MyServiceList() {
  const { currentUser } = useAuth();
  const { t } = useTranslation('common');

  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState<string>();
  const [serviceType, setServiceType] = useState<string>();

  useEffect(() => {
    const fetchServices = async () => {
      if (!currentUser) return;

      const q = query(collection(db, 'services'), where('userId', '==', currentUser.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as UserService[];

      setServices(data);
      setLoading(false);
    };

    fetchServices();
  }, [currentUser]);

  // ✅ Reset serviceType khi đổi category
  const handleSelectCategory = (newCategory: string) => {
    setCategory(newCategory);
    setServiceType(undefined);
  };

  return (
    <div className="grid gap-6">
      <AddNewServiceCard
        category={category}
        onSelectCategory={handleSelectCategory}
        serviceType={serviceType}
        onSelectServiceType={setServiceType}
      />

      <section>
        <h3 className="text-base font-semibold mb-2">
          {t('my_service_list.title')}
        </h3>

        {loading ? (
          <p className="text-sm text-gray-500">{t('my_service_list.loading')}</p>
        ) : services.length === 0 ? (
          <p className="text-sm text-gray-500">{t('my_service_list.no_services')}</p>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <ServiceListItem key={service.id} service={service} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AddNewServiceCard({
  category,
  onSelectCategory,
  serviceType,
  onSelectServiceType,
}: {
  category?: string;
  onSelectCategory: (val: string) => void;
  serviceType?: string;
  onSelectServiceType: (val: string) => void;
}) {
  const { t } = useTranslation('common');

  return (
    <div className="bg-white border rounded-xl p-4 shadow-sm space-y-6">
      <h3 className="text-base font-semibold">{t('my_service_list.add_new')}</h3>

      {/* Step 1: Select Category */}
      <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <p className="text-sm font-medium text-gray-700 mb-3">
          {t('my_service_list.step1')}
        </p>
        <ServiceCategorySelector
          selectedCategory={category}
          onSelect={onSelectCategory}
        />
      </section>

      {/* Step 2: Select Specific Service */}
      {category && (
        <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-3">
            {t('my_service_list.step2')}
          </p>

          <ServiceTypeSelector
            selectedCategory={category}
            selectedService={serviceType}
            onSelect={onSelectServiceType}
          />

          {serviceType && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">
                {t('my_service_list.selected')}:{' '}
                <strong>
                  {t(`service_type_selector.${category}.${serviceType}.label`, {
                    defaultValue: serviceType,
                  })}
                </strong>
              </p>
              <button className="mt-2 px-4 py-2 bg-[#00d289] text-white rounded-lg text-sm shadow">
                {t('my_service_list.continue')}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function ServiceListItem({ service }: { service: UserService }) {
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
          <p className="text-sm text-gray-400">{service.location}</p>
          {service.description && (
            <p className="text-sm text-gray-600 mt-1">{service.description}</p>
          )}
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
