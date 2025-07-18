'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Button } from '@/src/components/ui/button';
import EditContributionModal from '@/src/components/contribute/edit/EditContributionModal';

export interface Contribution {
  id: string;
  type: 'repair_shop' | 'rental_shop' | 'battery_station';
  name: string;
  address: string;
  createdAt: Timestamp | null;
  status: 'approved' | 'pending';
}

export default function MyContributionsSection() {
  const { currentUser } = useAuth();
  const { t } = useTranslation('common');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [editing, setEditing] = useState<Contribution | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchContributions = async () => {
      setLoading(true);
      const all: Contribution[] = [];

      const fetchData = async (
        col: string,
        type: Contribution['type'],
        mapData: (d: any) => Partial<Contribution>
      ) => {
        const q = query(collection(db, col), where('createdBy', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => {
          const data = mapData(doc.data());
          all.push({
            id: doc.id,
            type,
            name: data.name ?? '—',
            address: data.address ?? '—',
            createdAt: data.createdAt ?? null,
            status: data.status ?? 'pending',
          });
        });
      };

      await fetchData('technicianPartners', 'repair_shop', (d) => ({
        name: d.shopName || d.name,
        address: d.shopAddress,
        createdAt: d.createdAt,
        status: d.isActive ? 'approved' : 'pending',
      }));

      await fetchData('rentalStations', 'rental_shop', (d) => ({
        name: d.name,
        address: d.displayAddress,
        createdAt: d.createdAt,
        status: 'pending',
      }));

      await fetchData('batteryStations', 'battery_station', (d) => ({
        name: d.name,
        address: d.displayAddress,
        createdAt: d.createdAt,
        status: d.isActive ? 'approved' : 'pending',
      }));

      setContributions(
        all.sort((a, b) => {
          const tA = a.createdAt?.toMillis?.() || 0;
          const tB = b.createdAt?.toMillis?.() || 0;
          return tB - tA;
        })
      );
      setLoading(false);
    };

    fetchContributions();
  }, [currentUser]);

  const getStatusLabel = (status: Contribution['status']) =>
    status === 'approved'
      ? t('my_contributions_section.status.approved')
      : t('my_contributions_section.status.pending');

  const getStatusColor = (status: Contribution['status']) =>
    status === 'approved' ? 'text-green-600' : 'text-yellow-600';

  const grouped = {
    repair_shop: contributions.filter((c) => c.type === 'repair_shop'),
    rental_shop: contributions.filter((c) => c.type === 'rental_shop'),
    battery_station: contributions.filter((c) => c.type === 'battery_station'),
  };

  const openEditModal = (item: Contribution) => {
    setEditing(item);
    setModalOpen(true);
  };

  const renderSection = (type: Contribution['type']) => {
    const items = grouped[type];
    if (!items.length) return null;

    return (
      <section className="mb-6">
        <h2 className="text-lg font-semibold text-[#00d289] mb-2">
          {t(`my_contributions_section.types.${type}`)}
        </h2>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="border rounded-lg p-4 shadow-sm bg-white">
              <div className="flex justify-between items-center mb-1">
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.createdAt ? format(item.createdAt.toDate(), 'dd/MM/yyyy') : '—'}
                </p>
              </div>
              <p className="text-sm text-gray-600">{item.address}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {t('my_contributions_section.status_label')}{' '}
                  <span className={getStatusColor(item.status)}>
                    {getStatusLabel(item.status)}
                  </span>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditModal(item)}
                >
                  {t('my_contributions_section.edit')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  if (loading) return <p className="p-4">{t('profiles_page_content.loading')}</p>;

  if (contributions.length === 0)
    return <p className="p-4">{t('profiles_page_content.no_contributions')}</p>;

  return (
    <>
      <div className="space-y-8">
        {renderSection('repair_shop')}
        {renderSection('rental_shop')}
        {renderSection('battery_station')}
      </div>

      <EditContributionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contribution={editing}
      />
    </>
  );
}
