'use client';

import { useState, useEffect } from 'react';
import { Timestamp, collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Battery } from '@/src/lib/batteries/batteryTypes';
import { useUser } from '@/src/context/AuthContext';

interface Props {
  newBattery: Battery;
  setNewBattery: (battery: Battery) => void;
  isUpdateMode: boolean;
  setIsUpdateMode: (v: boolean) => void;
  setBatteries: (batteries: Battery[]) => void;
  onNotify?: (message: string, type?: 'success' | 'error') => void;
}

export default function BatteryForm({
  newBattery,
  setNewBattery,
  isUpdateMode,
  setIsUpdateMode,
  setBatteries,
  onNotify,
}: Props) {
  const { user } = useUser();
  const [companyId, setCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!user?.uid) return;
      const q = query(collection(db, 'staffs'), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const staffDoc = snapshot.docs[0].data();
        setCompanyId(staffDoc.companyId);
        if (!newBattery.companyId) {
          setNewBattery({ ...newBattery, companyId: staffDoc.companyId });
        }
      }
    };
    fetchCompanyId();
  }, [user]);

  const resetForm = () => {
    setNewBattery({
      id: '',
      companyId: companyId,
      batteryCode: '',
      physicalCode: '',
      importDate: Timestamp.fromDate(new Date()),
      exportDate: undefined,
      status: 'in_stock',
      notes: '',
    });
    setIsUpdateMode(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!newBattery.batteryCode.trim()) {
      setError('Battery Code is required.');
      return;
    }

    if (!companyId && !newBattery.companyId) {
      onNotify?.('❌ Cannot save battery without companyId.', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const batteryData = {
        companyId: newBattery.companyId || companyId,
        batteryCode: newBattery.batteryCode,
        physicalCode: newBattery.physicalCode || '',
        importDate: newBattery.importDate,
        exportDate: newBattery.exportDate || null,
        status: newBattery.status,
        notes: newBattery.notes || '',
      };

      if (newBattery.id) {
        const batteryRef = doc(db, 'batteries', newBattery.id);
        await setDoc(batteryRef, batteryData, { merge: true });
      } else {
        await setDoc(doc(collection(db, 'batteries')), batteryData);
      }

      const q = query(collection(db, 'batteries'), where('companyId', '==', batteryData.companyId));
      const snapshot = await getDocs(q);
      const allBatteries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Battery[];
      setBatteries(allBatteries);

      onNotify?.('✅ Battery saved successfully', 'success');
      resetForm();
    } catch (err) {
      console.error('❌ Error saving battery:', err);
      onNotify?.('Failed to save battery. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
  };

  return (
    <div className="bg-white shadow rounded-xl p-4 mb-6 space-y-4 mt-4">
      <h2 className="text-xl font-semibold text-gray-800">
        {isUpdateMode ? 'Update Battery Information' : 'Add New Battery'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="batteryCode">Battery Code</Label>
          <Input
            id="batteryCode"
            value={newBattery.batteryCode}
            onChange={(e) => setNewBattery({ ...newBattery, batteryCode: e.target.value })}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div>
          <Label htmlFor="importDate">Import Date</Label>
          <Input
            id="importDate"
            type="datetime-local"
            value={newBattery.importDate.toDate().toISOString().slice(0, 16)}
            onChange={(e) =>
              setNewBattery({
                ...newBattery,
                importDate: Timestamp.fromDate(new Date(e.target.value)),
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="exportDate">Export Date</Label>
          <Input
            id="exportDate"
            type="datetime-local"
            value={newBattery.exportDate?.toDate().toISOString().slice(0, 16) || ''}
            onChange={(e) =>
              setNewBattery({
                ...newBattery,
                exportDate: e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : undefined,
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={newBattery.status}
            onChange={(e) => setNewBattery({ ...newBattery, status: e.target.value as Battery['status'] })}
            className="w-full border border-gray-300 rounded px-3 py-2"
          >
            <option value="in_stock">In Stock</option>
            <option value="in_use">In Use</option>
            <option value="returned">Returned</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={newBattery.notes || ''}
          onChange={(e) => setNewBattery({ ...newBattery, notes: e.target.value })}
        />
      </div>

      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={loading}>
          {isUpdateMode ? 'Update Battery' : 'Add Battery'}
        </Button>
        {isUpdateMode && (
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}