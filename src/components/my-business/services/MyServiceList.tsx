'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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
  getDoc,
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
import type { BusinessType } from '@/src/lib/my-business/businessTypes';

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

  // Current business (để gắn vào service & cũng để query thống nhất với Sidebar)
  const [currentBusinessId, setCurrentBusinessId] = useState<string | null>(null);
  const [currentBusinessType, setCurrentBusinessType] = useState<BusinessType | null>(null);
  const [loadingBiz, setLoadingBiz] = useState(false);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState<string | null>(null);
  const [editService, setEditService] = useState<UserService | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Allowed categories (memoized)
  const allowedCategories: ServiceCategoryKey[] = useMemo(() => {
    return orgType === 'technician_partner' && technicianSubtype
      ? serviceCategoriesByTechnicianSubtype[technicianSubtype]
      : serviceCategoriesByOrgType[orgType] || [];
  }, [orgType, technicianSubtype]);

  // Load business info từ users/{uid}.business
  useEffect(() => {
    let mounted = true;
    const loadBiz = async () => {
      if (!userId) return;
      setLoadingBiz(true);
      try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (!mounted) return;
        const biz = snap.exists() ? (snap.data() as any)?.business : null;
        if (biz?.id && biz?.type) {
          setCurrentBusinessId(biz.id as string);
          setCurrentBusinessType(biz.type as BusinessType);
        } else {
          setCurrentBusinessId(null);
          setCurrentBusinessType(null);
        }
      } catch {
        setCurrentBusinessId(null);
        setCurrentBusinessType(null);
      } finally {
        if (mounted) setLoadingBiz(false);
      }
    };
    loadBiz();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Fetch services (theo businessId nếu có; nếu không thì theo userId)
  const fetchServices = useCallback(async () => {
    if (!userId) return;
    // Đợi loadBiz xong để biết có businessId hay không
    if (loadingBiz) return;

    setLoading(true);
    try {
      let qRef;
      if (currentBusinessId) {
        qRef = query(collection(db, 'services'), where('businessId', '==', currentBusinessId));
      } else {
        qRef = query(collection(db, 'services'), where('userId', '==', userId));
      }

      const snap = await getDocs(qRef);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as UserService[];
      setServices(
        data.filter((s) => allowedCategories.includes(s.category as ServiceCategoryKey))
      );
    } finally {
      setLoading(false);
    }
  }, [userId, currentBusinessId, loadingBiz, allowedCategories]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Create: nới lỏng kiểu data để khớp AddNewServiceCard & gắn businessId/businessType
  const handleCreateNewService = async (
    category: ServiceCategoryKey,
    serviceType: SupportedServiceType,
    data: Record<string, any>
  ) => {
    if (!userId) return;
    await addDoc(collection(db, 'services'), {
      ...data,
      category,
      serviceType,
      status: 'pending',
      userId,
      businessId: currentBusinessId ?? null,
      businessType: currentBusinessType ?? null,
      createdAt: serverTimestamp(),
    });
    await fetchServices();
  };

  // Update
  const handleUpdateService = async (id: string, updatedData: Partial<UserService>) => {
    const ref = doc(db, 'services', id);
    await updateDoc(ref, {
      ...updatedData,
      // Giữ businessId/businessType nếu đã có (không ghi đè bằng undefined)
      ...(currentBusinessId ? { businessId: currentBusinessId } : {}),
      ...(currentBusinessType ? { businessType: currentBusinessType } : {}),
      updatedAt: serverTimestamp(),
    });
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

          {loading || loadingBiz ? (
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
        description={t(
          'my_service_list.update_success_description',
          'Your service was updated successfully.'
        )}
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
