'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

type PaymentRequest = {
  id: string;
  agentId: string;
  agentName: string;
  amount: number;
  createdAt: any;
  status: 'pending' | 'approved' | 'rejected';
};

export default function PaymentRequestsPage() {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, 'paymentRequests'));
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentRequest[];

      setRequests(list);
    };

    fetch();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    await updateDoc(doc(db, 'paymentRequests', id), { status: newStatus });

    setRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, status: newStatus } : req
      )
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className="p-10 space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">📥 Payment Requests</h1>

      {requests.length === 0 ? (
        <p className="text-gray-500">No requests yet.</p>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li
              key={req.id}
              className="bg-white border p-6 rounded-xl shadow flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0"
            >
              <div>
                <p><b>Agent:</b> {req.agentName}</p>
                <p><b>Amount:</b> ${req.amount.toFixed(2)}</p>
                <p><b>Requested At:</b> {req.createdAt?.toDate().toLocaleString() || '-'}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className={`font-medium ${getStatusColor(req.status)}`}>
                  {req.status.toUpperCase()}
                </span>

                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'approved')}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'rejected')}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
