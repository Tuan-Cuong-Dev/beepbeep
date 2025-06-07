'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import { Staff } from '@/src/lib/staff/staffTypes';
import { updateStaff } from '@/src/lib/services/staff/staffService';
import { inviteUserAsStaff } from '@/src/lib/invitations/staff/inviteUserAsStaff';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { MailSearch, Loader2 } from 'lucide-react';

interface Props {
  editingStaff: Staff | null;
  companyId: string;
  onSave: () => void;
  onCancel: () => void;
}

const ROLE_OPTIONS = [
  { label: 'Company Admin', value: 'company_admin' },
  { label: 'Station Manager', value: 'station_manager' },
  { label: 'Technician', value: 'technician' },
  { label: 'Support', value: 'support' },
];

export default function StaffForm({ editingStaff, companyId, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>>({
    userId: '',
    companyId,
    stationId: '',
    role: 'support',
    name: '',
    email: '',
    phone: '',
  });

  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'info' | 'success' | 'error',
    title: '',
    description: '',
  });

  const [searchEmail, setSearchEmail] = useState('');
  const [stationOptions, setStationOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (editingStaff) {
      const { id, createdAt, updatedAt, ...rest } = editingStaff;
      setForm(rest);
    }
  }, [editingStaff]);

  useEffect(() => {
    const fetchStations = async () => {
      const snap = await getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', companyId)));
      const options = snap.docs.map((doc) => ({ label: doc.data().name, value: doc.id }));
      setStationOptions(options);
    };
    if (companyId) fetchStations();
  }, [companyId]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEmailSearch = async () => {
    if (!searchEmail) return;
    setSearching(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), where('email', '==', searchEmail.trim())));
      if (snapshot.empty) {
        setDialog({ open: true, type: 'error', title: 'User not found', description: 'No user with this email exists.' });
        return;
      }
      const userDoc = snapshot.docs[0];
      const user = userDoc.data();
      setForm((prev) => ({
        ...prev,
        userId: userDoc.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      }));
      setDialog({ open: true, type: 'success', title: 'User Loaded', description: '' });
    } catch (error: any) {
      setDialog({ open: true, type: 'error', title: 'Error', description: error.message || 'Failed to search user.' });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.userId || !form.name || !form.email) {
      setDialog({ open: true, type: 'error', title: 'Missing Required Fields', description: 'User ID, Name, and Email are required.' });
      return;
    }

    setLoading(true);
    try {
      if (editingStaff) {
        await updateStaff(editingStaff.id, form);
        setDialog({ open: true, type: 'success', title: 'Staff Updated', description: '' });
      } else {
        await inviteUserAsStaff(
          form.email,
          companyId,
          form.role,
          form.stationId ?? '',
          `${form.name} is invited to join your company as ${form.role}`,
          form.userId,
          form.name,
          form.phone || ''
        );
        setDialog({ open: true, type: 'success', title: 'Invitation Sent', description: '' });
      }
      onSave();
    } catch (error: any) {
      setDialog({ open: true, type: 'error', title: 'Error', description: error.message || 'Failed to save staff.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-full space-y-6 border">
      <h2 className="text-xl font-bold text-gray-800">
        {editingStaff ? 'Edit Staff' : 'Invite New Staff'}
      </h2>

      {/* Email search */}
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
          <label className="text-sm font-medium text-gray-600 mb-1 block">Full Name</label>
          <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Full name" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 block">Email</label>
          <Input value={form.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="Email" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 block">Phone</label>
          <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 mb-1 block">Station</label>
          <SimpleSelect
            options={stationOptions}
            value={form.stationId}
            onChange={(val) => handleChange('stationId', val)}
            placeholder="Select station (optional)"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-600 mb-1 block">Role</label>
          <SimpleSelect
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(val) => handleChange('role', val)}
            placeholder="Select role"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          {editingStaff ? 'Update Staff' : 'Send Invitation'}
        </Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>

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
