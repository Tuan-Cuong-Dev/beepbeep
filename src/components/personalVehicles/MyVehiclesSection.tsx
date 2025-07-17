'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { PersonalVehicle_new } from '@/src/lib/personalVehicles/personalVehiclesTypes_new';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/src/components/ui/button';
import SelectModelThenAddVehicleForm from '@/src/components/personalVehicles/SelectModelThenAddVehicleForm';
import PersonalVehicleCard from '@/src/components/personalVehicles/PersonalVehicleCard';
import EditPersonalVehicleForm from '@/src/components/personalVehicles/EditPersonalVehicleForm';
import NotificationDialog, {
  NotificationType,
} from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';

export default function MyVehiclesSection() {
  const { currentUser, loading } = useAuth();
  const { t } = useTranslation('common');
  const [vehicles, setVehicles] = useState<PersonalVehicle_new[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<PersonalVehicle_new | null>(null);

  const [notif, setNotif] = useState<{
    open: boolean;
    type: NotificationType;
    title: string;
    description?: string;
    onConfirm?: () => void;
  }>({ open: false, type: 'confirm', title: '' });

  const fetchVehicles = async () => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, 'personalVehicles'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PersonalVehicle_new));
    setVehicles(list);
  };

  useEffect(() => {
    if (!loading) fetchVehicles();
  }, [currentUser, loading]);

  const handleVehicleAdded = () => {
    setShowForm(false);
    fetchVehicles();
  };

  const handleDelete = (vehicle: PersonalVehicle_new) => {
    setNotif({
      open: true,
      type: 'confirm',
      title: t('my_vehicles_section.delete_title'),
      description: t('my_vehicles_section.delete_description', { name: vehicle.name }),
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'personalVehicles', vehicle.id));
          setNotif({
            open: true,
            type: 'success',
            title: t('my_vehicles_section.delete_success'),
          });
          fetchVehicles();
        } catch (err) {
          console.error('Failed to delete vehicle:', err);
          setNotif({
            open: true,
            type: 'error',
            title: t('my_vehicles_section.delete_error'),
          });
        }
      },
    });
  };

  return (
    <section className="space-y-6 px-4 md:px-0">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">🚗 {t('my_vehicles_section.title')}</h2>
        {!editingVehicle && (
          <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
            {showForm ? t('my_vehicles_section.close') : t('my_vehicles_section.add')}
          </Button>
        )}
      </div>

      {editingVehicle ? (
        <EditPersonalVehicleForm
          vehicle={editingVehicle}
          onSaved={() => {
            setEditingVehicle(null);
            fetchVehicles();
          }}
          onCancel={() => setEditingVehicle(null)}
        />
      ) : showForm ? (
        <SelectModelThenAddVehicleForm onSaved={handleVehicleAdded} />
      ) : vehicles.length === 0 ? (
        <p className="text-gray-500 text-sm">{t('my_vehicles_section.no_vehicle')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {vehicles.map((vehicle) => (
            <PersonalVehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onDelete={handleDelete}
              onEdit={() => setEditingVehicle(vehicle)}
            />
          ))}
        </div>
      )}

      <NotificationDialog
        open={notif.open}
        type={notif.type}
        title={notif.title}
        description={notif.description}
        onClose={() => setNotif({ ...notif, open: false })}
        onConfirm={notif.onConfirm}
      />
    </section>
  );
}
