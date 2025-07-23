// app/admin/messages/send/page.tsx
'use client';

import AdminSendMessageForm from '@/src/components/messages/AdminSendMessageForm';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

export default function AdminMessagePage() {
  const [userOptions, setUserOptions] = useState<{ id: string; email: string }[]>([]);

  const loadUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    setUserOptions(snap.docs.map(doc => ({ id: doc.id, email: doc.data().email })));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">📨 Admin - Send Message</h1>
        <AdminSendMessageForm userOptions={userOptions} />
      </main>
      <Footer />
    </div>
  );
}
