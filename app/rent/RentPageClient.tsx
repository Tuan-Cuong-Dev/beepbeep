'use client';

import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import RentBikeFormFactory from '@/src/components/rent/RentBikeFormFactory';
import DynamicRentalForm from '@/src/components/rent/DynamicRentalForm';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

export default function RentPageClient() {
  const { t } = useTranslation('common');
  const { user, role, loading } = useUser();
  const searchParams = useSearchParams();
  const companyIdFromURL = searchParams?.get('companyId') ?? null;

  const [finalCompanyId, setFinalCompanyId] = useState<string | null>(companyIdFromURL);
  const [companyName, setCompanyName] = useState<string>('');
  const [stationId, setStationId] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string>('');

  // 1. Xác định companyId và stationId
  useEffect(() => {
    const detectCompanyAndStation = async () => {
      try {
        if (companyIdFromURL) {
          setFinalCompanyId(companyIdFromURL);
          return;
        }

        const staffRoles = ['company_admin', 'station_manager', 'technician', 'support'];
        if (user?.uid && staffRoles.includes(role)) {
          const snap = await getDocs(query(collection(db, 'staffs'), where('userId', '==', user.uid)));
          if (!snap.empty) {
            const staffData = snap.docs[0].data();
            setFinalCompanyId(staffData.companyId || null);
            setStationId(staffData.stationId || null);
            return;
          }
        }

        if (user?.uid && role === 'company_owner') {
          const snap = await getDocs(query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid)));
          if (!snap.empty) {
            setFinalCompanyId(snap.docs[0].id);
            return;
          }
        }
      } catch (error) {
        console.error('🔥 Error detecting company and station:', error);
      }
    };

    detectCompanyAndStation();
  }, [user?.uid, companyIdFromURL, role]);

  // 2. Lấy CompanyName
  useEffect(() => {
    const fetchCompanyName = async () => {
      if (!finalCompanyId) return;
      const snap = await getDoc(doc(db, 'rentalCompanies', finalCompanyId));
      if (snap.exists()) {
        setCompanyName(snap.data().name || '');
      }
    };
    fetchCompanyName();
  }, [finalCompanyId]);

  // 3. Lấy StationName
  useEffect(() => {
    const fetchStationName = async () => {
      if (!stationId) return;
      const snap = await getDoc(doc(db, 'rentalStations', stationId));
      if (snap.exists()) {
        setStationName(snap.data().name || '');
      }
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
        <div className="text-left text-gray-600 text-sm mb-6 space-y-1 p-4 md:text-right">
          <div>
            <strong>{t('rent_page_client.company')}:</strong> {companyName || t('rent_page_client.no_company')}
          </div>
          <div>
            <strong>🔐 {t('rent_page_client.role')}:</strong> {role}
          </div>
        </div>

        {role === 'staff' ? (
          <DynamicRentalForm companyId={finalCompanyId} userId={user.uid} />
        ) : (
          <RentBikeFormFactory role={role} companyId={finalCompanyId} />
        )}
      </main>
      <Footer />
    </div>
  );
}
