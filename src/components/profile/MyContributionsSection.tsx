'use client';

import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  DocumentData,
} from 'firebase/firestore';
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
  status: string;
}

export default function MyContributionsSection() {
  const { currentUser } = useAuth();
  const { t } = useTranslation('common');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContributions = async () => {
      if (!currentUser?.uid) return;

      setLoading(true);
      const all: Contribution[] = [];

      // Fetch Repair Shops
      const q1 = query(
        collection(db, 'technicianPartners'),
        where('createdBy', '==', currentUser.uid)
      );
      const rs1 = await getDocs(q1);
      rs1.forEach((doc) => {
        const d = doc.data();
        all.push({
          id: doc.id,
          type: 'repair_shop',
          name: d.shopName || d.name || '—',
          address: d.mapAddress || d.shopAddress || '—',
          createdAt: d.createdAt || null,
          status: d.isActive ? 'approved' : 'pending',
        });
      });

      // Fetch Rental Shops
      const q2 = query(
        collection(db, 'rentalStations'),
        where('createdBy', '==', currentUser.uid)
      );
      const rs2 = await getDocs(q2);
      rs2.forEach((doc) => {
        const d = doc.data();
        all.push({
          id: doc.id,
          type: 'rental_shop',
          name: d.name || '—',
          address: d.mapAddress || d.displayAddress || '—',
          createdAt: d.createdAt || null,
          status: 'pending', // Cần chỉnh nếu có logic duyệt riêng
        });
      });

      // Fetch Battery Stations
      const q3 = query(
        collection(db, 'batteryStations'),
        where('createdBy', '==', currentUser.uid)
      );
      const rs3 = await getDocs(q3);
      rs3.forEach((doc) => {
        const d = doc.data();
        all.push({
          id: doc.id,
          type: 'battery_station',
          name: d.name || '—',
          address: d.mapAddress || d.displayAddress || '—',
          createdAt: d.createdAt || null,
          status: d.isActive ? 'approved' : 'pending',
        });
      });

      setContributions(all.sort((a, b) => {
        const tA = a.createdAt?.toMillis?.() || 0;
        const tB = b.createdAt?.toMillis?.() || 0;
        return tB - tA;
      }));
      setLoading(false);
    };

    fetchContributions();
  }, [currentUser]);

  const getTypeLabel = (type: Contribution['type']) => {
    switch (type) {
      case 'repair_shop':
        return 'Tiệm sửa xe';
      case 'rental_shop':
        return 'Điểm cho thuê';
      case 'battery_station':
        return 'Trạm pin';
      default:
        return '—';
    }
  };

  if (loading) return <p className="p-4">{t('profiles_page_content.loading')}</p>;
  if (contributions.length === 0)
    return <p className="p-4">{t('profiles_page_content.no_contributions')}</p>;

  return (
    <div className="space-y-4">
      {contributions.map((item) => (
        <div
          key={item.id}
          className="border rounded-lg p-4 shadow-sm bg-white"
        >
          <div className="flex justify-between items-center mb-1">
            <p className="text-[#00d289] font-medium">{getTypeLabel(item.type)}</p>
            <p className="text-xs text-gray-500">
              {item.createdAt
                ? format(item.createdAt.toDate(), 'dd/MM/yyyy')
                : '—'}
            </p>
          </div>
          <p className="font-semibold text-gray-800">{item.name}</p>
          <p className="text-sm text-gray-600">{item.address}</p>
          <p className="text-xs mt-1 text-gray-500">
            Trạng thái:{' '}
            <span
              className={
                item.status === 'approved'
                  ? 'text-green-600'
                  : 'text-yellow-600'
              }
            >
              {item.status === 'approved' ? 'Đã duyệt' : 'Đang chờ duyệt'}
            </span>
          </p>
        </div>
      ))}
    </div>
  );
}
