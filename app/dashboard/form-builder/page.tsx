'use client';

import { useUser } from '@/src/context/AuthContext';
import FormBuilder from '@/src/components/form-builder/FormBuilder';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface CompanyOption {
  id: string;
  name: string;
}

export default function FormBuilderPage() {
  const { user, companyId, role, loading } = useUser();
  const normalizedRole = (role || '').toLowerCase();

  const allowedRoles = ['admin', 'company_owner', 'private_provider'];
  const canEdit = allowedRoles.includes(normalizedRole);

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    if (normalizedRole === 'admin') {
      loadCompanies();
    } else if (companyId) {
      setSelectedCompanyId(companyId);
    }
  }, [normalizedRole, companyId]);

  const loadCompanies = async () => {
    setLoadingCompanies(true);
    const snapshot = await getDocs(collection(db, 'rentalCompanies'));
    const list: CompanyOption[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
    }));
    setCompanies(list);
    if (list.length > 0) {
      setSelectedCompanyId(list[0].id);
    }
    setLoadingCompanies(false);
  };

  if (loading || loadingCompanies) return <div>Loading...</div>;
  if (!user) return <div>Please sign in.</div>;
  if (!canEdit) return <div>You don't have permission to access this page.</div>;

  return (
    <>
      <Header />
      <UserTopMenu /> {/* ✅ Bổ sung UserTopMenu */}

      <main className="max-w-5xl mx-auto py-6 px-4 min-h-[70vh] space-y-6">
        <h1 className="text-2xl font-semibold mb-4">🛠️ Form Builder</h1>

        {/* Admin có dropdown chọn công ty */}
        {normalizedRole === 'admin' && (
          <div className="mb-6">
            <label className="block mb-2 text-sm font-medium text-gray-700">Select Company</label>
            <select
              value={selectedCompanyId || ''}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form Builder */}
        {selectedCompanyId && (
          <FormBuilder companyId={selectedCompanyId} userId={user.uid} />
        )}
      </main>

      <Footer />
    </>
  );
}
