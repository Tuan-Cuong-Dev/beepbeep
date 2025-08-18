'use client';

import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import RentBikeFormFactory from '@/src/components/rent/RentBikeFormFactory';
import DynamicRentalForm from '@/src/components/rent/DynamicRentalForm';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

type EntityType = 'rentalCompany' | 'privateProvider';

export default function RentPageClient() {
  const { t } = useTranslation('common');
  const { user, role, loading } = useUser();
  const searchParams = useSearchParams();
  const companyIdFromURL = searchParams?.get('companyId') ?? null; // vẫn ưu tiên URL

  const [finalCompanyId, setFinalCompanyId] = useState<string | null>(companyIdFromURL);
  const [entityType, setEntityType] = useState<EntityType>('rentalCompany'); // 🔹 mới
  const [companyName, setCompanyName] = useState<string>('');
  const [stationId, setStationId] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string>('');

  const staffRoles = useMemo(
    () => ['company_admin', 'station_manager', 'technician', 'support'],
    []
  );
  const isStaffRole = !!role && staffRoles.includes(role);

  // 1) Xác định company/provider & station
  useEffect(() => {
    const detectCompanyAndStation = async () => {
      try {
        if (companyIdFromURL) {
          setFinalCompanyId(companyIdFromURL);
          setEntityType('rentalCompany'); // URL hiện đang dành cho company
          return;
        }

        // a) Staff: lấy từ staffs
        if (user?.uid && isStaffRole) {
          const snap = await getDocs(
            query(collection(db, 'staffs'), where('userId', '==', user.uid))
          );
          if (!snap.empty) {
            const d = snap.docs[0].data() as any;
            setFinalCompanyId(d.companyId || null);
            setStationId(d.stationId || null);
            setEntityType('rentalCompany');
            return;
          }
        }

        // b) Company owner: lấy rentalCompanies theo ownerId
        if (user?.uid && role === 'company_owner') {
          const snap = await getDocs(
            query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
          );
          if (!snap.empty) {
            setFinalCompanyId(snap.docs[0].id);
            setEntityType('rentalCompany');
            return;
          }
        }

        // c) 🔸 Private provider: lấy từ privateProviders theo ownerId
        if (user?.uid && role === 'private_provider') {
          const snap = await getDocs(
            query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
          );
          if (!snap.empty) {
            setFinalCompanyId(snap.docs[0].id);
            setEntityType('privateProvider');
            // hầu hết không có station mặc định
            return;
          }
        }

      } catch (e) {
        console.error('🔥 Error detecting company/provider & station:', e);
      }
    };

    detectCompanyAndStation();
  }, [user?.uid, role, isStaffRole, companyIdFromURL]);

  // 2) Lấy tên đơn vị (companyName) theo entityType
  useEffect(() => {
    const fetchName = async () => {
      if (!finalCompanyId) return;
      const col = entityType === 'privateProvider' ? 'privateProviders' : 'rentalCompanies';
      const snap = await getDoc(doc(db, col, finalCompanyId));
      if (snap.exists()) setCompanyName((snap.data() as any).name || '');
    };
    fetchName();
  }, [finalCompanyId, entityType]);

  // 3) Lấy StationName nếu có
  useEffect(() => {
    const fetchStationName = async () => {
      if (!stationId) return;
      const snap = await getDoc(doc(db, 'rentalStations', stationId));
      if (snap.exists()) setStationName((snap.data() as any).name || '');
    };
    fetchStationName();
  }, [stationId]);

  if (loading) return <div className="text-center py-10">{t('rent_page_client.loading')}</div>;
  if (!user || !role) return <div className="text-center py-10">{t('rent_page_client.access_denied')}</div>;
  if (!finalCompanyId) return <div className="text-center py-10">{t('rent_page_client.missing_company')}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 py-10">
        <h1 className="text-3xl font-bold text-center mb-8">
          {t('rent_page_client.title')}
        </h1>

        {isStaffRole ? (
          <DynamicRentalForm
            companyId={finalCompanyId}
            userId={user.uid}
            entityType={entityType}  // 🔹 truyền xuống để đọc đúng collection
          />
        ) : (
          <RentBikeFormFactory
            role={role}
            companyId={finalCompanyId}
            entityType={entityType}  // 🔹 truyền xuống để factory chọn form phù hợp
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
