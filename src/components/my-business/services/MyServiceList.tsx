// 📁 components/my-business/MyServiceList.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { useTranslation } from 'react-i18next';
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
import AddNewServiceCard from './AddNewServiceCard';
import ServiceListItem from './ServiceListItem';

// ----------------------
// 🔑 Types
// ----------------------

type ServiceStatus = 'active' | 'pending' | 'inactive';

export interface UserService {
  id: string;
  name: string;
  category: SupportedServiceType;
  vehicleTypes: string[];
  location: string;
  status: ServiceStatus;
  description?: string;
}

interface MyServiceListProps {
  orgType: OrganizationType;
  technicianSubtype?: TechnicianSubtype;
}

export default function MyServiceList({
  orgType,
  technicianSubtype,
}: MyServiceListProps) {
  const { currentUser } = useAuth();
  const { t } = useTranslation('common');

  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);

  const allowedCategories: ServiceCategoryKey[] =
    orgType === 'technician_partner' && technicianSubtype
      ? serviceCategoriesByTechnicianSubtype[technicianSubtype]
      : serviceCategoriesByOrgType[orgType] || [];

  const fetchServices = async () => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'services'),
      where('userId', '==', currentUser.uid)
    );
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
  }, [currentUser, orgType, technicianSubtype]);

  const handleCreateService = async (
    category: ServiceCategoryKey,
    serviceType: SupportedServiceType,
    data: {
      name: string;
      description: string;
      vehicleTypes: string[];
      location: string;
    }
  ) => {
    if (!currentUser) return;

    const newService: Omit<UserService, 'id'> = {
      name: data.name,
      category: serviceType,
      vehicleTypes: data.vehicleTypes,
      location: data.location,
      status: 'pending',
      description: data.description,
    };

    await addDoc(collection(db, 'services'), {
      ...newService,
      userId: currentUser.uid,
      createdAt: serverTimestamp(),
    });

    setLoading(true);
    fetchServices();
  };

  return (
    <div className="grid gap-6">
      {allowedCategories.length > 0 && (
        <AddNewServiceCard
          orgType={orgType}
          technicianSubtype={technicianSubtype}
          onCreateNewService={handleCreateService}
        />
      )}

      <section>
        <h3 className="text-base font-semibold mb-2">
          {t('my_service_list.title')}
        </h3>
        {loading ? (
          <p className="text-sm text-gray-500">
            {t('my_service_list.loading')}
          </p>
        ) : services.length === 0 ? (
          <p className="text-sm text-gray-500">
            {t('my_service_list.no_services')}
          </p>
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
