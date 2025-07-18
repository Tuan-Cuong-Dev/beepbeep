'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Contribution {
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
        address:  d.shopAddress,
        createdAt: d.createdAt,
        status: d.isActive ? 'approved' : 'pending',
      }));

      await fetchData('rentalStations', 'rental_shop', (d) => ({
        name: d.name,
        address:  d.displayAddress,
        createdAt: d.createdAt,
        status: 'pending', // Cập nhật nếu có duyệt riêng
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

  const getTypeLabel = (type: Contribution['type']) =>
    t(`my_contributions_section.types.${type}`);

  const getStatusLabel = (status: Contribution['status']) =>
    status === 'approved'
      ? t('my_contributions_section.status.approved')
      : t('my_contributions_section.status.pending');

  const getStatusColor = (status: Contribution['status']) =>
    status === 'approved' ? 'text-green-600' : 'text-yellow-600';

  if (loading) return <p className="p-4">{t('profiles_page_content.loading')}</p>;

  if (contributions.length === 0)
    return <p className="p-4">{t('profiles_page_content.no_contributions')}</p>;

  return (
    <div className="space-y-4">
      {contributions.map((item) => (
        <div key={item.id} className="border rounded-lg p-4 shadow-sm bg-white">
          <div className="flex justify-between items-center mb-1">
            <p className="text-[#00d289] font-medium">{getTypeLabel(item.type)}</p>
            <p className="text-xs text-gray-500">
              {item.createdAt ? format(item.createdAt.toDate(), 'dd/MM/yyyy') : '—'}
            </p>
          </div>
          <p className="font-semibold text-gray-800">{item.name}</p>
          <p className="text-sm text-gray-600">{item.address}</p>
          <p className="text-xs mt-1 text-gray-500">
            {t('my_contributions_section.status_label')}{' '}
            <span className={getStatusColor(item.status)}>
              {getStatusLabel(item.status)}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
