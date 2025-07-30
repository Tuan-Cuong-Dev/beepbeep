'use client';

import React, { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useTranslation } from 'react-i18next';

import { SupportedServiceType, ServiceCategoryKey } from '@/src/lib/vehicle-services/serviceTypes';
import {
  OrganizationType,
  TechnicianSubtype,
  serviceCategoriesByOrgType,
  serviceCategoriesByTechnicianSubtype,
} from '@/src/lib/organizations/serviceCategoryMapping';

import AddNewServiceCard from './AddNewServiceCard';
import ServiceListItem from './ServiceListItem';

type ServiceStatus = 'active' | 'pending' | 'inactive';

interface UserService {
  id: string;
  name: string;
  category: ServiceCategoryKey;
  serviceType: SupportedServiceType;
  vehicleTypes: string[];
  location: string;
  status: ServiceStatus;
  description?: string;
}

interface MyServiceListProps {
  userId: string;
  orgType: OrganizationType;
  technicianSubtype?: TechnicianSubtype;
}

export default function MyServiceList({
  userId,
  orgType,
  technicianSubtype,
}: MyServiceListProps) {
  const { t } = useTranslation('common');
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);

  const allowedCategories: ServiceCategoryKey[] =
    orgType === 'technician_partner' && technicianSubtype
      ? serviceCategoriesByTechnicianSubtype[technicianSubtype]
      : serviceCategoriesByOrgType[orgType] || [];

  const fetchServices = async () => {
    if (!userId) return;

    const q = query(collection(db, 'services'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserService[];

    const filtered = data.filter((s) =>
      allowedCategories.includes(s.category as ServiceCategoryKey)
    );

    setServices(filtered);
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, [userId, orgType, technicianSubtype]);

  const handleCreateNewService = async (
    category: ServiceCategoryKey,
    serviceType: SupportedServiceType,
    data: {
      name: string;
      description: string;
      vehicleTypes: string[];
      location: string;
    }
  ) => {
    try {
      await addDoc(collection(db, 'services'), {
        name: data.name,
        description: data.description,
        vehicleTypes: data.vehicleTypes,
        location: data.location,
        category,
        serviceType,
        status: 'pending',
        userId,
        createdAt: serverTimestamp(),
      });

      console.log('✅ Service added to Firestore');
      await fetchServices(); // 🔁 refresh list ngay sau khi thêm mới
    } catch (error) {
      console.error('❌ Failed to create service:', error);
    }
  };

  return (
    <div className="grid gap-6">
      {/* Add New Service */}
      <AddNewServiceCard
        orgType={orgType}
        technicianSubtype={technicianSubtype}
        onCreateNewService={handleCreateNewService}
      />

      {/* Existing Services */}
      <section>
        <h3 className="text-base font-semibold mb-2">{t('my_service_list.title')}</h3>

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
