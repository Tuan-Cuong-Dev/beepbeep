'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  Timestamp,
  Query,
  DocumentData,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { InsurancePackage } from '@/src/lib/insurancePackages/insurancePackageTypes';
import { User } from '@/src/lib/users/userTypes';
import { format } from 'date-fns';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

interface ExtendedInsurancePackage extends InsurancePackage {
  userInfo?: Partial<User>;
}

export default function InsuranceApprovalPage() {
  const [packages, setPackages] = useState<ExtendedInsurancePackage[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let q: Query<DocumentData> = collection(db, 'insurancePackages');

      if (filterStatus !== 'all') {
        q = query(q, where('approvalStatus', '==', filterStatus));
      }

      const snapshot = await getDocs(q);
      const rawPackages: InsurancePackage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InsurancePackage[];

      const userIds = Array.from(new Set(rawPackages.map((p) => p.userId)));
      const userMap: Record<string, Partial<User>> = {};

      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (userDoc.exists()) {
              userMap[uid] = userDoc.data() as User;
            }
          } catch (e) {
            console.error(`Failed to fetch user ${uid}`, e);
          }
        })
      );

      const mergedPackages: ExtendedInsurancePackage[] = rawPackages.map((p) => ({
        ...p,
        userInfo: userMap[p.userId],
      }));

      setPackages(mergedPackages);
    } catch (err) {
      console.error('Failed to fetch insurance packages', err);
      setNotification({ type: 'error', message: 'Failed to load insurance packages' });
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'insurancePackages', id), {
        approvalStatus: 'approved',
        updatedAt: Timestamp.now(),
      });
      fetchData();
      setNotification({ type: 'success', message: 'Approved successfully' });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Approval failed' });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateDoc(doc(db, 'insurancePackages', id), {
        approvalStatus: 'rejected',
        updatedAt: Timestamp.now(),
      });
      fetchData();
      setNotification({ type: 'success', message: 'Rejected successfully' });
    } catch (err) {
      console.error(err);
      setNotification({ type: 'error', message: 'Rejection failed' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow p-6 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-semibold mb-4 border-[#00d289] border-b-2 pb-2">
          📄 Insurance Package Approval
        </h1>
        <div className="mb-4 flex gap-2 flex-wrap">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => setFilterStatus(status as any)}
            >
              {status.toUpperCase()}
            </Button>
          ))}
        </div>

        {loading ? (
  <p>Loading...</p>
          ) : packages.length === 0 ? (
            <p>No insurance packages found.</p>
          ) : (
            <>
              {/* Bảng cho desktop */}
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full table-auto border">
                  <thead>
                    <tr className="bg-gray-100 text-sm">
                      <th className="p-2 border">#</th>
                      <th className="p-2 border">Package Code</th>
                      <th className="p-2 border">Customer Info</th>
                      <th className="p-2 border">Frame No.</th>
                      <th className="p-2 border">Engine No.</th>
                      <th className="p-2 border">Plate No.</th>
                      <th className="p-2 border">Status</th>
                      <th className="p-2 border">Activated</th>
                      <th className="p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.map((pkg, idx) => (
                      <tr key={pkg.id} className="text-center text-sm">
                        <td className="p-2 border">{idx + 1}</td>
                        <td className="p-2 border font-mono">{pkg.packageCode}</td>
                        <td className="p-2 border text-left">
                          <div className="font-semibold">{pkg.userInfo?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{pkg.userInfo?.email}</div>
                          <div className="text-xs text-gray-500">{pkg.userInfo?.phone}</div>
                        </td>
                        <td className="p-2 border">{pkg.frameNumber || '-'}</td>
                        <td className="p-2 border">{pkg.engineNumber || '-'}</td>
                        <td className="p-2 border">{pkg.plateNumber || '-'}</td>
                        <td className="p-2 border">
                          <Badge
                            variant={
                              pkg.approvalStatus === 'approved'
                                ? 'success'
                                : pkg.approvalStatus === 'rejected'
                                ? 'destructive'
                                : 'warning'
                            }
                          >
                            {pkg.approvalStatus || 'pending'}
                          </Badge>
                        </td>
                        <td className="p-2 border">
                          {pkg.activatedAt ? format(pkg.activatedAt.toDate(), 'dd/MM/yyyy') : '-'}
                        </td>
                        <td className="p-2 border space-x-2">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApprove(pkg.id)}
                            disabled={pkg.approvalStatus === 'approved'}
                          >
                            ✅ Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(pkg.id)}
                            disabled={pkg.approvalStatus === 'rejected'}
                          >
                            ❌ Reject
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Card cho mobile */}
              <div className="block md:hidden space-y-4">
                {packages.map((pkg, idx) => (
                  <div
                    key={pkg.id}
                    className="bg-white rounded-xl shadow p-4 border border-gray-200"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-sm text-gray-700">
                        {pkg.packageCode}
                      </div>
                      <Badge
                        variant={
                          pkg.approvalStatus === 'approved'
                            ? 'success'
                            : pkg.approvalStatus === 'rejected'
                            ? 'destructive'
                            : 'warning'
                        }
                      >
                        {pkg.approvalStatus || 'pending'}
                      </Badge>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <div><strong>Name:</strong> {pkg.userInfo?.name || 'Unknown'}</div>
                      <div><strong>Phone:</strong> {pkg.userInfo?.phone}</div>
                      <div><strong>Email:</strong> {pkg.userInfo?.email}</div>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <div><strong>Frame:</strong> {pkg.frameNumber || '-'}</div>
                      <div><strong>Engine:</strong> {pkg.engineNumber || '-'}</div>
                      <div><strong>Plate:</strong> {pkg.plateNumber || '-'}</div>
                      <div><strong>Activated:</strong> {pkg.activatedAt ? format(pkg.activatedAt.toDate(), 'dd/MM/yyyy') : '-'}</div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="success"
                        className="flex-1"
                        onClick={() => handleApprove(pkg.id)}
                        disabled={pkg.approvalStatus === 'approved'}
                      >
                        ✅ Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(pkg.id)}
                        disabled={pkg.approvalStatus === 'rejected'}
                      >
                        ❌ Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}


        <NotificationDialog
          open={!!notification}
          type={notification?.type || 'info'}
          title={notification?.message || 'Notification'}
          onClose={() => setNotification(null)}
        />
      </main>

      <Footer />
    </div>
  );
}
