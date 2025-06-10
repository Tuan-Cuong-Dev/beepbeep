'use client';
// Page chính quản lý tác vụ thuê xe RENT.
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import RentBikeFormFactory from '@/src/components/rent/RentBikeFormFactory';
import DynamicRentalForm from '@/src/components/rent/DynamicRentalForm';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

export default function RentPageClient() {
  const { user, role, loading } = useUser();
  const searchParams = useSearchParams();
  const companyIdFromURL = searchParams?.get('companyId') ?? null;

  const [finalCompanyId, setFinalCompanyId] = useState<string | null>(companyIdFromURL);
  const [companyName, setCompanyName] = useState<string>('');
  const [stationId, setStationId] = useState<string | null>(null);
  const [stationName, setStationName] = useState<string>('');

  // 1. Xác định CompanyId và StationId
  useEffect(() => {
  const detectCompanyAndStation = async () => {
    try {
      // 1. Nếu có trong URL, ưu tiên dùng
      if (companyIdFromURL) {
        setFinalCompanyId(companyIdFromURL);
        return;
      }

      // 2. Nếu là STAFF, lấy từ bảng staffs
      if (user?.uid && role === 'staff') {
        const snap = await getDocs(query(collection(db, 'staffs'), where('userId', '==', user.uid)));
        if (!snap.empty) {
          const staffData = snap.docs[0].data();
          setFinalCompanyId(staffData.companyId || null);
          setStationId(staffData.stationId || null);
          return;
        }
      }

      // ✅ 3. Nếu là Company Owner → lấy từ bảng rentalCompanies
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

  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (!user || !role) return <div className="text-center py-10">Access denied</div>;
  if (!finalCompanyId) return <div className="text-center py-10">Missing companyId</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-1 py-10">
        <div className="text-left text-gray-600 text-sm mb-6 space-y-1 p-4 md:text-right">
          <div><strong>Company:</strong> {companyName || 'No Company'}</div>
          <div><strong>🔐 Role:</strong> {role}</div>
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
