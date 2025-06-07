'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompanyTypes';
import {
  getMyRentalCompany,
  updateRentalCompany,
} from '@/src/components/rental-management/rental-companies/rentalCompanyService';
import RentalCompanyForm, {
  RentalCompanyFormData,
} from '@/src/components/rental-management/rental-company/RentalCompanyForm';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Timestamp } from 'firebase/firestore';

export default function RentalCompanyPage() {
  const { user } = useUser();
  const router = useRouter();
  const [company, setCompany] = useState<RentalCompany | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!user) return;
      const data = await getMyRentalCompany(user.uid);
      if (!data) {
        toast.error('No rental company found for this user');
        router.push('/my-business/create');
      } else {
        setCompany(data);
        setLoading(false);
      }
    };

    fetchCompany();
  }, [user, router]);

  const handleSave = async (formData: RentalCompanyFormData) => {
    if (!user || !company) return;
    try {
      const updatedData: Omit<RentalCompany, 'id'> = {
        ...formData,
        businessType: 'rental_company',
        ownerId: user.uid,
        createdAt: company.createdAt,
        updatedAt: Timestamp.now(),
      };
      await updateRentalCompany(company.id, updatedData);
      toast.success('✅ Company updated successfully');
    } catch (err) {
      toast.error('❌ Failed to update company');
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
            My Rental Company
          </h1>
          <RentalCompanyForm
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
