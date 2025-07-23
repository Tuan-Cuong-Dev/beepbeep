'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export default function BookingDetailPage() {
  const { id } = useParams() as { id: string };
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetch = async () => {
      const snap = await getDoc(doc(db, 'bookings', id));
      if (snap.exists()) {
        setBooking(snap.data());
      }
    };

    fetch();
  }, [id]);

  if (!booking) return <div className="p-10 text-center">Loading booking...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="px-6 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 text-center">📦 Booking {id}</h1>

        <div className="bg-white rounded-xl p-6 shadow border space-y-4 text-gray-700">
          <p><b>Customer:</b> {booking.fullName || '-'}</p>
          <p><b>Phone:</b> {booking.phone || '-'}</p>
          <p><b>Total Amount:</b> ${booking.totalAmount || 0}</p>
          <p><b>Agent Commission:</b> ${booking.agentCommission || 0} ({booking.agentCommissionPaid ? 'Paid' : 'Pending'})</p>
          <p><b>Booking Status:</b> {booking.bookingStatus || '-'}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
