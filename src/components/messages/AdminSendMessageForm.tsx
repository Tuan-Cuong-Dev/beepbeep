// components/messages/AdminSendMessageForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { Input } from '@/src/components/ui/input';
import { db } from '@/src/firebaseConfig';
import { addDoc, collection, Timestamp, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface Props {
  userOptions: { id: string; email: string; role?: string }[];
}

const MESSAGE_TYPES = [
  { label: 'Notification', value: 'notification' },
  { label: 'System Alert', value: 'system_alert' },
  { label: 'Booking Update', value: 'booking_update' },
];

const ROLE_FILTERS = ['all', 'customer', 'staff', 'agent', 'admin'];

export default function AdminSendMessageForm({ userOptions }: Props) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [type, setType] = useState('notification');
  const [content, setContent] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const ids = filteredUsers.map((u) => u.id);
    const allSelected = ids.every((id) => selectedUsers.includes(id));
    setSelectedUsers(allSelected ? selectedUsers.filter(id => !ids.includes(id)) : [...new Set([...selectedUsers, ...ids])]);
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0 || !content) {
      toast.error('Recipient(s) and content are required');
      return;
    }
    setLoading(true);
    try {
      const scheduledTime = scheduleAt ? Timestamp.fromDate(new Date(scheduleAt)) : serverTimestamp();
      await Promise.all(
        selectedUsers.map((userId) =>
          addDoc(collection(db, 'messages'), {
            userId,
            type,
            content,
            status: 'scheduled',
            createdAt: serverTimestamp(),
            scheduledAt: scheduledTime,
          })
        )
      );
      toast.success('Message scheduled successfully');
      setSelectedUsers([]);
      setContent('');
      setScheduleAt('');
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = roleFilter === 'all'
    ? userOptions
    : userOptions.filter(user => user.role === roleFilter);

  return (
    <div className="bg-white shadow p-6 rounded-xl space-y-4">
      <h2 className="text-xl font-semibold">📨 Send Message</h2>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Filter by Role:</label>
        <select
          className="border border-gray-300 rounded p-2 w-full"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          {ROLE_FILTERS.map(role => (
            <option key={role} value={role}>{role === 'all' ? 'All roles' : role}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex justify-between items-center">
          <span>Select Recipients ({selectedUsers.length})</span>
          <button type="button" onClick={toggleSelectAll} className="text-sm text-blue-600 hover:underline">
            {filteredUsers.every(u => selectedUsers.includes(u.id)) ? 'Deselect All' : 'Select All'}
          </button>
        </label>
        <div className="max-h-48 overflow-y-auto border rounded p-2 space-y-1">
          {filteredUsers.map((user) => (
            <label key={user.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedUsers.includes(user.id)}
                onChange={() => toggleUser(user.id)}
              />
              {user.email} {user.role ? `(${user.role})` : ''}
            </label>
          ))}
        </div>
      </div>

      <select
        className="border border-gray-300 rounded p-2 w-full"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        {MESSAGE_TYPES.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <Textarea
        placeholder="Message content..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Send (optional)</label>
        <Input
          type="datetime-local"
          value={scheduleAt}
          onChange={(e) => setScheduleAt(e.target.value)}
        />
      </div>

      <Button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : scheduleAt ? `Schedule to ${selectedUsers.length} user(s)` : `Send to ${selectedUsers.length} user(s)`}
      </Button>
    </div>
  );
}
