'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useUser } from '@/src/context/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  doc as fsDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as qLimit,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Button } from '@/src/components/ui/button';

import { CheckCircle2, XCircle, Clock3, RefreshCw } from 'lucide-react';

/* ================= Types ================= */
export type PaymentRequest = {
  id: string;
  agentId: string;
  agentName?: string;
  amount: number;
  createdAt?: any; // Firestore Timestamp | undefined
  status: 'pending' | 'approved' | 'rejected';
};

/* ================= Component ================= */
export default function PaymentRequestsPage() {
  const { user } = useUser();
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = useMemo(() => {
    // tuỳ hệ thống phân quyền; tạm check role admin/company_owner
    const role = (user as any)?.role;
    return role === 'admin' || role === 'company_owner' || role === 'technician_assistant';
  }, [user]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      // Nếu không phải admin -> chỉ xem các yêu cầu của chính mình
      const base = collection(db, 'paymentRequests');
      const q = canManage
        ? query(base, orderBy('createdAt', 'desc'), qLimit(200))
        : query(base, where('agentId', '==', user?.uid || ''), orderBy('createdAt', 'desc'));

      const snap = await getDocs(q);
      const list: PaymentRequest[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRequests(list);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.uid) return;
    void fetchAll();
  }, [user?.uid, canManage]);

  const handleUpdateStatus = async (
    id: string,
    newStatus: 'approved' | 'rejected'
  ) => {
    // optimistic update
    const prev = requests;
    setRequests((cur) => cur.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    try {
      await updateDoc(fsDoc(db, 'paymentRequests', id), { status: newStatus });
    } catch (e) {
      // rollback if error
      setRequests(prev);
      alert('Failed to update status. Please try again.');
    }
  };

  const StatusBadge = ({ s }: { s: PaymentRequest['status'] }) => {
    const map = {
      approved: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      pending: 'bg-amber-100 text-amber-700',
    } as const;
    const icon =
      s === 'approved' ? (
        <CheckCircle2 className="h-4 w-4" />
      ) : s === 'rejected' ? (
        <XCircle className="h-4 w-4" />
      ) : (
        <Clock3 className="h-4 w-4" />
      );
    const label = s === 'approved' ? 'Approved' : s === 'rejected' ? 'Rejected' : 'Pending';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${map[s]}`}>
        {icon}
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-emerald-50/60 to-white">
      <Header />

      <main className="flex-1 px-4 md:px-6 py-8 md:py-10 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">📥 Payment Requests</h1>
          <Button variant="outline" className="gap-2" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white border rounded-2xl shadow p-6 text-gray-500">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="bg-white border rounded-2xl shadow p-6 text-gray-500">No requests yet.</div>
        ) : (
          <ul className="space-y-4">
            {requests.map((req) => (
              <li
                key={req.id}
                className="bg-white border p-5 rounded-2xl shadow-sm flex flex-col md:flex-row md:justify-between md:items-center gap-4"
              >
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Agent:</span>{' '}
                    <b>{req.agentName || req.agentId}</b>
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-500">Amount:</span>{' '}
                    <b className="text-emerald-600">{formatCurrency(req.amount || 0)}</b>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="text-gray-500">Requested At:</span>{' '}
                    {req.createdAt?.toDate ? req.createdAt.toDate().toLocaleString() : '-'}
                  </p>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                  <StatusBadge s={req.status} />

                  {req.status === 'pending' && canManage && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleUpdateStatus(req.id, 'approved')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(req.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white"
                        variant="destructive"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Footer />
    </div>
  );
}