'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useUser } from '@/src/context/AuthContext';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface CommissionRecord {
  bookingId: string;
  amount: number;
  paid: boolean;
}

export default function AgentEarningsPage() {
  const { user } = useUser();
  const [commissions, setCommissions] = useState<CommissionRecord[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetch = async () => {
      const q = query(collection(db, 'bookings'), where('agentId', '==', user.uid));
      const snap = await getDocs(q);

      const records: CommissionRecord[] = [];
      snap.forEach(doc => {
        const data = doc.data();
        records.push({
          bookingId: doc.id,
          amount: data.agentCommission || 0,
          paid: data.agentCommissionPaid || false,
        });
      });

      setCommissions(records);
    };

    fetch();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="px-6 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center">💰 My Commission Earnings</h1>

        <div className="bg-white rounded-xl p-6 shadow border space-y-4">
          <h2 className="text-xl font-semibold mb-4">Commission Records</h2>

          {commissions.length === 0 ? (
            <p className="text-gray-500">No records found.</p>
          ) : (
            <ul className="space-y-2 text-gray-700 text-sm">
              {commissions.map((c, i) => (
                <li key={i} className="flex justify-between">
                  <span>Booking <b>{c.bookingId}</b></span>
                  <span>${c.amount.toFixed(2)} {c.paid ? "(Paid)" : "(Pending)"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
