// Rental Companies và Private Provider tạo Các chương trình khuyến mãi
// 08/09/2025

// Rental Companies và Private Provider tạo Các chương trình khuyến mãi
// 05/09/2025

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';

import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';
import { Badge } from '@/src/components/ui/badge';
import type { Program } from '@/src/lib/programs/rental-programs/programsType';
import { getProgramsByRole } from '@/src/lib/programs/rental-programs/programsService'; // <- file bạn đã viết ở trên

export default function ProgramList() {
  const { user, role } = useUser() as any; // role: 'company_owner' | 'private_provider' | 'admin' ...
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper
  const toDateStr = (ts?: Timestamp | null) =>
    ts?.toDate ? format(ts.toDate(), 'yyyy-MM-dd') : '-';

  // Lấy companyId từ rentalCompanies hoặc privateProviders (tuỳ vai trò)
  const fetchCompanyId = async (uid: string) => {
    const q1 = query(collection(db, 'rentalCompanies'), where('ownerId', '==', uid));
    const s1 = await getDocs(q1);
    if (!s1.empty) return s1.docs[0].id;

    const q2 = query(collection(db, 'privateProviders'), where('ownerId', '==', uid));
    const s2 = await getDocs(q2);
    if (!s2.empty) return s2.docs[0].id;

    return null;
  };

  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        // company_owner / private_provider chỉ thấy chương trình của chính mình (rental_program + companyId)
        // agent thấy agent_program; admin thấy tất cả.
        const companyId =
          role === 'company_owner' || role === 'private_provider'
            ? await fetchCompanyId(user.uid)
            : null;

        const data = await getProgramsByRole(role ?? 'company_owner', companyId);
        setPrograms(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.uid, role]);

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-10 space-y-6 max-w-6xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">📋 Programs</h1>
          {(role === 'company_owner' || role === 'private_provider' || role === 'Admin' || role === 'admin') && (
            <Link href="/dashboard/programs/new">
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                New Program
              </Button>
            </Link>
          )}
        </div>

        {programs.length === 0 ? (
          <p className="text-gray-600">No programs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p) => {
              const modelCount = p.modelDiscounts?.length ?? 0;
              const stationCount = p.stationTargets?.length ?? 0;

              return (
                <div
                  key={p.id}
                  className="bg-white p-4 rounded-xl shadow border border-gray-200 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-semibold text-gray-800 line-clamp-2">
                      {p.title}
                    </h2>
                    <Badge variant="secondary" className="whitespace-nowrap capitalize">
                      {p.type.replace(/_/g, ' ')}
                    </Badge>
                  </div>

                  {p.description && (
                    <p className="text-gray-600 mt-2 line-clamp-3">{p.description}</p>
                  )}

                  <div className="mt-3 text-sm text-gray-500">
                    <div>
                      <span className="font-medium text-gray-700">Duration:</span>{' '}
                      {toDateStr(p.startDate)} – {toDateStr(p.endDate)}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant={p.isActive ? 'default' : 'secondary'}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="default">
                        {modelCount} model{modelCount !== 1 ? 's' : ''}
                      </Badge>
                      <Badge variant="default">
                        {stationCount} station{stationCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="text-xs text-gray-500 capitalize">
                      by {p.createdByRole}
                    </div>
                    <Link href={`/dashboard/programs/${p.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
