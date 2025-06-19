'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { MailSearch, Loader2 } from 'lucide-react';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

export default function AddTechnicianPage() {
  const { user, companyId, stationId } = useUser();

  const [searchEmail, setSearchEmail] = useState('');
  const [foundUserId, setFoundUserId] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'info' | 'success' | 'error',
    title: '',
    description: '',
  });

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmailSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail.trim()));
      const snap = await getDocs(q);
      if (snap.empty) {
        setDialog({
          open: true,
          type: 'error',
          title: 'User not found',
          description: 'No user with this email exists.',
        });
        setFoundUserId('');
      } else {
        const doc = snap.docs[0];
        const userData = doc.data();
        setFoundUserId(doc.id);
        setForm({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
        });
        setDialog({
          open: true,
          type: 'success',
          title: 'User found',
          description: 'User loaded successfully.',
        });
      }
    } catch (error: any) {
      setDialog({
        open: true,
        type: 'error',
        title: 'Error',
        description: error.message || 'Something went wrong',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSend = async () => {
    if (!form.name || !form.email || !form.phone || !user?.uid || !companyId) {
      setDialog({
        open: true,
        type: 'error',
        title: 'Missing fields',
        description: 'Please fill all required information.',
      });
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'staffs'), {
        userId: foundUserId || '',
        companyId,
        stationId: stationId || '',
        role: 'technician',
        name: form.name,
        email: form.email,
        phone: form.phone,
        accepted: !!foundUserId, // true nếu tìm được user
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setDialog({
        open: true,
        type: 'success',
        title: 'Success',
        description: foundUserId
          ? 'Technician added and linked to existing user.'
          : 'Invitation created. Will be activated when user registers.',
      });

      // reset form
      setForm({ name: '', email: '', phone: '' });
      setSearchEmail('');
      setFoundUserId('');
    } catch (error: any) {
      setDialog({
        open: true,
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to add technician.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 py-10">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow border space-y-6">
          <h1 className="text-2xl font-bold text-gray-800">Invite New Staff</h1>

          {/* Email Search */}
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Enter email to find user"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
            />
            <Button onClick={handleEmailSearch} disabled={searching}>
              {searching ? <Loader2 className="animate-spin h-4 w-4" /> : <MailSearch className="h-4 w-4 mr-1" />}
              {searching ? 'Searching...' : 'Find'}
            </Button>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Full Name</label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Email</label>
              <Input
                placeholder="Email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <Input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Station</label>
              <Input value={stationId || ''} disabled readOnly />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-gray-600">Role</label>
              <Input value="Technician" disabled readOnly />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={handleSend} disabled={loading}>
              {loading && <Loader2 className="animate-spin h-4 w-4 mr-2" />}
              {loading ? 'Sending...' : 'Send Invitation'}
            </Button>
            <Button variant="ghost" onClick={() => {
              setForm({ name: '', email: '', phone: '' });
              setSearchEmail('');
              setFoundUserId('');
            }}>Cancel</Button>
          </div>
        </div>
      </main>
      <Footer />

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
