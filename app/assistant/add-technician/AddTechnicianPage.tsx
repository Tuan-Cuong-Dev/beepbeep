'use client';

import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function AddTechnicianPage() {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddTechnician = async () => {
    if (!name || !email || !phone || !user?.uid) {
      setMessage('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'staffs'), {
        name,
        email,
        phone,
        role: 'technician',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: user.uid,
        accepted: true,
      });

      setMessage('Technician added successfully.');
      setName('');
      setEmail('');
      setPhone('');
    } catch (error) {
      setMessage('Failed to add technician.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-4 py-10">
        <div className="max-w-md mx-auto bg-white p-6 rounded-xl shadow space-y-4 border border-gray-200">
          <h1 className="text-2xl font-bold text-center text-gray-800">Add New Technician</h1>

          <Input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Button onClick={handleAddTechnician} disabled={loading} className="w-full">
            {loading ? 'Adding...' : 'Add Technician'}
          </Button>

          {message && <p className="text-sm text-center text-gray-600">{message}</p>}
        </div>
      </main>

      <Footer />
    </div>
  );
}
