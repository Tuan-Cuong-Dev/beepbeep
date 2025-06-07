'use client';

// ✅ Form dành riêng cho cộng tác viên (Agent)

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { Timestamp } from 'firebase/firestore';

export type AgentFormData = {
  name: string;
  email: string;
  phone: string;
  displayAddress: string;
  mapAddress: string;
  location: string;
};

interface Props {
  editingAgent: {
    id: string;
    name: string;
    email: string;
    phone: string;
    displayAddress: string;
    mapAddress: string;
    location: string;
    ownerId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
  } | null;
  onSave: (data: AgentFormData) => Promise<void>;
  onCancel: () => void;
}

export default function AgentForm({ editingAgent, onSave, onCancel }: Props) {
  const [form, setForm] = useState<AgentFormData>({
    name: '',
    email: '',
    phone: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
  });

  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        location: `${coords.lat}° N, ${coords.lng}° E`,
      }));
    }
  }, [coords]);

  useEffect(() => {
    if (editingAgent) {
      const { id, ownerId, createdAt, updatedAt, ...rest } = editingAgent;
      setForm(rest);
    }
  }, [editingAgent]);

  const handleChange = (key: keyof AgentFormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress.trim()) {
      geocode(form.mapAddress);
    }
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4">
        <div>
          <Label>Agent Name</Label>
          <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
        </div>
        <div>
          <Label>Contact Number</Label>
          <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
        </div>
        <div>
          <Label>Display Address</Label>
          <Input
            value={form.displayAddress}
            onChange={(e) => handleChange('displayAddress', e.target.value)}
          />
        </div>
        <div>
          <Label>Map Address (Google link)</Label>
          <Input
            value={form.mapAddress}
            onChange={(e) => handleChange('mapAddress', e.target.value)}
            onBlur={handleMapAddressBlur}
          />
        </div>
        <div>
          <Label>Auto Location</Label>
          <Input value={form.location} readOnly />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">📍 Detecting location...</p>}
      {error && <p className="text-sm text-red-500">⚠️ {error}</p>}

      <div className="flex justify-end gap-4 pt-4">
        <Button onClick={handleSubmit} className="bg-[#00d289] text-white hover:bg-[#00b67a]">
          {editingAgent ? 'Update Agent' : 'Add Agent'}
        </Button>
        {editingAgent && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
