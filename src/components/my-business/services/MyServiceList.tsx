'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useTranslation } from 'react-i18next';

import AddNewServiceCard from './AddNewServiceCard';
import ServiceListItem from './ServiceListItem';
import EditServiceModal from './EditServiceModal';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { UserService } from '@/src/lib/vehicle-services/userServiceTypes';
import {
  ServiceCategoryKey,
  SupportedServiceType,
} from '@/src/lib/vehicle-services/serviceTypes';
import {
  OrganizationType,
  TechnicianSubtype,
  serviceCategoriesByOrgType,
  serviceCategoriesByTechnicianSubtype,
} from '@/src/lib/organizations/serviceCategoryMapping';

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
  const router = useRouter();

  // Data
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [editService, setEditService] = useState<UserService | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Allowed categories
  const allowedCategories: ServiceCategoryKey[] =
    orgType === 'technician_partner' && technicianSubtype
      ? serviceCategoriesByTechnicianSubtype[technicianSubtype]
      : serviceCategoriesByOrgType[orgType] || [];

  // Fetch
  const fetchServices = async () => {
    if (!userId) return;
    setLoading(true);
    const q = query(collection(db, 'services'), where('userId', '==', userId));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserService[];
    setServices(data.filter((s) => allowedCategories.includes(s.category as ServiceCategoryKey)));
    setLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, [userId, orgType, technicianSubtype]);

  // Create
  const handleCreateNewService = async (
    category: ServiceCategoryKey,
    serviceType: SupportedServiceType,
    data: { name: string; description: string; vehicleTypes: string[]; location: string }
  ) => {
    await addDoc(collection(db, 'services'), {
      ...data,
      category,
      serviceType,
      status: 'pending',
      userId,
      createdAt: serverTimestamp(),
    });
    await fetchServices();
  };

  // Update
  const handleUpdateService = async (id: string, updatedData: Partial<UserService>) => {
    const ref = doc(db, 'services', id);
    await updateDoc(ref, { ...updatedData, updatedAt: serverTimestamp() });
    await fetchServices();
    setEditModalOpen(false);
    setSuccessDialogOpen(true);

    setTimeout(() => {
      setSuccessDialogOpen(false);
      router.push('/profile?tab=business');
    }, 2000);
  };

  // Delete
  const confirmDeleteService = (id: string) => {
    setDeleteServiceId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteServiceId) return;
    await deleteDoc(doc(db, 'services', deleteServiceId));
    setDeleteDialogOpen(false);
    setDeleteServiceId(null);
    await fetchServices();
  };

  // Edit modal
  const openEditModal = (service: UserService) => {
    setEditService(service);
    setEditModalOpen(true);
  };

  return (
    <>
      <div className="grid gap-6 mt-4">
        <AddNewServiceCard
          orgType={orgType}
          technicianSubtype={technicianSubtype}
          onCreateNewService={handleCreateNewService}
        />

        <section>
          <h3 className="text-base font-semibold mb-2">{t('my_service_list.title')}</h3>

          {loading ? (
            <p className="text-sm text-gray-500">{t('my_service_list.loading')}</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-gray-500">{t('my_service_list.no_services')}</p>
          ) : (
            <div className="grid gap-4">
              {services.map((service) => (
                <ServiceListItem
                  key={service.id}
                  service={service}
                  onEdit={() => openEditModal(service)}
                  onDelete={() => confirmDeleteService(service.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Delete Confirmation */}
      <NotificationDialog
        open={deleteDialogOpen}
        type="confirm"
        title={t('my_service_list.confirm_delete_title')}
        description={t('my_service_list.confirm_delete_description')}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirmed}
      />

      {/* Update Success */}
      <NotificationDialog
        open={successDialogOpen}
        type="success"
        title={t('my_service_list.update_success_title', 'Service updated')}
        description={t('my_service_list.update_success_description', 'Your service was updated successfully.')}
        onClose={() => setSuccessDialogOpen(false)}
      />

      {/* Edit Modal */}
      {editService && (
        <EditServiceModal
          open={editModalOpen}
          service={editService}
          onClose={() => setEditModalOpen(false)}
          onSave={(updated) => handleUpdateService(editService.id, updated)}
        />
      )}
    </>
  );
}
