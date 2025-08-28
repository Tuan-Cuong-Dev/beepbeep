'use client';

// ✅ Trang quản lý công ty tư nhân (Private Provider)
// 28/08 Có nhìn qua. Nhưng có thể phải viết lại vì giờ nó có collection riêng chứ ko dùng chung với RentalCompany

import { useEffect, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompaniesTypes';
import {
  getMyRentalCompany,
  updateRentalCompany,
} from '@/src/components/rental-management/private-provider/rentalCompanyService';
import PrivateProviderForm, {
  PrivateProviderFormData,
} from '@/src/components/rental-management/private-provider/PrivateProviderForm';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Timestamp } from 'firebase/firestore';

export default function PrivateProviderPage() {
  const { user } = useUser();
  const router = useRouter();
  const [company, setCompany] = useState<RentalCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user) return;
      const data = await getMyRentalCompany(user.uid);
      if (!data) {
        toast.error('No private provider company found');
        router.push('/my-business/create');
      } else {
        setCompany(data);
        setLoading(false);
      }
    };

    fetchCompany();
  }, [user, router]);

  const handleSave = async (formData: PrivateProviderFormData) => {
    if (!user || !company) return;
    try {
      const updatedData: Omit<RentalCompany, 'id'> = {
        ...formData,
        businessType: 'private_provider',
        ownerId: user.uid,
        createdAt: company.createdAt,
        updatedAt: Timestamp.now(),
        supportedVehicleTypes: [],
        supportedServiceTypes: []
      };
      await updateRentalCompany(company.id, updatedData);
      toast.success('✅ Private Provider updated successfully');
    } catch (err) {
      toast.error('❌ Failed to update provider');
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-4 py-10 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-white p-8 rounded-3xl shadow-xl border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            My Private Provider Company 
          </h1>

          <PrivateProviderForm
            editingCompany={company}
            onSave={handleSave}
            onCancel={() => router.push('/my-business')}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}