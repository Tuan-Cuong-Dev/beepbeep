'use client';

import { useState, useEffect } from 'react';
import { Timestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { exportAccessory } from '@/src/lib/accessories/accessoryExportService';
import { AccessoryExport } from '@/src/lib/accessories/accessoryExportTypes';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { useUser } from '@/src/context/AuthContext';

interface Props {
  defaultAccessory?: {
    id: string;
    name: string;
  };
  onComplete?: (updatedAccessory?: any) => void;
}

export default function AccessoryExportForm({ defaultAccessory, onComplete }: Props) {
  const { user, companyId } = useUser();

  const [formData, setFormData] = useState<Omit<AccessoryExport, 'id'>>({
    accessoryName: defaultAccessory?.name || '',
    accessoryId: defaultAccessory?.id || '',
    quantity: 1,
    exportedBy: user?.uid || '',
    exportedAt: Timestamp.now(),
    note: '',
    target: '',
    companyId: companyId || '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (defaultAccessory) {
      setFormData((prev) => ({
        ...prev,
        accessoryName: defaultAccessory.name,
        accessoryId: defaultAccessory.id,
      }));
    }
  }, [defaultAccessory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.accessoryName || !formData.quantity || !formData.exportedBy || !formData.companyId) {
      setMessage('Please fill in required fields.');
      return;
    }

    try {
      setLoading(true);

      await exportAccessory({ ...formData, exportedAt: Timestamp.now() });

      // 🟢 Fetch lại phụ kiện đã cập nhật để trả về
      let updatedAccessory = null;
      if (formData.accessoryId) {
        const ref = doc(db, 'accessories', formData.accessoryId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          updatedAccessory = { ...snap.data(), id: snap.id };
        }
      }

      setMessage('✅ Export successful');

      setFormData({
        accessoryName: defaultAccessory?.name || '',
        accessoryId: defaultAccessory?.id || '',
        quantity: 1,
        exportedBy: user?.uid || '',
        exportedAt: Timestamp.now(),
        note: '',
        target: '',
        companyId: companyId || '',
      });

      if (onComplete) onComplete(updatedAccessory);
    } catch (error) {
      console.error(error);
      setMessage('❌ Failed to export accessory.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">➕ Export Accessory</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Accessory Name *</Label>
          <Input
            name="accessoryName"
            value={formData.accessoryName}
            onChange={handleChange}
            placeholder="e.g. Helmet, Brake Pad"
            disabled={!!defaultAccessory}
          />
        </div>

        <div>
          <Label>Quantity *</Label>
          <Input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value || '0') })}
            min={1}
          />
        </div>

        <div>
          <Label>Target (e.g. Technician, Vehicle)</Label>
          <Input
            name="target"
            value={formData.target}
            onChange={handleChange}
            placeholder="e.g. VN-001, or Staff A"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Note</Label>
          <Textarea
            name="note"
            value={formData.note}
            onChange={handleChange}
            placeholder="Reason, remarks..."
          />
        </div>
      </div>

      <div className="pt-4 flex gap-4 items-center">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Exporting...' : 'Export'}
        </Button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
