'use client';

import { useState } from 'react';
import { Timestamp, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Accessory, AccessoryType } from '@/src/lib/accessories/accessoryTypes';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { Dispatch, SetStateAction } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { safeFormatDate } from '@/src/utils/safeFormatDate';

interface Props {
  newAccessory: Accessory;
  setNewAccessory: Dispatch<SetStateAction<Accessory>>;
  isUpdateMode: boolean;
  setIsUpdateMode: (v: boolean) => void;
  setAccessories: Dispatch<SetStateAction<Accessory[]>>;
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

/**
 * Parse chuỗi tiền (ví dụ '1.250.000 ₫') thành số nguyên 1250000
 */
function parseCurrencyString(value: string): number {
  if (!value) return 0;
  const numericString = value.replace(/[^\d]/g, '');
  const number = parseInt(numericString, 10);
  return isNaN(number) ? 0 : number;
}

export default function AccessoryForm({
  newAccessory,
  setNewAccessory,
  isUpdateMode,
  setIsUpdateMode,
  setAccessories,
  onNotify,
}: Props) {
  const handleSave = async () => {
    if (!newAccessory.name || !newAccessory.type || !newAccessory.companyId) {
      onNotify?.('Please fill all required fields', 'error');
      return;
    }

    if (newAccessory.type === 'tracked' && !newAccessory.code) {
      onNotify?.('Please enter code for tracked accessory', 'error');
      return;
    }

    if (newAccessory.type === 'bulk' && (!newAccessory.quantity || newAccessory.quantity <= 0)) {
      onNotify?.('Please enter valid quantity for bulk accessory', 'error');
      return;
    }

    try {
      const id = isUpdateMode ? newAccessory.id : uuidv4();
      const payload: Accessory = {
        ...newAccessory,
        id,
        updatedAt: serverTimestamp(),
        importDate: newAccessory.importDate || Timestamp.fromDate(new Date()),
        importPrice: newAccessory.importPrice || 0,
        retailPrice: newAccessory.retailPrice || 0,
      };

      await setDoc(doc(db, 'accessories', id), payload, { merge: true });

      setAccessories((prev) =>
        isUpdateMode
          ? prev.map((item) => (item.id === id ? payload : item))
          : [...prev, payload]
      );

      setNewAccessory({
        id: '',
        companyId: newAccessory.companyId,
        name: '',
        type: 'tracked',
        code: '',
        quantity: undefined,
        status: 'in_stock',
        importDate: Timestamp.fromDate(new Date()),
        importPrice: undefined,
        retailPrice: undefined,
        notes: '',
      });

      setIsUpdateMode(false);
      onNotify?.('Accessory saved successfully', 'success');
    } catch (error) {
      console.error('Error saving accessory:', error);
      onNotify?.('Failed to save accessory', 'error');
    }
  };

  return (
    <div className="border p-4 rounded bg-white shadow mb-6 mt-6">
      <h2 className="text-lg font-semibold mb-4">
        {isUpdateMode ? 'Update Accessory' : 'Add Accessory'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Name *</Label>
          <Input
            value={newAccessory.name}
            onChange={(e) => setNewAccessory({ ...newAccessory, name: e.target.value })}
            placeholder="e.g., Helmet, Brake Pads"
          />
        </div>

        <div>
          <Label>Type *</Label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={newAccessory.type}
            onChange={(e) =>
              setNewAccessory({
                ...newAccessory,
                type: e.target.value as AccessoryType,
                code: '',
                quantity: undefined,
              })
            }
          >
            <option value="tracked">Tracked (with Code)</option>
            <option value="bulk">Bulk (by Quantity)</option>
          </select>
        </div>

        {newAccessory.type === 'tracked' && (
          <div>
            <Label>Code *</Label>
            <Input
              value={newAccessory.code || ''}
              onChange={(e) => setNewAccessory({ ...newAccessory, code: e.target.value })}
              placeholder="Unique code"
            />
          </div>
        )}

        {newAccessory.type === 'bulk' && (
          <div>
            <Label>Quantity *</Label>
            <Input
              type="number"
              min={1}
              value={newAccessory.quantity ?? ''}
              onChange={(e) =>
                setNewAccessory({
                  ...newAccessory,
                  quantity: parseInt(e.target.value || '0', 10),
                })
              }
              placeholder="e.g., 50"
            />
          </div>
        )}

        <div>
          <Label>Status</Label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={newAccessory.status}
            onChange={(e) =>
              setNewAccessory({ ...newAccessory, status: e.target.value as Accessory['status'] })
            }
          >
            <option value="in_stock">In Stock</option>
            <option value="in_use">In Use</option>
            <option value="damaged">Damaged</option>
            <option value="lost">Lost</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        <div>
          <Label>Imported Date</Label>
          <Input
            type="date"
            value={safeFormatDate(newAccessory.importDate, 'yyyy-MM-dd')}
            onChange={(e) => {
              const dateString = e.target.value;
              const date = dateString ? new Date(dateString + 'T00:00:00') : null;
              setNewAccessory({
                ...newAccessory,
                importDate: date ? Timestamp.fromDate(date) : Timestamp.fromDate(new Date()),
              });
            }}
          />
        </div>

        <div>
          <Label>Import Price (VNĐ)</Label>
          <Input
            type="text"
            value={newAccessory.importPrice?.toLocaleString('vi-VN') ?? ''}
            onChange={(e) =>
              setNewAccessory({
                ...newAccessory,
                importPrice: parseCurrencyString(e.target.value),
              })
            }
            placeholder="e.g., 1.000.000 ₫"
          />
        </div>

        <div>
          <Label>Retail Price (VNĐ)</Label>
          <Input
            type="text"
            value={newAccessory.retailPrice?.toLocaleString('vi-VN') ?? ''}
            onChange={(e) =>
              setNewAccessory({
                ...newAccessory,
                retailPrice: parseCurrencyString(e.target.value),
              })
            }
            placeholder="e.g., 1.500.000 ₫"
          />
        </div>

        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Textarea
            value={newAccessory.notes || ''}
            onChange={(e) => setNewAccessory({ ...newAccessory, notes: e.target.value })}
            placeholder="Optional notes..."
          />
        </div>
      </div>

      <div className="mt-4 flex gap-4">
        <Button onClick={handleSave}>{isUpdateMode ? 'Update' : 'Add'}</Button>
        {isUpdateMode && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setNewAccessory({
                id: '',
                companyId: newAccessory.companyId,
                name: '',
                type: 'tracked',
                code: '',
                quantity: undefined,
                status: 'in_stock',
                importDate: Timestamp.fromDate(new Date()),
                importPrice: undefined,
                retailPrice: undefined,
                notes: '',
              });
              setIsUpdateMode(false);
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
