'use client';

import { useEffect, useState } from 'react';
import { getAccessoryExports } from '@/src/lib/accessories/accessoryExportService';
import { AccessoryExport } from '@/src/lib/accessories/accessoryExportTypes';
import AccessoryExportTable from '@/src/components/accessories/AccessoryExportTable';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { useUser } from '@/src/context/AuthContext';

export default function AccessoryExportPage() {
  const { companyId, role } = useUser();
  const [exports, setExports] = useState<AccessoryExport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchData = async () => {
        try {
          const data =
            role === 'Admin'
              ? await getAccessoryExports() // admin: lấy tất cả
              : companyId
              ? await getAccessoryExports(companyId) // company: lấy theo công ty
              : [];

          setExports(data);
        } catch (error) {
          console.error('Failed to fetch exports:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [companyId, role]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-4 py-6 bg-gray-50">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">
          📦 Accessory Export History
        </h1>
        {loading ? (
          <p className="text-gray-500">Loading export records...</p>
        ) : (
          <AccessoryExportTable exports={exports} />
        )}
      </main>

      <Footer />
    </div>
  );
}
