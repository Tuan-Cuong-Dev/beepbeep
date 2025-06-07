'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useUser } from '@/src/context/AuthContext';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export default function AgentRequestPaymentPage() {
  const { user } = useUser();
  const [pendingCommissions, setPendingCommissions] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const q = query(collection(db, 'bookings'), where('agentId', '==', user.uid), where('agentCommissionPaid', '==', false));
      const snap = await getDocs(q);

      const data = snap.docs.map(doc => ({
        id: doc.id,
        amount: doc.data().agentCommission || 0,
      }));

      setPendingCommissions(data);
    };

    fetch();
  }, [user]);

  const handleRequest = async () => {
    if (!user) return;
    
    setIsSubmitting(true);

    // Cập nhật tất cả booking → agentCommissionPaid = true
    for (const commission of pendingCommissions) {
      await updateDoc(doc(db, 'bookings', commission.id), { agentCommissionPaid: true });
    }

    // Tạo paymentRequest mới → để Admin nhận
    const totalAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);
    await addDoc(collection(db, 'paymentRequests'), {
      agentId: user.uid,
      agentName: user.displayName || '',
      amount: totalAmount,
      createdAt: serverTimestamp(),
      status: 'pending'
    });

    alert('Request submitted successfully!');
    setPendingCommissions([]);
    setIsSubmitting(false);
  };

  const totalAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="px-6 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center">📤 Request Payment</h1>

        <div className="bg-white rounded-xl p-6 shadow border space-y-4">
          <p>You have <b>{pendingCommissions.length}</b> unpaid commissions totaling <b>${totalAmount.toFixed(2)}</b>.</p>

          {pendingCommissions.length > 0 && (
            <button
              onClick={handleRequest}
              disabled={isSubmitting}
              className="bg-[#00d289] hover:bg-[#00b67a] text-white px-4 py-3 rounded-xl transition"
            >
              {isSubmitting ? 'Submitting...' : 'Request Payment Now'}
            </button>
          )}

          {pendingCommissions.length === 0 && <p className="text-gray-500">No unpaid commissions available.</p>}
        </div>
      </main>
      <Footer />
    </div>
  );
}
